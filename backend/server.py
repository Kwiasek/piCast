from flask import Flask, render_template_string, redirect, request, jsonify
from flask_cors import CORS
import subprocess
import os
import threading
from dotenv import load_dotenv

load_dotenv()

CATT_CMD = os.environ.get("CATT_CMD", "catt")
YTDLP_CMD = os.environ.get("YTDLP_CMD", "yt-dlp")
PORT = int(os.environ.get("FLASK_PORT", 8080))

app = Flask(__name__)
CORS(app)   

current_ytdlp_process = None
cast_lock = threading.Lock()

def background_cast_task(url):
    global current_ytdlp_process

    with cast_lock:
        if current_ytdlp_process is not None:
            print("[THREAD] New request! Killing last yt-dlp process...")
            try:
                current_ytdlp_process.terminate()
            except Exception:
                pass
            current_ytdlp_process = None
    
    print(f"[THREAD] Parsing link: {url}")

    try:
        process = subprocess.Popen(
            [YTDLP_CMD, "-g", "-f", "best", url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        with cast_lock:
            current_ytdlp_process = process

        stdout, stderr = process.communicate()

        with cast_lock:
            if current_ytdlp_process != process:
                print("[THREAD] This thread was terminated by new one. Canceling casting.")
                return
            else:
                current_ytdlp_process = None
        
        if process.returncode == 0:
            direct_url = stdout.decode('utf-8').strip()
            if direct_url:
                print("[THREAD] Got Link! Casting...")
                subprocess.Popen([CATT_CMD, "cast", direct_url])
            else:
                print(f"[THREAD] Error yt-dlp: {stderr.decode('utf-8')}")

    except Exception as e:
        print("[THREAD] Error while casting in background: {e}")
        with cast_lock:
            if current_ytdlp_process == process:
                current_ytdlp_process = None


@app.route('/api/status')
def check_status():
    try:
        result = subprocess.run([CATT_CMD, "scan"], capture_output=True, text=True, timeout=10)
        output = result.stdout
        if "-" in output or "192." in output or "10." in output:
            return jsonify({"status": "online"})
        else:
            return jsonify({"status": "offline"})
    except Exception:
        return jsonify({"status": "offline"}), 500

@app.route('/api/cast', methods=['POST'])
def cast_video():
    data = request.json
    url = data.get('video_url', '').strip() if data else ''
    
    if url:
        thread = threading.Thread(target=background_cast_task, args=(url,))
        thread.start()
        return jsonify({"message": "Parsing video in background..."}), 200
            
    return jsonify({"error": "No link"}), 400

@app.route('/api/cmd/<action>')
def execute_command(action):
    valid_actions = ["play_toggle", "ffwd", "rewind", "restart", "stop"]
    
    if action in valid_actions:
        cmd = "seek" if action == "restart" else action
        val = "0" if action == "restart" else "30" if action in ["ffwd", "rewind"] else None
        
        catt_args = [CATT_CMD, cmd]
        if val:
            catt_args.append(val)
            
        subprocess.run(catt_args)
        return jsonify({"message": f"Executed command: {action}"}), 200
        
    return jsonify({"error": "Unknown command"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT)
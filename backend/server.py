from flask import Flask, render_template_string, redirect, request, jsonify
from flask_cors import CORS
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

CATT_CMD = os.environ.get("CATT_CMD", "catt")
YTDLP_CMD = os.environ.get("YTDLP_CMD", "yt-dlp")
PORT = int(os.environ.get("FLASK_PORT", 8080))

app = Flask(__name__, static_folder='static', static_url_path='/')

CORS(app)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/status')
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

@app.route('/cast', methods=['POST'])
def cast_video():
    data = request.json
    url = data.get('video_url', '').strip() if data else ''
    
    if url:
        try:
            direct_url = subprocess.check_output([YTDLP_CMD, "-g", "-f", "best", url]).decode('utf-8').strip()
            if direct_url:
                subprocess.Popen([CATT_CMD, "cast", direct_url])
                return jsonify({"message": "Casting Video"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    return jsonify({"error": "Missing link"}), 400

@app.route('/cmd/<action>')
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
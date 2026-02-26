import { useState, useEffect, type ReactNode } from "react"
import { Cast, Rewind, Play, FastForward, Square, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Action } from "./types/actions"

const API_URL = "http://192.168.0.22:8080/api"

function App() {
  const [status, setStatus] = useState('checking')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/status`)
    .then(res => res.json())
    .then(data => setStatus(data.status))
    .catch(() => setStatus('error'))
  }, [])

  const handleCast = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!videoUrl || status != "online") return

    try {
      await fetch(`${API_URL}/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({video_url: videoUrl})
      })
      setVideoUrl('')
    } catch (error) {
      console.error("Error sending", error)
    }
  }

  const sendCommand = async (action: Action) => {
    try {
      await fetch(`${API_URL}/cmd/${action}`, { method: 'POST'})
    } catch (error) {
      console.error("Connection error", error)
    }
}

  return (
    <div className="min-h-screen flex flex-col items-center p-6 max-w-md mx-auto">
      {/* Header */}
      <header className="text-center mt-8 mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Chromecast Remote</h1>
        <p className="text-zinc-500 font-light">Managing Youtube Player</p>
      </header>

      <main className="w-full space-y-8">
        {/* Input Section */}
        <section className="bg-[#141414] p-6 rounded-2xl border border-white/5 shadow-2xl">
          <form className="space-y-4" onSubmit={handleCast}>
            <div className="space-y-2">
              <label 
                htmlFor="youtube-url" 
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 block"
              >
                Paste link to Youtube
              </label>
              <input
                id="youtube-url"
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#222] border-none rounded-xl p-4 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Cast size={20} />
              <span>Send to Chromecast</span>
            </motion.button>
          </form>
        </section>

        {/* Controls Section */}
        <section className="grid grid-cols-3 gap-4">
          <ControlButton icon={<Rewind size={32} />} label="Rewind" action="rewind"/>
          <ControlButton 
            icon={<Play size={40} fill="currentColor" />} 
            label="Play" 
            primary 
            action="play_toggle"
          />
          <ControlButton icon={<FastForward size={32} />} label="Fast Forward" action="ffwd" />
        </section>

        <section className="grid grid-cols-2 gap-4">
          <ControlButton 
            icon={<Square size={28} fill="currentColor" />} 
            label="Stop" 
            className="text-red-500" 
            action="stop"
          />
          <ControlButton 
            icon={<RotateCcw size={28} />} 
            label="Restart" 
            action="restart"
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs">
          <div className={`w-2 h-2 rounded-full ${status == 'online' ? 'bg-emerald-500' : status == 'offline' ? 'bg-red-600' : 'bg-gray-500'} animate-pulse`} />
          {
            status == 'online' ? 
            "Connected to Chromecast" :
            status == 'offline' ?
            "Couldn't connect to Chromecast" :
            "Connecting to Chromecast"
          }
          <span>Connected to Chromecast</span>
        </div>
        <p className="text-zinc-700 text-[10px] uppercase tracking-widest">
          © 2026 Kwiasek
        </p>
      </footer>
    </div>
  )
}



function ControlButton({ 
  icon, 
  label, 
  primary = false, 
  className = "",
  handleSendCommand
}: { 
  icon: ReactNode; 
  label: string; 
  primary?: boolean;
  className?: string;
  handleSendCommand,
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      className={`
        aspect-square rounded-2xl flex items-center justify-center transition-all
        ${primary ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-[#1a1a1a] text-zinc-300 hover:bg-[#222]'}
        ${className}
      `}
      onClick={() => handleSendCommand}
    >
      {icon}
    </motion.button>
  );
}


export default App
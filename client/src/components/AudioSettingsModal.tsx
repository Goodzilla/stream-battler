import React, { useState } from 'react';
import { Volume2, VolumeX, X, Music } from 'lucide-react';
import { soundManager } from '../game/soundManager';

interface AudioSettingsModalProps {
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ onClose }) => {
  const [masterVol, setMasterVol] = useState(soundManager.getMasterVolume());
  const [musicVol, setMusicVol] = useState(soundManager.getMusicVolume());
  const [isMuted, setIsMuted] = useState(masterVol === 0);

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMasterVol(val);
    if (val > 0) setIsMuted(false);
    soundManager.setVolume(val, musicVol);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    soundManager.setVolume(masterVol, val);
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute: restore to standard master volume level
      const lastMaster = 0.3;
      setMasterVol(lastMaster);
      setIsMuted(false);
      soundManager.setVolume(lastMaster, musicVol);
    } else {
      setMasterVol(0);
      setIsMuted(true);
      soundManager.setVolume(0, musicVol);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fadeIn font-display">
      <div 
        className="glass-panel p-6 rounded-3xl max-w-sm w-full border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-[#0d121f] text-center flex flex-col relative animate-scaleUp"
        style={{
          borderColor: 'rgba(168, 85, 247, 0.2)',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition cursor-pointer"
        >
          <X size={16} />
        </button>

        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">
          Audio Options
        </h3>

        <div className="flex flex-col gap-6 text-left mb-6">
          {/* Master Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                {isMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} className="text-purple-400" />}
                Master SFX Volume
              </span>
              <span className="font-bold text-white">{Math.round(masterVol * 100)}%</span>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={handleMasterChange}
                className="flex-grow accent-purple-500 h-1 bg-black/40 rounded-lg cursor-pointer"
              />
              <button
                onClick={toggleMute}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/40 border border-white/5 text-slate-400 hover:text-white cursor-pointer hover:bg-black/60 transition"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </div>

          {/* Music Volume */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Music size={12} className="text-purple-400" />
                Music Volume
              </span>
              <span className="font-bold text-white">{Math.round(musicVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={handleMusicChange}
              className="w-full accent-purple-500 h-1 bg-black/40 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-black bg-purple-500 hover:bg-purple-400 transition-all duration-300 cursor-pointer"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-[#04060d]/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div 
        className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center max-w-md w-full relative border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scaleUp"
        style={{
          borderColor: 'rgba(6, 182, 212, 0.2)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.1)'
        }}
      >
        <div className="absolute -top-12 w-24 h-24 rounded-full bg-gradient-to-b from-[#111827] to-[#030712] border border-cyan-500 flex items-center justify-center shadow-xl">
          <AlertCircle className="w-10 h-10 text-neon-cyan animate-pulse" />
        </div>

        <h2 className="text-xl font-black text-white mt-12 mb-2 tracking-widest font-display uppercase">
          {title}
        </h2>
        <div className="text-[9px] font-pixel text-slate-500 uppercase tracking-widest mb-6">
          [ Game Notification ]
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6 px-2 whitespace-pre-line">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-xs font-display font-bold uppercase tracking-widest text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-[#00d8ff] cursor-pointer"
          style={{ 
            boxShadow: '0 4px 15px rgba(0, 216, 255, 0.3)'
          }}
        >
          Confirm & Close
        </button>
      </div>
    </div>
  );
};

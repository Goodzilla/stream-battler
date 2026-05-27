import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-[#04060d]/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div 
        className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center max-w-md w-full relative border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scaleUp"
        style={{
          borderColor: 'rgba(236, 72, 153, 0.2)', // neon pink theme for actions
          boxShadow: '0 0 40px rgba(236, 72, 153, 0.1)'
        }}
      >
        <div className="absolute -top-12 w-24 h-24 rounded-full bg-gradient-to-b from-[#111827] to-[#030712] border border-pink-500 flex items-center justify-center shadow-xl">
          <HelpCircle className="w-10 h-10 text-neon-magenta animate-pulse" />
        </div>

        <h2 className="text-xl font-black text-white mt-12 mb-2 tracking-widest font-display uppercase">
          {title}
        </h2>
        <div className="text-[9px] font-pixel text-slate-500 uppercase tracking-widest mb-6">
          [ Action Required ]
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6 px-2 whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white rounded-xl text-xs font-display font-bold uppercase tracking-widest transition duration-300 active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-xs font-display font-bold uppercase tracking-widest text-black transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] bg-neon-magenta cursor-pointer"
            style={{ 
              boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

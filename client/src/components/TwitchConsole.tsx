import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface MessageLog {
  sender: string;
  message: string;
  timestamp: number;
}

interface TwitchConsoleProps {
  streamerName: string;
  socket: Socket | null;
}

export const TwitchConsole: React.FC<TwitchConsoleProps> = ({ streamerName, socket }) => {
  const [chatLogs, setChatLogs] = useState<MessageLog[]>([]);
  const [senderName, setSenderName] = useState<string>('Viewer_Steve');
  const [messageText, setMessageText] = useState<string>('!join');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChat = (log: MessageLog) => {
      setChatLogs(prev => [...prev.slice(-40), log]); // Keep last 40 logs
    };

    socket.on('chat-log-received', handleChat);

    return () => {
      socket.off('chat-log-received', handleChat);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !messageText.trim() || !senderName.trim()) return;

    socket.emit('simulate-chat-message', {
      streamerName,
      message: messageText.trim(),
      senderName: senderName.trim()
    });

    setMessageText('');
  };

  const quickJoin = (name: string) => {
    if (!socket) return;
    socket.emit('simulate-chat-message', {
      streamerName,
      message: '!join',
      senderName: name
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border border-white/5 rounded-xl overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="bg-[#101626] px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <span className="font-display font-semibold text-white tracking-wider text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          SIMULATED TWITCH CHAT
        </span>
        <span className="text-[10px] text-[#af52de]">Channel: #{streamerName.toLowerCase()}</span>
      </div>

      {/* Logs View */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[160px] max-h-[300px] flex flex-col gap-2 bg-black/25">
        {chatLogs.length === 0 ? (
          <div className="text-slate-600 italic text-center my-auto">
            No messages. Type "!join" below to test lobby mechanics!
          </div>
        ) : (
          chatLogs.map((log, idx) => {
            const isJoin = log.message.trim().toLowerCase() === '!join';
            return (
              <div key={idx} className="leading-relaxed">
                <span className="text-[#af52de] font-bold">{log.sender}</span>
                <span className="text-slate-500">: </span>
                <span className={isJoin ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick joins */}
      <div className="px-3 py-1.5 bg-black/10 border-t border-white/5 flex flex-wrap gap-2">
        <span className="text-[10px] text-slate-500 my-auto">Mock bots:</span>
        {['Twitch_Bob', 'NeonRider', 'SwordMaster', 'GamerGranny'].map(bot => (
          <button
            key={bot}
            onClick={() => quickJoin(bot)}
            className="px-2 py-0.5 bg-purple-950/30 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300 rounded text-[10px] border border-purple-900/20"
          >
            + {bot} !join
          </button>
        ))}
      </div>

      {/* Typing Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[#101626] border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          placeholder="Name"
          className="w-24 px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-white focus:outline-none focus:border-purple-500"
          required
        />
        <input
          type="text"
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          placeholder="Type message (e.g. !join)..."
          className="flex-1 px-2 py-1.5 bg-[#05070a] border border-white/5 rounded text-white focus:outline-none focus:border-purple-500"
          required
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold font-display"
        >
          SEND
        </button>
      </form>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, Send, ChevronRight, ChevronLeft, Flame, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { MiniSprite } from './MiniSprite';
import { AudioSettingsModal } from './AudioSettingsModal';

interface ChatMessage {
  id: string;
  sender: string;
  charClass: string;
  level: number;
  message: string;
  timestamp: number;
}

interface OnlinePlayer {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  level: number;
  location: string;
}

interface WildernessSession {
  userId: string;
  username: string;
  displayName: string;
  charClass: string;
  xpAccumulated: number;
  goldAccumulated: number;
  itemsAccumulated: any[];
  damageDealt: number;
  healingDone: number;
  joinedAt: number;
}

const CLASS_COLORS: Record<string, string> = {
  WARRIOR: '#3b82f6', // blue
  MAGE: '#a855f7', // purple
  CLERIC: '#eab308', // gold/yellow
  ROGUE: '#ef4444', // red
  RANGER: '#22c55e', // green
  VALKYRIE: '#ec4899', // pink
  NECROMANCER: '#af52de', // dark purple
  MONK: '#f59e0b', // amber
  ALCHEMIST: '#10b981', // emerald
  BARD: '#f97316', // orange
};

export const MmoSidebar: React.FC = () => {
  const { user, character } = useAuth();
  const { socket } = useSocket();

  const [isOpen, setIsOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'ROSTER' | 'SESSION'>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [wildernessSessions, setWildernessSessions] = useState<WildernessSession[]>([]);
  const [inputText, setInputText] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize online registration & listen to updates
  useEffect(() => {
    if (!socket || !character) return;

    // Register active user in online users roster
    socket.emit('register-active-user', {
      userId: character.userId,
      username: character.user.username,
      displayName: character.user.displayName,
      charClass: character.class,
      level: character.level,
      location: 'Town'
    });

    // Listen to online roster changes
    const handleRosterUpdate = (players: OnlinePlayer[]) => {
      setOnlinePlayers(players);
    };

    // Listen to incoming global messages
    const handleChatReceived = (msg: ChatMessage) => {
      setMessages(prev => {
        // Keep last 100 messages
        const updated = [...prev, msg];
        if (updated.length > 100) updated.shift();
        return updated;
      });
    };

    // Listen to Wilderness session sync updates
    const handleSessionUpdate = (sessions: WildernessSession[]) => {
      setWildernessSessions(sessions);
    };

    socket.on('online-players-update', handleRosterUpdate);
    socket.on('chat-message-received', handleChatReceived);
    socket.on('wilderness-session-update', handleSessionUpdate);

    return () => {
      socket.off('online-players-update', handleRosterUpdate);
      socket.off('chat-message-received', handleChatReceived);
      socket.off('wilderness-session-update', handleSessionUpdate);
    };
  }, [socket, character]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeTab === 'CHAT') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputText.trim()) return;

    socket.emit('send-global-chat', { message: inputText.trim() });
    setInputText('');
  };

  if (!user) return null;

  return (
    <div
      className={`h-full border-l border-white/5 bg-[#090d16]/95 backdrop-blur-md flex flex-col relative transition-all duration-300 z-30 shrink-0 ${
        isOpen ? 'w-80' : 'w-12'
      }`}
    >
      {/* Toggle Tab Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#121826] border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg z-40 transition-colors"
      >
        {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {isOpen ? (
        // EXPANDED STATE
        <div className="h-full flex flex-col overflow-hidden animate-fadeIn">
          {/* Header tabs */}
          <div className="flex border-b border-white/5 bg-black/20 p-2 gap-1 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'CHAT'
                  ? 'bg-purple-600/35 text-white border border-purple-500/35'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <MessageSquare size={11} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'ROSTER'
                  ? 'bg-purple-600/35 text-white border border-purple-500/35'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users size={11} />
              Online ({onlinePlayers.length})
            </button>
            {wildernessSessions.length > 0 && (
              <button
                onClick={() => setActiveTab('SESSION')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-display uppercase tracking-wider font-bold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'SESSION'
                    ? 'bg-purple-600/35 text-white border border-purple-500/35 border-purple-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Flame size={11} className="text-red-400 animate-pulse" />
                Session
              </button>
            )}
          </div>

          {/* Tab contents */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'CHAT' ? (
              // GLOBAL CHAT ROOM
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat Message Scrollport */}
                <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar font-mono">
                  {messages.length === 0 ? (
                    <div className="text-center text-[10px] text-slate-500 uppercase tracking-wider py-8 font-mono select-none">
                      No chat messages yet.<br />Say hello in global chat!
                    </div>
                  ) : (
                    messages.map(msg => {
                      const color = CLASS_COLORS[msg.charClass] || '#ffffff';
                      return (
                        <div key={msg.id} className="text-[11px] font-mono leading-relaxed border-b border-white/[0.02] pb-1 animate-fadeIn">
                          <span className="text-slate-500 mr-1">
                            [{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                          </span>
                          <span
                            className="font-bold cursor-help"
                            style={{ color }}
                            title={`Lvl ${msg.level} ${msg.charClass}`}
                          >
                            {msg.sender}
                          </span>
                          <span className="text-slate-400">: </span>
                          <span className="text-slate-200 break-words">{msg.message}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat message input form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-white/5 bg-black/30 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Send global message..."
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                    maxLength={150}
                  />
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-500/20 text-white flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    <Send size={12} />
                  </button>
                </form>
              </div>
            ) : activeTab === 'ROSTER' ? (
              // ONLINE PLAYERS ROSTER
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
                {onlinePlayers.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest py-8">
                    No online players.
                  </div>
                ) : (
                  onlinePlayers.map(p => {
                    const color = CLASS_COLORS[p.charClass] || '#ffffff';
                    return (
                      <div
                        key={p.userId}
                        className="bg-[#0b0f19]/80 border border-white/5 rounded-xl p-2 flex items-center gap-2.5 transition duration-300 hover:bg-[#121622]"
                      >
                        <MiniSprite classType={p.charClass} color={color} size={1.4} />

                        <div className="flex-grow flex flex-col gap-0.5 min-w-0 font-mono text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white truncate max-w-[100px]" style={{ color }}>
                              {p.displayName}
                            </span>
                            <span className="text-[8px] text-slate-500">
                              Lvl {p.level}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[8px] text-slate-400">
                            <span className="font-semibold uppercase tracking-wider text-[8px]" style={{ color }}>
                              {p.charClass}
                            </span>
                            <span className="text-slate-500 truncate max-w-[110px]" title={p.location}>
                              📍 {p.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // WILDERNESS SESSION STATS
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-display border-b border-white/5 pb-2 mb-1 flex justify-between items-center select-none font-bold">
                  <span>Wilderness Session</span>
                  <span className="text-[8px] font-mono text-red-400 animate-pulse bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded">Active</span>
                </div>
                {wildernessSessions.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest py-8">
                    No active sessions.
                  </div>
                ) : (() => {
                  const totalActivity = wildernessSessions.reduce((sum, ws) => sum + ws.damageDealt + ws.healingDone, 0);
                  return wildernessSessions.map(s => {
                    const color = CLASS_COLORS[s.charClass] || '#ffffff';
                    const elapsedMin = Math.round((Date.now() - s.joinedAt) / 60000);
                    const playerActivity = s.damageDealt + s.healingDone;
                    const participationPct = totalActivity > 0 ? Math.round((playerActivity / totalActivity) * 100) : 0;
                    return (
                      <div
                        key={s.userId}
                        className="bg-[#0b0f19]/80 border border-white/5 rounded-xl p-3 flex flex-col gap-2 transition duration-300 hover:bg-[#121622]"
                      >
                        <div className="flex items-center gap-2">
                          <MiniSprite classType={s.charClass} color={color} size={1.3} />
                          <div className="flex-grow flex flex-col min-w-0 font-mono text-[10px]">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white truncate max-w-[110px]" style={{ color }}>
                                {s.displayName}
                              </span>
                              <span className="text-[8px] text-slate-500">
                                {elapsedMin} min
                              </span>
                            </div>
                            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color }}>
                              {s.charClass}
                            </span>
                          </div>
                        </div>

                        {/* Roster Progress Details */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/35 p-2 rounded-lg border border-white/[0.03]">
                          <div>
                            <span className="text-slate-500 block uppercase tracking-wider text-[8px]">Gold</span>
                            <span className="text-yellow-400 font-bold">+{s.goldAccumulated}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase tracking-wider text-[8px]">XP</span>
                            <span className="text-cyan-400 font-bold">+{s.xpAccumulated}</span>
                          </div>
                          <div className="col-span-2 border-t border-white/[0.05] pt-1 mt-1 flex flex-col gap-0.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Items Found:</span>
                              <span className="text-white font-bold">{s.itemsAccumulated.length} items</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dmg Dealt:</span>
                              <span className="text-orange-400 font-bold">{s.damageDealt}</span>
                            </div>
                            {s.healingDone > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Heals:</span>
                                <span className="text-emerald-400 font-bold">{s.healingDone}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-white/[0.05] pt-1 mt-1">
                              <span className="text-slate-500">Participation:</span>
                              <span className="text-purple-400 font-bold">{participationPct}%</span>
                            </div>
                          </div>
                        </div>

                        {/* List item names on hover if items found */}
                        {s.itemsAccumulated.length > 0 && (
                          <div className="text-[8px] font-mono text-purple-300 leading-normal pl-1 border-l border-purple-500/20 max-h-12 overflow-y-auto custom-scrollbar uppercase">
                            {s.itemsAccumulated.map((item, idx) => (
                              <div key={idx} className="truncate">
                                • {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Sidebar Footer with Settings */}
          <div className="p-3 border-t border-white/5 bg-black/10 flex justify-between items-center shrink-0">
            <span className="text-[8px] text-slate-600 font-mono">V1.0.0</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition border border-white/5 hover:border-white/10 px-2 py-1 rounded bg-white/[0.02] cursor-pointer"
            >
              <Settings size={11} />
              Audio Options
            </button>
          </div>
        </div>
      ) : (
        // COLLAPSED STATE (Ribbon icons)
        <div className="h-full flex flex-col items-center pt-4 gap-6 select-none shrink-0 pointer-events-none">
          <div
            onClick={() => {
              setIsOpen(true);
              setActiveTab('CHAT');
            }}
            className="w-8 h-8 rounded-xl bg-black/45 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer pointer-events-auto transition active:scale-90"
            title="Open Global Chat"
          >
            <MessageSquare size={14} />
          </div>
          <div
            onClick={() => {
              setIsOpen(true);
              setActiveTab('ROSTER');
            }}
            className="w-8 h-8 rounded-xl bg-black/45 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer pointer-events-auto transition active:scale-90"
            title={`Online Players (${onlinePlayers.length})`}
          >
            <Users size={14} />
          </div>
          
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-xl bg-black/45 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer pointer-events-auto transition active:scale-90 mt-auto mb-4"
            title="Audio Settings"
          >
            <Settings size={14} />
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <AudioSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

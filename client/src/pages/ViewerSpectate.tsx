import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ArrowLeft, Users } from 'lucide-react';
import { lerp } from '../game/physics';
import confetti from 'canvas-confetti';

interface ViewerSpectateProps {
  user: any;
  streamerName: string;
  socket: Socket | null;
  onBackToDashboard: () => void;
}

interface SpectatorUnit {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
  isPlayer: boolean;
  classType?: string;
  // Local interpolation targets
  tx?: number;
  ty?: number;
}

export const ViewerSpectate: React.FC<ViewerSpectateProps> = ({
  user,
  streamerName,
  socket,
  onBackToDashboard
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lobby, setLobby] = useState<any | null>(null);
  const [battleState, setBattleState] = useState<'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('LOBBY');
  const [personalReward, setPersonalReward] = useState<any | null>(null);

  const stateRef = useRef<{
    units: SpectatorUnit[];
    projectiles: any[];
    damageTexts: any[];
    battleState: 'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
  }>({
    units: [],
    projectiles: [],
    damageTexts: [],
    battleState: 'LOBBY'
  });

  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join-lobby', {
      streamerName,
      userId: user.id,
      username: user.username,
      displayName: user.displayName
    });

    const handleLobbyUpdate = (updatedLobby: any) => {
      setLobby(updatedLobby);
      if (updatedLobby.status === 'FIGHTING' && stateRef.current.battleState === 'LOBBY') {
        stateRef.current.battleState = 'FIGHTING';
        setBattleState('FIGHTING');
        initSpectateCanvas();
      }
    };

    const handleRaidStarted = (updatedLobby: any) => {
      setLobby(updatedLobby);
      stateRef.current.battleState = 'FIGHTING';
      setBattleState('FIGHTING');
      initSpectateCanvas();
    };

    const handleRaidBroadcast = (snapshot: any) => {
      const s = stateRef.current;
      if (s.battleState !== 'FIGHTING') return;

      // Update unit positions with targets for interpolation
      const receivedIds = new Set(snapshot.units.map((u: any) => u.id));

      snapshot.units.forEach((snapU: any) => {
        const existing = s.units.find(u => u.id === snapU.id);
        if (existing) {
          existing.tx = snapU.x;
          existing.ty = snapU.y;
          existing.hp = snapU.hp;
          existing.maxHp = snapU.maxHp;
          existing.color = snapU.color;
          existing.name = snapU.name;
        } else {
          s.units.push({
            id: snapU.id,
            name: snapU.name,
            x: snapU.x,
            y: snapU.y,
            tx: snapU.x,
            ty: snapU.y,
            hp: snapU.hp,
            maxHp: snapU.maxHp,
            color: snapU.color,
            isPlayer: snapU.isPlayer,
            classType: snapU.classType
          });
        }
      });

      // Remove units not in snapshot
      s.units = s.units.filter(u => receivedIds.has(u.id));

      // Append new laser/projectiles and damage floats directly
      s.projectiles = snapshot.projectiles || [];
      s.damageTexts = snapshot.damageTexts || [];
    };

    const handleRaidEnded = (results: any) => {
      stateRef.current.battleState = results.success ? 'VICTORY' : 'DEFEAT';
      setBattleState(results.success ? 'VICTORY' : 'DEFEAT');

      // Check if there's a reward for this viewer!
      if (results.rewards && results.rewards[user.id]) {
        setPersonalReward(results.rewards[user.id]);
        if (results.success) {
          confetti({ particleCount: 50, spread: 60 });
        }
      }
    };

    socket.on('lobby-update', handleLobbyUpdate);
    socket.on('raid-started', handleRaidStarted);
    socket.on('raid-state-broadcast', handleRaidBroadcast);
    socket.on('raid-ended', handleRaidEnded);

    return () => {
      socket.off('lobby-update', handleLobbyUpdate);
      socket.off('raid-started', handleRaidStarted);
      socket.off('raid-state-broadcast', handleRaidBroadcast);
      socket.off('raid-ended', handleRaidEnded);
    };
  }, [socket, streamerName, user.id]);

  const initSpectateCanvas = () => {
    stateRef.current.units = [];
    stateRef.current.projectiles = [];
    stateRef.current.damageTexts = [];
  };

  // Canvas drawing and interpolation loop
  useEffect(() => {
    if (battleState !== 'FIGHTING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      ctx.fillStyle = '#06080d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      const s = stateRef.current;

      // 1. INTERPOLATE AND DRAW UNITS
      s.units.forEach(unit => {
        // Interpolate position from current (x,y) to targets (tx,ty)
        if (unit.tx !== undefined && unit.ty !== undefined) {
          // Lerp rate: 0.15 for smooth drag
          unit.x = lerp(unit.x, unit.tx, 0.15);
          unit.y = lerp(unit.y, unit.ty, 0.15);
        }

        const isB = !unit.isPlayer;
        const r = isB ? 30 : 12;

        ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
        ctx.strokeStyle = unit.color;
        ctx.lineWidth = isB ? 4 : 2;
        ctx.shadowColor = unit.color;
        ctx.shadowBlur = isB ? 20 : 10;

        ctx.beginPath();
        if (isB) {
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const px = unit.x + r * Math.cos(angle);
            const py = unit.y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else {
          ctx.arc(unit.x, unit.y, r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset

        // Name
        ctx.fillStyle = '#94a3b8';
        ctx.font = isB ? 'bold 10px Orbitron, sans-serif' : '8px font-display, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.name, unit.x, unit.y - r - 12);

        // HP bar
        const barW = isB ? 80 : 24;
        const barH = isB ? 5 : 3;
        const bx = unit.x - barW / 2;
        const by = unit.y - r - 6;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(bx, by, barW, barH);

        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = !isB ? '#34c759' : '#ff9500';
        ctx.fillRect(bx, by, barW * hpPct, barH);
      });

      // 2. DRAW PROJECTILES
      s.projectiles.forEach(p => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.fx, p.fy);
        ctx.lineTo(p.tx, p.ty);
        ctx.stroke();
      });

      // 3. DRAW DAMAGE FLOATS
      s.damageTexts.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = ft.isCrit ? '900 11px Orbitron, sans-serif' : '700 9px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [battleState]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Leave Lobby
        </button>

        <span className="text-xs text-neon-cyan font-display font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          Raid Viewer: #{streamerName.toUpperCase()}
        </span>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Canvas or Lobby status */}
        <div className="md:col-span-3">
          {battleState === 'LOBBY' ? (
            <div className="glass-panel p-6 border-white/5 bg-[#0b0f19] text-center py-12">
              <h3 className="m-0 text-white font-display text-base tracking-wider uppercase mb-2 flex items-center justify-center gap-2">
                <Users size={18} className="text-neon-cyan" />
                Joined Lobby: #{streamerName.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
                You are in the raid queue! Sit tight, the streamer will begin the raid shortly. Make sure your character gear is ready on the dashboard.
              </p>
              <div className="w-12 h-12 border-4 border-t-[#00d8ff] border-white/5 rounded-full animate-spin mx-auto mb-8" />

              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Joined Viewers count: <span className="text-white font-bold">{lobby?.viewers.length || 0}</span>
              </div>
            </div>
          ) : battleState === 'FIGHTING' ? (
            <div className="border border-white/5 rounded-xl overflow-hidden shadow-2xl bg-[#06080d]">
              <canvas ref={canvasRef} width="760" height="400" className="w-full block aspect-[760/400]" />
            </div>
          ) : (
            // Finished
            <div className="glass-panel p-8 border-white/5 text-center flex flex-col items-center">
              <h3
                className={`m-0 font-display text-2xl tracking-widest ${
                  battleState === 'VICTORY' ? 'text-emerald-400' : 'text-red-500'
                }`}
              >
                {battleState === 'VICTORY' ? 'RAID CLEAR!' : 'RAID WIPED'}
              </h3>
              <p className="text-slate-500 text-[10px] uppercase font-display tracking-widest mt-1 mb-8">
                {battleState === 'VICTORY' ? 'Streamer party defeated the boss!' : 'All characters fell.'}
              </p>

              {/* Personal rewards display */}
              {personalReward ? (
                <div className="w-full max-w-sm bg-[#0b0f19] border border-white/5 rounded-xl p-4 text-left flex flex-col gap-3">
                  <span className="block text-[9px] font-display text-[#00d8ff] uppercase tracking-widest border-b border-white/5 pb-2">
                    YOUR RAID LOOT:
                  </span>
                  <div className="flex flex-col gap-2.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Gold Secured:</span>
                      <span className="text-yellow-400 font-bold">+{personalReward.gold}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>XP Gained:</span>
                      <span className="text-emerald-400 font-bold">+{personalReward.xp} XP</span>
                    </div>

                    {personalReward.itemDropped && (
                      <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col gap-1 item-slot-glow rarity-LEGENDARY">
                        <div className="flex justify-between items-center">
                          <span className={`font-display font-bold rarity-${personalReward.itemDropped.rarity}`}>
                            {personalReward.itemDropped.name}
                          </span>
                          <span className="text-[9px] px-1 bg-yellow-500/10 text-yellow-500 rounded font-mono uppercase">
                            {personalReward.itemDropped.rarity}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">
                          Slot: {personalReward.itemDropped.slot} | Level {personalReward.itemDropped.itemLevel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic max-w-xs leading-relaxed">
                  {battleState === 'VICTORY'
                    ? 'Raid was successful, but you did not roll any item drops this time. Better luck next stream!'
                    : 'No loot awarded for failed runs. Level up your gear to survive longer!'}
                </div>
              )}

              <button
                onClick={onBackToDashboard}
                className="mt-8 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <div className="glass-panel p-4 border-white/5 text-xs flex flex-col gap-3">
            <h4 className="m-0 text-white font-display text-xs tracking-wider uppercase border-b border-white/5 pb-2">
              LOBBY INFO
            </h4>

            <div className="flex justify-between">
              <span className="text-slate-400">Host:</span>
              <span className="text-white font-bold">#{streamerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Boss Level:</span>
              <span className="text-white font-bold">Lvl {lobby?.bossLevel}</span>
            </div>

            <div className="mt-4 border-t border-white/5 pt-4">
              <span className="block text-[9px] font-display text-slate-500 uppercase tracking-widest mb-2">
                Participants:
              </span>
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                {lobby?.viewers.map((viewer: any) => (
                  <div key={viewer.userId} className="flex justify-between font-mono text-[10px]">
                    <span className="text-white truncate max-w-[90px]">{viewer.displayName}</span>
                    <span className="text-slate-500">Lvl {viewer.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ArrowLeft, Users } from 'lucide-react';
import { lerp, getDistance } from '../game/physics';
import confetti from 'canvas-confetti';
import { drawPixelSprite } from '../game/sprites';
import { soundManager } from '../game/soundManager';

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
  // Juice
  flashTimer?: number;
  flashColor?: string;
  // Stats tracking
  damageDealt?: number;
  healingDone?: number;
  damageTaken?: number;
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
  const [recapStats, setRecapStats] = useState<any[] | null>(null);
  const [recapTick, setRecapTick] = useState(0);
  void recapTick;


  const stateRef = useRef<{
    units: SpectatorUnit[];
    projectiles: any[];
    damageTexts: any[];
    battleState: 'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
    shakeTimer: number;
    shakeIntensity: number;
  }>({
    units: [],
    projectiles: [],
    damageTexts: [],
    battleState: 'LOBBY',
    shakeTimer: 0,
    shakeIntensity: 0
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
        soundManager.startMusic();
        initSpectateCanvas();
      }
    };

    const handleRaidStarted = (updatedLobby: any) => {
      setLobby(updatedLobby);
      stateRef.current.battleState = 'FIGHTING';
      setBattleState('FIGHTING');
      soundManager.startMusic();
      initSpectateCanvas();
    };

    const handleRaidBroadcast = (snapshot: any) => {
      const s = stateRef.current;
      if (s.battleState !== 'FIGHTING') return;

      // Update unit positions with targets for interpolation
      const receivedIds = new Set(snapshot.units.map((u: any) => u.id));

      // Trigger screen shake on crits or laser bursts
      const hasCrit = snapshot.damageTexts?.some((dt: any) => dt.isCrit);
      if (hasCrit) {
        s.shakeTimer = 0.15;
        s.shakeIntensity = 6;
      }

      const hasLaser = snapshot.projectiles?.some(
        (p: any) => p.color === '#ff9500' && getDistance({ x: p.fx, y: p.fy }, { x: p.tx, y: p.ty }) > 250
      );
      if (hasLaser) {
        s.shakeTimer = 0.4;
        s.shakeIntensity = 12;
      }

      snapshot.units.forEach((snapU: any) => {
        const existing = s.units.find(u => u.id === snapU.id);
        if (existing) {
          // HP delta triggers flashing
          if (snapU.hp < existing.hp) {
            existing.flashTimer = 0.1;
            existing.flashColor = snapU.isPlayer ? '#ffffff' : '#ff3b30';
          }
          existing.tx = snapU.x;
          existing.ty = snapU.y;
          existing.hp = snapU.hp;
          existing.maxHp = snapU.maxHp;
          existing.color = snapU.color;
          existing.name = snapU.name;
          existing.damageDealt = snapU.damageDealt || 0;
          existing.healingDone = snapU.healingDone || 0;
          existing.damageTaken = snapU.damageTaken || 0;
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
            classType: snapU.classType,
            damageDealt: snapU.damageDealt || 0,
            healingDone: snapU.healingDone || 0,
            damageTaken: snapU.damageTaken || 0
          });
        }
      });

      // Remove units not in snapshot
      s.units = s.units.filter(u => receivedIds.has(u.id));

      // Append projectiles and damage floats
      s.projectiles = snapshot.projectiles || [];
      s.damageTexts = snapshot.damageTexts || [];
    };

    const handleRaidEnded = (results: any) => {
      stateRef.current.battleState = results.success ? 'VICTORY' : 'DEFEAT';
      setBattleState(results.success ? 'VICTORY' : 'DEFEAT');
      setRecapStats(results.recapStats || null);

      if (results.success) {
        soundManager.playVictory();
      } else {
        soundManager.playDefeat();
      }

      // Check if there's a reward for this viewer!
      if (results.rewards && results.rewards[user.id]) {
        setPersonalReward(results.rewards[user.id]);
        if (results.success) {
          confetti({ particleCount: 50, spread: 60 });
        }
      }
    };

    const handleLobbyClosed = () => {
      alert("The streamer has closed the lobby or disconnected.");
      onBackToDashboard();
    };

    const handleLobbyError = (err: any) => {
      alert(err.error || 'A lobby error occurred');
    };

    socket.on('lobby-update', handleLobbyUpdate);
    socket.on('raid-started', handleRaidStarted);
    socket.on('raid-state-broadcast', handleRaidBroadcast);
    socket.on('raid-ended', handleRaidEnded);
    socket.on('lobby-closed', handleLobbyClosed);
    socket.on('lobby-error', handleLobbyError);

    return () => {
      socket.off('lobby-update', handleLobbyUpdate);
      socket.off('raid-started', handleRaidStarted);
      socket.off('raid-state-broadcast', handleRaidBroadcast);
      socket.off('raid-ended', handleRaidEnded);
      socket.off('lobby-closed', handleLobbyClosed);
      socket.off('lobby-error', handleLobbyError);
      soundManager.stopMusic();
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
    let lastTime = performance.now();
    let frameCount = 0;

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      frameCount++;
      if (frameCount % 15 === 0) {
        setRecapTick(f => f + 1);
      }

      const level = lobby?.bossLevel || 1;
      const s = stateRef.current;


      // Screen shake duration tick
      if (s.shakeTimer > 0) {
        s.shakeTimer -= dt;
      }

      ctx.save();
      if (s.shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * s.shakeIntensity;
        const dy = (Math.random() - 0.5) * s.shakeIntensity;
        ctx.translate(dx, dy);
      }

      // Draw themed background based on boss level
      if (level <= 20) {
        // Grassy forest
        ctx.fillStyle = '#08170e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f2919';
        for (let i = 0; i < 25; i++) {
          ctx.fillRect((i * 47) % canvas.width, (i * 31) % canvas.height, 8, 3);
          ctx.fillRect((i * 47) % canvas.width + 3, (i * 31) % canvas.height - 3, 2, 6);
        }
      } else if (level <= 40) {
        // Poison Caves
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#a855f7';
        for (let i = 0; i < 15; i++) {
          const px = (i * 73) % canvas.width;
          const py = (i * 29) % canvas.height;
          ctx.fillRect(px, py, 3, 3);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
          ctx.beginPath();
          ctx.arc(px + 1.5, py + 1.5, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#a855f7';
        }
      } else if (level <= 60) {
        // Ancient Ruins
        ctx.fillStyle = '#171412';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#24201e';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < canvas.width; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      } else if (level <= 80) {
        // Crypt theme
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
        for (let i = 0; i < 5; i++) {
          const px = 100 + i * 140;
          ctx.fillRect(px, 0, 40, canvas.height);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
          ctx.fillRect(px + 10, 0, 20, canvas.height);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
        }
      } else {
        // Volcano Lava River
        ctx.fillStyle = '#0a0807';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 60);
        ctx.bezierCurveTo(canvas.width / 3, canvas.height - 100, (canvas.width * 2) / 3, canvas.height - 30, canvas.width, canvas.height - 70);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      // Update unit hit flash timers
      s.units.forEach(unit => {
        if (unit.flashTimer && unit.flashTimer > 0) {
          unit.flashTimer -= dt;
        }
      });

      // 1. INTERPOLATE AND DRAW UNITS
      s.units.forEach(unit => {
        if (unit.tx !== undefined && unit.ty !== undefined) {
          unit.x = lerp(unit.x, unit.tx, 0.15);
          unit.y = lerp(unit.y, unit.ty, 0.15);
        }

        if (unit.hp <= 0) return;

        const isB = !unit.isPlayer;
        const r = isB ? 44 : 16;
        const uFlash = (unit.flashTimer && unit.flashTimer > 0) ? unit.flashColor : undefined;

        // Render retro 2D pixel-art sprite
        if (unit.isPlayer) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'WARRIOR', 2.4, false, unit.color, uFlash);
        } else {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'GOBLIN', 5.5, true, unit.color, uFlash);
        }

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
        ctx.lineWidth = 2.5;
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

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [battleState]);

  if (battleState === 'FIGHTING') {
    const bossUnit = stateRef.current.units.find(u => !u.isPlayer);
    const bossHp = bossUnit?.hp || 0;
    const bossMaxHp = bossUnit?.maxHp || 100;
    const livingPlayers = stateRef.current.units.filter(u => u.isPlayer && u.hp > 0).length;
    const totalPlayers = stateRef.current.units.filter(u => u.isPlayer).length;

    return (
      <div className="fixed inset-0 bg-[#06080d] z-40 flex flex-col overflow-hidden select-none animate-fadeIn">
        {/* Widescreen Header */}
        <div className="h-14 border-b border-white/5 bg-[#090e1a] px-6 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-display flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            SPECTATING RAID: #{streamerName.toUpperCase()}'S ROOM
          </span>

          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-[10px] font-display font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg bg-black/25"
          >
            <ArrowLeft size={12} />
            Leave Room
          </button>
        </div>

        {/* Split Main Body */}
        <div className="flex-grow flex flex-row overflow-hidden">
          {/* Left Canvas Port */}
          <div className="flex-grow relative flex items-center justify-center p-4 bg-[#030407]">
            <canvas
              ref={canvasRef}
              width="1200"
              height="600"
              className="w-full h-full max-w-full max-h-full object-contain block"
            />
          </div>

          {/* Right Live Recap Sidebar */}
          <div className="w-80 border-l border-white/5 bg-[#090e1a]/95 flex flex-col p-4 gap-4 overflow-y-auto">
            <h4 className="m-0 text-white font-display text-xs tracking-wider uppercase border-b border-white/5 pb-2">
              Raid Live Stats
            </h4>

            {/* Live Metrics List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-2 pr-1">
              {stateRef.current.units
                .filter(u => u.isPlayer)
                .map(p => {
                  const dmg = p.damageDealt || 0;
                  const heal = p.healingDone || 0;
                  const taken = p.damageTaken || 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-[#0b0f19]/80 border border-white/5 rounded-lg p-2.5 flex flex-col gap-1 text-[10px] font-mono animate-fadeIn"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5 truncate max-w-[120px]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                        {p.hp <= 0 && (
                          <span className="text-[9px] bg-red-950/40 text-red-500 border border-red-950 px-1 rounded uppercase font-bold">
                            DEAD
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1">
                        <span>Dmg: <strong className="text-orange-400">{dmg}</strong></span>
                        <span>Heal: <strong className="text-emerald-400">{heal}</strong></span>
                        <span>Tanked: <strong className="text-blue-400">{taken}</strong></span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span>Total Viewers:</span>
                <span className="text-white font-bold">{totalPlayers}</span>
              </div>
              <div className="flex justify-between">
                <span>Living Party:</span>
                <span className="text-emerald-400 font-bold">
                  {livingPlayers} / {totalPlayers}
                </span>
              </div>

              {/* Boss health bar */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Boss Health:</span>
                  <span className="text-orange-400 font-bold">
                    {bossHp} / {bossMaxHp}
                  </span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-orange-500 h-full transition-all duration-100"
                    style={{
                      width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6 select-none animate-fadeIn">
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
        {/* Lobby status */}
        <div className="md:col-span-3">
          {battleState === 'LOBBY' && (
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

      {/* Viewport independent Fullscreen Results Modal */}
      {(battleState === 'VICTORY' || battleState === 'DEFEAT') && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4 md:p-8 select-none animate-fadeIn">
          <div className="bg-[#0b0f19]/95 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col items-center shadow-2xl relative animate-scaleUp">
            
            <h3
              className={`m-0 font-display text-2xl tracking-widest ${
                battleState === 'VICTORY' ? 'text-emerald-400' : 'text-red-500'
              }`}
            >
              {battleState === 'VICTORY' ? 'RAID CLEAR!' : 'RAID WIPED'}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase font-display tracking-widest mt-1 mb-6">
              {battleState === 'VICTORY' ? 'Streamer party defeated the boss!' : 'All characters fell.'}
            </p>

            {/* MVP Crown and detailed stats table */}
            {recapStats && recapStats.length > 0 && (
              <div className="w-full max-w-xl mb-6">
                {/* MVP Crown Block */}
                <div className="bg-gradient-to-r from-yellow-950/35 via-yellow-900/20 to-yellow-950/35 border border-yellow-500/30 rounded-xl p-5 mb-5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                  <span className="text-yellow-400 text-3xl block mb-1">👑</span>
                  <span className="text-[10px] font-pixel text-yellow-400 uppercase tracking-widest">[ Raid MVP ]</span>
                  <h4 className="m-0 text-white font-display text-base font-extrabold uppercase mt-1">
                    {recapStats[0].name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                    Class: <span style={{ color: recapStats[0].color }} className="font-bold">{recapStats[0].classType}</span> | Score: <span className="text-yellow-400 font-bold">{Math.round(recapStats[0].score)}</span>
                  </p>
                  <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Damage</span>
                      <span className="text-orange-400 font-bold">{recapStats[0].damageDealt}</span>
                    </div>
                    <div className="border-l border-white/5 pl-6">
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Healing</span>
                      <span className="text-emerald-400 font-bold">{recapStats[0].healingDone}</span>
                    </div>
                    <div className="border-l border-white/5 pl-6">
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Tanked</span>
                      <span className="text-blue-400 font-bold">{recapStats[0].damageTaken}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Performance Table */}
                <div className="bg-[#05070a] border border-white/5 rounded-xl p-4 flex flex-col gap-3 text-left">
                  <span className="text-[10px] font-pixel text-neon-cyan uppercase tracking-widest">[ COMBAT STATS RECAP ]</span>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 text-left">
                          <th className="pb-2 font-normal uppercase tracking-wider">Participant</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">DPS (Dealt)</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">Healing</th>
                          <th className="pb-2 font-normal uppercase tracking-wider text-right">Tanked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recapStats.map((p, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-white font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                              {p.name}
                              {idx === 0 && <span className="text-yellow-400 text-[10px]" title="MVP">👑</span>}
                            </td>
                            <td className="py-2 text-right text-orange-400 font-bold">{p.damageDealt}</td>
                            <td className="py-2 text-right text-emerald-400 font-bold">{p.healingDone}</td>
                            <td className="py-2 text-right text-blue-400 font-bold">{p.damageTaken}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Personal rewards display */}
            {personalReward ? (
              <div className="w-full max-w-sm bg-[#05070a] border border-white/5 rounded-xl p-4 text-left flex flex-col gap-3 mb-6 animate-fadeIn">
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
                    <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col gap-1 item-slot-glow rarity-LEGENDARY animate-pulse-slow">
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
              <div className="text-xs text-slate-500 italic max-w-xs leading-relaxed mb-6">
                {battleState === 'VICTORY'
                  ? 'Raid was successful, but you did not roll any item drops this time. Better luck next stream!'
                  : 'No loot awarded for failed runs. Level up your gear to survive longer!'}
              </div>
            )}

            <button
              onClick={onBackToDashboard}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-display font-bold uppercase tracking-wider transition w-full"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

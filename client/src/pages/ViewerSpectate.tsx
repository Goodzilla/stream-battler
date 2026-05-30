import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { lerp, getDistance } from '../game/physics';
import confetti from 'canvas-confetti';
import { getArenaConfigForLevel, RAID_ARENA_CONFIGS } from 'shared';
import { drawPixelSprite, drawProceduralBackground } from '../game/sprites';
import { soundManager } from '../game/soundManager';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useUI } from '../contexts/UIContext';
import { MiniSprite } from '../components/MiniSprite';
import { CharacterVisualizer } from '../components/CharacterVisualizer';

interface ViewerSpectateProps {
  streamerName: string;
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
  level?: number;
  stagger?: number;
  maxStagger?: number;
  staggered?: boolean;
  lagHp?: number;
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
  streamerName,
  onBackToDashboard
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showAlert } = useUI();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [lobby, setLobby] = useState<any | null>(null);
  const [battleState, setBattleState] = useState<'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('LOBBY');
  const [personalReward, setPersonalReward] = useState<any | null>(null);
  const [recapStats, setRecapStats] = useState<any[] | null>(null);
  const [recapTick, setRecapTick] = useState(0);
  void recapTick;


  const [activeTab, setActiveTab] = useState<'DPS' | 'HEALING' | 'TANKED'>('DPS');

  const stateRef = useRef<{
    units: SpectatorUnit[];
    projectiles: any[];
    damageTexts: any[];
    battleState: 'LOBBY' | 'FIGHTING' | 'VICTORY' | 'DEFEAT';
    shakeTimer: number;
    shakeIntensity: number;
    bossSkillAlert?: { name: string; color: string; life: number };
    combatLog?: Array<{ id: string; text: string; color: string; time: number }>;
  }>({
    units: [],
    projectiles: [],
    damageTexts: [],
    battleState: 'LOBBY',
    shakeTimer: 0,
    shakeIntensity: 0,
    bossSkillAlert: undefined,
    combatLog: []
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
          existing.level = snapU.level || 1;
          existing.stagger = snapU.stagger || 0;
          existing.maxStagger = snapU.maxStagger || 0;
          existing.staggered = snapU.staggered || false;
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
            lagHp: snapU.hp,
            color: snapU.color,
            isPlayer: snapU.isPlayer,
            classType: snapU.classType,
            level: snapU.level || 1,
            stagger: snapU.stagger || 0,
            maxStagger: snapU.maxStagger || 0,
            staggered: snapU.staggered || false,
            damageDealt: snapU.damageDealt || 0,
            healingDone: snapU.healingDone || 0,
            damageTaken: snapU.damageTaken || 0
          });
        }
      });

      // Remove units not in snapshot
      s.units = s.units.filter(u => receivedIds.has(u.id));

      // Append projectiles, damage floats, skill alerts and logs
      s.projectiles = snapshot.projectiles || [];
      s.damageTexts = snapshot.damageTexts || [];
      s.bossSkillAlert = snapshot.bossSkillAlert;
      s.combatLog = snapshot.combatLog;
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
      showAlert("The streamer has closed the lobby or disconnected.", "LOBBY CLOSED");
      onBackToDashboard();
    };

    const handleLobbyError = (err: any) => {
      showAlert(err.error || 'A lobby error occurred', "LOBBY ERROR");
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
      const bossName = lobby?.bossName || '';
      const s = stateRef.current;


      // Screen shake duration tick
      if (s.shakeTimer > 0) {
        s.shakeTimer -= dt;
      }

      // Boss special attack timer countdown
      if (s.bossSkillAlert && s.bossSkillAlert.life > 0) {
        s.bossSkillAlert.life -= dt;
      }

      ctx.save();
      if (s.shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * s.shakeIntensity;
        const dy = (Math.random() - 0.5) * s.shakeIntensity;
        ctx.translate(dx, dy);
      }

      // Draw themed background based on boss level or raid arena config
      const arenaConfig = RAID_ARENA_CONFIGS[bossName] || getArenaConfigForLevel(level);
      drawProceduralBackground(ctx, canvas.width, canvas.height, arenaConfig);

      // Screen Tint Ambiance during Boss Skills
      if (s.bossSkillAlert && s.bossSkillAlert.life > 0) {
        ctx.save();
        ctx.fillStyle = s.bossSkillAlert.color + '15'; // 8% opacity tint
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Update unit hit flash timers & lagHp
      s.units.forEach(unit => {
        if (unit.flashTimer && unit.flashTimer > 0) {
          unit.flashTimer -= dt;
        }
        if (unit.lagHp === undefined || unit.lagHp < unit.hp) {
          unit.lagHp = unit.hp;
        } else if (unit.lagHp > unit.hp) {
          unit.lagHp -= dt * (unit.maxHp * 0.25);
          if (unit.lagHp < unit.hp) unit.lagHp = unit.hp;
        }
      });

      // 1. INTERPOLATE AND DRAW UNITS
      s.units.forEach(unit => {
        if (unit.tx !== undefined && unit.ty !== undefined) {
          unit.x = lerp(unit.x, unit.tx, 0.15);
          unit.y = lerp(unit.y, unit.ty, 0.15);
        }

        if (unit.hp <= 0) return;

        const isBoss = unit.id === 'boss';
        const isAdd = !unit.isPlayer && !isBoss;
        const isB = !unit.isPlayer;
        const r = isBoss ? 44 : (isAdd ? 22 : 16);
        const uFlash = (unit.flashTimer && unit.flashTimer > 0) ? unit.flashColor : undefined;

        // Render retro 2D pixel-art sprite
        if (unit.isPlayer) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'WARRIOR', 2.4, false, unit.color, uFlash);
        } else if (isBoss) {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'GOBLIN', 5.5, true, unit.color, uFlash);
        } else {
          drawPixelSprite(ctx, unit.x, unit.y, unit.classType || 'GOBLIN_SCOUT', 3.0, true, unit.color, uFlash);
        }

        // Stunned indicator (stagger stun)
        if (unit.staggered) {
          ctx.strokeStyle = '#007aff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(unit.x, unit.y - r - 22, 3, 0, Math.PI * 2);
          ctx.stroke();
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

        // Lag bar (red damage trail)
        const lagPct = Math.max(0, (unit.lagHp || unit.hp) / unit.maxHp);
        ctx.fillStyle = '#ff453a';
        ctx.fillRect(bx, by, barW * lagPct, barH);

        const hpPct = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = !isB ? '#30d158' : '#ff9f0a';
        ctx.fillRect(bx, by, barW * hpPct, barH);

        // Boss Stagger Bar
        if (isBoss) {
          const sby = by + barH + 2;
          const sbh = 3;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(bx, sby, barW, sbh);

          const staggerPct = Math.max(0, ((unit as any).stagger || 0) / ((unit as any).maxStagger || 150));
          ctx.fillStyle = (unit as any).staggered ? '#facc15' : '#eab308';
          ctx.fillRect(bx, sby, barW * staggerPct, sbh);
        }
      });

      // 2. DRAW PROJECTILES
      s.projectiles.forEach(p => {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.color === '#ff9500' ? 12 : 2.5;
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

      // Render Boss Special Attack Banner
      if (s.bossSkillAlert && s.bossSkillAlert.life > 0) {
        ctx.save();
        // Draw banner strip
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Slate 900 translucent
        ctx.fillRect(0, 40, canvas.width, 45);
        
        // Draw top/bottom borders
        ctx.strokeStyle = s.bossSkillAlert.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(canvas.width, 40);
        ctx.moveTo(0, 85);
        ctx.lineTo(canvas.width, 85);
        ctx.stroke();

        // Write warning text
        ctx.fillStyle = s.bossSkillAlert.color;
        ctx.font = 'bold 15px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⚡ BOSS WARNING: CASTING ${s.bossSkillAlert.name.toUpperCase()}! ⚡`, canvas.width / 2, 62.5);
        ctx.restore();
      }

      // Draw Combat Ticker Overlay
      if (s.combatLog && s.combatLog.length > 0) {
        ctx.save();
        const startX = 20;
        const startY = canvas.height - 180;
        const width = 340;
        const height = 160;

        // Background box
        ctx.fillStyle = 'rgba(9, 14, 26, 0.82)'; // dark slate
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(startX, startY, width, height, 8);
        } else {
          ctx.rect(startX, startY, width, height);
        }
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px Orbitron, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('BATTLE LOG', startX + 15, startY + 20);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(startX + 15, startY + 28);
        ctx.lineTo(startX + width - 15, startY + 28);
        ctx.stroke();

        // Render log rows
        ctx.font = 'bold 10px monospace';
        s.combatLog.forEach((log, index) => {
          ctx.fillStyle = log.color;
          ctx.fillText(log.text, startX + 15, startY + 48 + index * 26);
        });

        ctx.restore();
      }

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
            <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
              <h4 className="m-0 text-white font-display text-xs tracking-wider uppercase">
                Raid Live Stats
              </h4>
            </div>

            {/* Tab Swappers */}
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 gap-1">
              {(['DPS', 'HEALING', 'TANKED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded text-[9px] font-display uppercase tracking-wider font-semibold transition ${
                    activeTab === tab 
                      ? 'bg-purple-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Live Metrics List */}
            <div className="flex-grow overflow-y-auto flex flex-col gap-2 pr-1">
              {(() => {
                const topDpsId = [...stateRef.current.units]
                  .filter(u => u.isPlayer)
                  .sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0))[0]?.id;
                const topHealId = [...stateRef.current.units]
                  .filter(u => u.isPlayer)
                  .sort((a, b) => (b.healingDone || 0) - (a.healingDone || 0))[0]?.id;
                const topTankId = [...stateRef.current.units]
                  .filter(u => u.isPlayer)
                  .sort((a, b) => (b.damageTaken || 0) - (a.damageTaken || 0))[0]?.id;

                const sortedPlayers = [...stateRef.current.units]
                  .filter(u => u.isPlayer)
                  .sort((a, b) => {
                    if (activeTab === 'DPS') return (b.damageDealt || 0) - (a.damageDealt || 0);
                    if (activeTab === 'HEALING') return (b.healingDone || 0) - (a.healingDone || 0);
                    return (b.damageTaken || 0) - (a.damageTaken || 0);
                  });

                return sortedPlayers.map(p => {
                  const dmg = p.damageDealt || 0;
                  const heal = p.healingDone || 0;
                  const taken = p.damageTaken || 0;

                  let isLeader = false;
                  let leaderBadge = '';
                  if (activeTab === 'DPS' && p.id === topDpsId && dmg > 0) {
                    isLeader = true;
                    leaderBadge = '⚔️';
                  } else if (activeTab === 'HEALING' && p.id === topHealId && heal > 0) {
                    isLeader = true;
                    leaderBadge = '💚';
                  } else if (activeTab === 'TANKED' && p.id === topTankId && taken > 0) {
                    isLeader = true;
                    leaderBadge = '🛡️';
                  }

                  return (
                    <div
                      key={p.id}
                      className={`bg-[#0b0f19]/80 border rounded-lg p-2.5 flex items-center gap-2.5 text-[10px] font-mono transition-all duration-300 animate-fadeIn ${
                        isLeader ? 'border-yellow-500/25 bg-[#121622]/90' : 'border-white/5'
                      }`}
                    >
                      <MiniSprite classType={p.classType || 'WARRIOR'} color={p.color} size={1.6} />

                      <div className="flex-grow flex flex-col gap-0.5 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white flex items-center gap-1 truncate max-w-[110px]">
                            {p.name}
                            {isLeader && <span className="text-[10px]" title="Leader">{leaderBadge}</span>}
                          </span>
                          {p.hp <= 0 ? (
                            <span className="text-[8px] bg-red-950/40 text-red-500 border border-red-950 px-1 rounded uppercase font-bold shrink-0">
                              DEAD
                            </span>
                          ) : (
                            <span className="text-[8px] text-slate-500 font-mono shrink-0">
                              Lvl {p.level || 1}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-slate-400 mt-1">
                          <span className={activeTab === 'DPS' ? 'text-orange-400 font-bold' : ''}>Dmg: <strong>{dmg}</strong></span>
                          <span className={activeTab === 'HEALING' ? 'text-emerald-400 font-bold' : ''}>Heal: <strong>{heal}</strong></span>
                          <span className={activeTab === 'TANKED' ? 'text-blue-400 font-bold' : ''}>Tank: <strong>{taken}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-white/5 pt-4 shrink-0">
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
                  <span className="text-orange-400">
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

              {/* Boss stagger bar */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-300">
                  <span>Boss Stagger:</span>
                  <span className="text-yellow-400 font-bold">
                    {bossUnit?.staggered ? 'STAGGERED!' : `${Math.round((bossUnit as any)?.stagger || 0)} / ${(bossUnit as any)?.maxStagger || 150}`}
                  </span>
                </div>
                <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-100 ${(bossUnit as any)?.staggered ? 'bg-yellow-400 animate-pulse' : 'bg-yellow-500/80'}`}
                    style={{
                      width: `${Math.max(0, (((bossUnit as any)?.stagger || 0) / ((bossUnit as any)?.maxStagger || 150)) * 100)}%`
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
                <div className="bg-gradient-to-r from-yellow-950/35 via-yellow-900/20 to-yellow-950/35 border border-yellow-500/30 rounded-xl p-5 mb-5 text-center relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  {/* MVP Character Preview */}
                  <div className="mb-2 shrink-0">
                    <CharacterVisualizer charClass={recapStats[0].classType || 'WARRIOR'} equippedItems={[]} />
                  </div>

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

                  {personalReward.inventoryFull ? (
                    <div className="mt-3 p-3 bg-red-950/20 border border-red-900/40 text-red-500 rounded-lg text-xs leading-relaxed flex gap-2">
                      <div>
                        <span className="font-bold">⚠ Inventory Full (30/30)</span> - No item could be awarded! Please free up space in your stash.
                      </div>
                    </div>
                  ) : (
                    personalReward.itemDropped && (
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
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic max-w-xs leading-relaxed mb-6">
                {battleState === 'VICTORY'
                  ? 'Raid was successful, but you did not participate or did not receive rewards.'
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

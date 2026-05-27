import React, { useEffect, useRef } from 'react';
import { CLASSES } from 'shared';
import { drawPixelSprite } from '../game/sprites';

interface CharacterVisualizerProps {
  charClass: string;
  equippedItems: any[];
}

export const CharacterVisualizer: React.FC<CharacterVisualizerProps> = ({ charClass }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    // Particle pool
    const particles: Array<{ x: number; y: number; speedY: number; size: number; alpha: number; maxLife: number; life: number; color: string }> = [];
    const classColor = CLASSES[charClass]?.color || '#ffffff';

    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        speedY: 0.4 + Math.random() * 0.8,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.4,
        maxLife: 100 + Math.random() * 100,
        life: 0,
        color: Math.random() < 0.7 ? classColor : '#ffffff'
      };
    };

    // Pre-populate particles
    for (let i = 0; i < 25; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Draw glowing background aura
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
      grad.addColorStop(0, `${classColor}20`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Floating Sparks
      particles.forEach((p, idx) => {
        p.y -= p.speedY;
        p.life += 1;
        
        // Horizontal drift
        p.x += Math.sin(time / 20 + idx) * 0.15;

        // Reset if dead or out of bounds
        if (p.life >= p.maxLife || p.y < -10) {
          particles[idx] = createParticle();
          return;
        }

        const ratio = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * ratio;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Draw Character Core (Pixel-Art Sprite) with idle bobbing
      const bounceY = Math.sin(time / 18) * 5;
      
      ctx.shadowBlur = 0; // Reset shadow
      drawPixelSprite(ctx, cx, cy - 5 + bounceY, charClass, 6.2, false, classColor);

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [charClass]);

  return (
    <div className="flex items-center justify-center p-2 glass-panel border-white/5 bg-black/30 rounded-2xl w-52 h-52 mx-auto relative shadow-2xl overflow-hidden">
      {/* Visualizer canvas */}
      <canvas ref={canvasRef} width="200" height="200" className="w-full h-full block" />
    </div>
  );
};

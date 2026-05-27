import React, { useEffect, useRef } from 'react';
import { CLASSES } from '../game/constants';
import { drawPixelSprite } from '../game/sprites';

interface CharacterVisualizerProps {
  charClass: string;
  equippedItems: any[];
}

export const CharacterVisualizer: React.FC<CharacterVisualizerProps> = ({ charClass, equippedItems }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const weapon = equippedItems.find(item => item.slot === 'WEAPON');
  const armor = equippedItems.find(item => item.slot === 'ARMOR');
  const accessory = equippedItems.find(item => item.slot === 'ACCESSORY');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return '#8e8e93';
      case 'UNCOMMON': return '#34c759';
      case 'RARE': return '#007aff';
      case 'EPIC': return '#af52de';
      case 'LEGENDARY': return '#ff9500';
      default: return '#8e8e93';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    // Particle pool
    const particles: Array<{ angle: number; speed: number; radius: number; size: number; color: string }> = [];
    const classColor = CLASSES[charClass]?.color || '#ffffff';

    for (let i = 0; i < 20; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.015,
        radius: 35 + Math.random() * 25,
        size: 0.5 + Math.random() * 1.5,
        color: Math.random() < 0.6 ? classColor : '#ffffff'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Draw glowing lines linking slots to center
      ctx.lineWidth = 1;
      const slotsAngle = {
        weapon: 330 * (Math.PI / 180),
        armor: 210 * (Math.PI / 180),
        accessory: 90 * (Math.PI / 180)
      };

      const drawLink = (angle: number, rarity?: string) => {
        const rad = 65 + Math.sin(time / 25 + angle) * 3;
        const targetX = cx + rad * Math.cos(angle);
        const targetY = cy + rad * Math.sin(angle);

        ctx.strokeStyle = rarity ? getRarityColor(rarity) : 'rgba(255, 255, 255, 0.08)';
        ctx.shadowColor = rarity ? getRarityColor(rarity) : 'transparent';
        ctx.shadowBlur = rarity ? 8 : 0;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      };

      drawLink(slotsAngle.weapon, weapon?.rarity);
      drawLink(slotsAngle.armor, armor?.rarity);
      drawLink(slotsAngle.accessory, accessory?.rarity);

      // Reset shadows
      ctx.shadowBlur = 0;

      // 2. Draw Orbiting Particles
      particles.forEach(p => {
        p.angle += p.speed;
        const px = cx + p.radius * Math.cos(p.angle);
        const py = cy + p.radius * Math.sin(p.angle);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Character Core Emblem (Pixel-Art Sprite)
      const coreColor = CLASSES[charClass]?.color || '#ffffff';
      ctx.shadowBlur = 0; // Ensure clean pixel art rendering
      drawPixelSprite(ctx, cx, cy, charClass, 2.8, false, coreColor);

      // 4. Draw Floating Slots
      const drawSlot = (angle: number, label: string, item?: any) => {
        const rad = 65 + Math.sin(time / 25 + angle) * 3;
        const sx = cx + rad * Math.cos(angle);
        const sy = cy + rad * Math.sin(angle);

        const rColor = item ? getRarityColor(item.rarity) : 'rgba(255, 255, 255, 0.08)';

        // Draw Slot background
        ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
        ctx.strokeStyle = rColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = item ? rColor : 'transparent';
        ctx.shadowBlur = item ? 10 : 0;

        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset

        // Draw Slot icon or letter
        ctx.fillStyle = item ? '#ffffff' : 'rgba(255, 255, 255, 0.25)';
        ctx.font = '10px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (item) {
          ctx.fillText(label.substring(0, 1), sx, sy);
        } else {
          ctx.fillText(label, sx, sy);
        }
      };

      drawSlot(slotsAngle.weapon, 'W', weapon);
      drawSlot(slotsAngle.armor, 'A', armor);
      drawSlot(slotsAngle.accessory, 'R', accessory);

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [charClass, weapon, armor, accessory]);

  return (
    <div className="flex items-center justify-center p-3 glass-panel border-white/5 bg-black/20 rounded-full w-48 h-48 mx-auto relative shadow-2xl">
      <canvas ref={canvasRef} width="200" height="200" className="w-full h-full block" />
    </div>
  );
};

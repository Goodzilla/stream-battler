import React, { useEffect, useRef } from 'react';
import { drawPixelSprite } from '../game/sprites';

interface MiniSpriteProps {
  classType: string;
  color?: string;
  size?: number; // scale multiplier
}

export const MiniSprite: React.FC<MiniSpriteProps> = ({ classType, color = '#ffffff', size = 1.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Centered sprite drawing
    drawPixelSprite(ctx, 16, 16, classType, size, false, color);
  }, [classType, color, size]);

  return (
    <canvas
      ref={canvasRef}
      width="32"
      height="32"
      className="w-8 h-8 shrink-0 select-none pixelated bg-black/45 border border-white/10 rounded-md"
    />
  );
};

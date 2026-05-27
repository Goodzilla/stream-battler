export interface Vector2D {
  x: number;
  y: number;
}

export const getDistance = (v1: Vector2D, v2: Vector2D): number => {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const getDirection = (from: Vector2D, to: Vector2D): Vector2D => {
  const dist = getDistance(from, to);
  if (dist === 0) return { x: 0, y: 0 };
  return {
    x: (to.x - from.x) / dist,
    y: (to.y - from.y) / dist
  };
};

export const lerp = (start: number, end: number, amt: number): number => {
  return (1 - amt) * start + amt * end;
};

export const lerpVector = (start: Vector2D, end: Vector2D, amt: number): Vector2D => {
  return {
    x: lerp(start.x, end.x, amt),
    y: lerp(start.y, end.y, amt)
  };
};

export const seek = (
  current: Vector2D,
  target: Vector2D,
  speed: number,
  deltaTime: number
): Vector2D => {
  const dir = getDirection(current, target);
  return {
    x: current.x + dir.x * speed * deltaTime,
    y: current.y + dir.y * speed * deltaTime
  };
};

export type Platform = { x: number; width: number; y: number };
export type Collectible = { token: string; x: number; y: number };

export type PlatformerLevel = {
  platforms: Platform[];
  collectibles: Collectible[];
  goalX: number;
};

export type PlatformerState = {
  x: number;
  y: number;
  velocityY: number;
  collected: string[];
  finished: boolean;
};

export type PlatformerInput = { direction: -1 | 0 | 1; jump: boolean };

const movementSpeed = 32;
const jumpVelocity = 65;
const gravity = 118;

export function createPlatformerLevel(tokens: string[]): PlatformerLevel {
  return {
    platforms: [
      { x: 0, width: 30, y: 0 },
      { x: 35, width: 16, y: 13 },
      { x: 58, width: 17, y: 7 },
      { x: 81, width: 22, y: 22 },
      { x: 110, width: 17, y: 12 },
      { x: 132, width: 28, y: 0 }
    ],
    collectibles: tokens.map((token, index) => ({ token, x: [42, 91, 117][index] ?? 145, y: [21, 31, 20][index] ?? 10 })),
    goalX: 151
  };
}

export function createPlatformerState(): PlatformerState {
  return { x: 7, y: 0, velocityY: 0, collected: [], finished: false };
}

function standingOnPlatform(state: PlatformerState, level: PlatformerLevel): boolean {
  return state.y <= .1 || level.platforms.some((platform) =>
    state.x >= platform.x - 4 && state.x <= platform.x + platform.width + 2 && Math.abs(state.y - platform.y) < .7
  );
}

export function advancePlatformer(
  state: PlatformerState,
  input: PlatformerInput,
  level: PlatformerLevel,
  seconds: number
): PlatformerState {
  if (state.finished) return state;
  const dt = Math.min(Math.max(seconds, 0), .05);
  const velocityY = input.jump && standingOnPlatform(state, level) ? jumpVelocity : state.velocityY - gravity * dt;
  const x = Math.max(2, Math.min(154, state.x + input.direction * movementSpeed * dt));
  let y = state.y + velocityY * dt;
  let nextVelocityY = velocityY;
  const passedPlatform = level.platforms.find((platform) =>
    velocityY <= 0 && x >= platform.x - 3 && x <= platform.x + platform.width + 2 && state.y >= platform.y && y <= platform.y
  );
  if (passedPlatform) { y = passedPlatform.y; nextVelocityY = 0; }
  if (y <= 0) { y = 0; nextVelocityY = 0; }

  const collected = level.collectibles.reduce<string[]>((items, collectible) => {
    if (!items.includes(collectible.token) && Math.abs(x - collectible.x) < 6 && Math.abs(y - collectible.y) < 9) return [...items, collectible.token];
    return items;
  }, state.collected);
  const finished = collected.length === level.collectibles.length && x >= level.goalX - 4 && y < 10;
  return { x, y, velocityY: nextVelocityY, collected, finished };
}

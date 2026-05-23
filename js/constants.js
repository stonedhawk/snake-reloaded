/**
 * Snake Reloaded - Constants and Configurations
 * Defines size parameters, mechanics speeds, and neon color palettes.
 */

const GameConstants = {
  CANVAS_SIZE: 600,
  GRID_COUNT: 30,
  CELL_SIZE: 20, // CANVAS_SIZE / GRID_COUNT
  SEGMENT_GAP: 1.5,

  // Speed scaling configurations
  INTERVAL_START: 150,    // MS duration for standard start speed
  INTERVAL_MIN: 70,       // MS duration capping peak speed
  INTERVAL_STEP: 15,      // Speedup step reduction per level
  FOODS_PER_LEVEL: 5,     // Food eaten before leveling up speed
  SCORE_PER_FOOD: 10,

  // Theme palettes (cyberpunk retro neon theme)
  COLORS: {
    BG: '#0a0a0c',
    GRID_LINE: 'rgba(57, 255, 20, 0.05)',
    SNAKE_HEAD: '#39FF14',        // High intensity neon green
    SNAKE_BODY_GRADIENT: [
      '#30e210',                  // Body start
      '#1a8c08',                  // Mid body
      '#0e5302'                   // Tail body
    ],
    FOOD: '#FF3131',              // Neon red
    FOOD_GLOW: 'rgba(255, 49, 49, 0.45)',
    TEXT_NEON: '#39FF14',
    TEXT_MUTED: 'rgba(57, 255, 20, 0.4)',
    HUD_BORDER: 'rgba(57, 255, 20, 0.15)',
    GOLDEN_FOOD: '#FFD700',       // Golden cherry bonus
    GOLDEN_FOOD_GLOW: 'rgba(255, 215, 0, 0.6)'
  },

  // Game directions vectors
  DIR: {
    RIGHT: { x: 1,  y: 0  },
    LEFT:  { x: -1, y: 0  },
    UP:    { x: 0,  y: -1 },
    DOWN:  { x: 0,  y: 1  }
  },

  // Game States
  STATE: {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
  },

  // Speed level labels
  SPEED_LEVEL_NAMES: [
    "CHILL",      // Level 1
    "SWIFT",      // Level 2
    "HYPER",      // Level 3
    "LUDICROUS",  // Level 4
    "NEON GOD"    // Level 5+
  ]
};

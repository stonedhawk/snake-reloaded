# Snake Reloaded - Developer Reference

A browser-based classic arcade snake game with a modern retro neon aesthetic, high-fidelity sound synthesis, and interactive CRT scanline filters.

## Core Features & Gameplay
- **Dimensions**: 600x600 grid canvas utilizing a 30x30 coordinate grid (each cell = 20px).
- **Snake Mechanics**: Starts at coordinates center, 3 segments long, moving right. Rounded segments with dynamic body colors and interactive looking eyes on the head.
- **Inputs**: Standard WASD keys and Arrow keys for direction control. Direction cannot be directly reversed.
- **States**: `START`, `PLAYING`, `PAUSED` (P or Esc), and `GAMEOVER` (Spacebar to replay).
- **Food System**: Spawns randomly. High-glow cherry red apples (+10 score). 10% chance to spawn Golden Apple (+30 score, rich chiptune beep, golden particle sparks).
- **Score System**: +10 standard / +30 golden. Persistent best record (high score) via browser `localStorage`.
- **Speed Mechanics**: Level increases every 5 food consumed, starting at 150ms interval and accelerating down to 70ms.
- **Audio Synthesizer**: Programmatically generated 8-bit sound effects using browser `AudioContext` (Zero external audio files). Supports mute state.
- **Scanlines (CRT)**: Horizontal screen filter, subtle RGB color shifts, and scanline flickering toggled on/off via dashboard button.

## Architecture & Worktree Structure
The project is modularized to improve readability, maintainability, and clean code principles:
- **[index.html](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/index.html)**: Semantic markup, layout, and HUD widgets.
- **[css/style.css](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/css/style.css)**: Glassmorphic console themes, neon animations, mechanical button states, and CRT scanlines overlays.
- **[js/constants.js](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/js/constants.js)**: Palette parameters, game directions, speed constants, and configuration parameters.
- **[js/sound.js](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/js/sound.js)**: Web Audio API chiptunes synthesizer.
- **[js/particles.js](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/js/particles.js)**: Neon spark explosion rendering.
- **[js/game.js](file:///Users/rahul.shah/Documents/Antigravity/Snake%20Reloaded/js/game.js)**: Keyboard mappings, grid layouts, collisions, scoring updates, and core canvas drawing logic.

## Technical Constraints & Guidelines
- Maintain 100% direct double-click `file://` execution capabilities inside standard browsers (avoid CORS dependencies).
- Keep code fully documented, using clear procedural functions.
- Do not use external libraries or asset links; utilize raw canvas vectors and audio oscillators.
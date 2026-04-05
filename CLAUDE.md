# Snake Reloaded

A browser-based classic snake game with a modern retro aesthetic. Single HTML file, zero dependencies.

## What we're building

- 600x600 canvas with a 20x20 grid (each cell = 30px)
- Snake starts at center, 3 segments long, moving right
- Arrow keys AND WASD for direction control
- Cannot reverse direction (pressing left while moving right is ignored)
- Food spawns at random empty cell (bright green apple)
- Snake grows by 1 segment when eating food
- Game over on wall collision or self collision
- Score: +10 per food eaten
- High score persisted in localStorage
- Speed increases every 5 food items eaten (starts at 150ms, minimum 80ms)
- Grid lines visible but subtle (dark gray on black)
- Snake head is a slightly different shade than the body
- Smooth color: neon green snake (#39FF14), dark background (#111)
- Start screen, playing state, game over screen with score and high score

## Tech

- Vanilla JavaScript
- HTML5 Canvas API
- setInterval game loop (not rAF, since snake moves in discrete steps)
- All code in a single index.html file

## Constraints

- No em dashes in comments or text
- Keep code clean and well-commented
- Game must be playable on desktop browsers (Chrome, Firefox, Safari)
- Canvas must be centered on the page with a dark background
/**
 * Snake Reloaded - Core Game Engine
 * Orchestrates the game loop, state machine, inputs, and pixel rendering.
 * Coordinates with SoundManager and ParticleSystem.
 */

const GameEngine = {
  canvas: null,
  ctx: null,

  // Game state variables
  state: GameConstants.STATE.START,
  snake: [],
  direction: GameConstants.DIR.RIGHT,
  nextDirection: GameConstants.DIR.RIGHT,
  
  food: { x: 0, y: 0 },
  isGoldenFood: false,
  foodEaten: 0,
  
  score: 0,
  highScore: 0,
  speedLevel: 1,
  interval: GameConstants.INTERVAL_START,
  
  // Performance & effects variables
  gameLoopTimer: null,
  glowPhase: 0,
  flashFrames: 0,
  rafHandle: null,

  /**
   * Initializes the game canvas, events, and loads historical high score.
   */
  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Load persistent settings
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
    this.updateHUD();

    // Register keyboard inputs
    document.addEventListener('keydown', (e) => this.handleInput(e));

    // Initialize DOM interface controls (Mute, CRT)
    this.setupUIControls();

    // Draw initial welcome screen and start background thread
    this.state = GameConstants.STATE.START;
    this.drawStartScreen();
    this.startRAF();
  },

  /**
   * Sets up standard HTML5 UI toggle handlers for sound and scanlines.
   */
  setupUIControls() {
    const muteBtn = document.getElementById('muteBtn');
    const crtBtn = document.getElementById('crtBtn');
    const cabinet = document.getElementById('arcadeCabinet');

    // Set initial mute button visual state
    if (SoundManager.muted) {
      muteBtn.classList.add('muted');
      muteBtn.textContent = '🔊 AUDIO: OFF';
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.textContent = '🔊 AUDIO: ON';
    }

    muteBtn.addEventListener('click', () => {
      const isMuted = SoundManager.toggleMute();
      muteBtn.classList.toggle('muted', isMuted);
      muteBtn.textContent = isMuted ? '🔊 AUDIO: OFF' : '🔊 AUDIO: ON';
      SoundManager.init(); // Initialize audio context on click
    });

    // Check if CRT scanlines are enabled locally
    const crtDisabled = localStorage.getItem('snakeCrtDisabled') === 'true';
    if (!crtDisabled) {
      cabinet.classList.add('crt-active');
      crtBtn.textContent = '📺 CRT: ON';
    } else {
      cabinet.classList.remove('crt-active');
      crtBtn.textContent = '📺 CRT: OFF';
    }

    crtBtn.addEventListener('click', () => {
      const active = cabinet.classList.toggle('crt-active');
      crtBtn.textContent = active ? '📺 CRT: ON' : '📺 CRT: OFF';
      localStorage.setItem('snakeCrtDisabled', !active);
    });
  },

  /**
   * Triggers the continuous frame rendering loop.
   */
  startRAF() {
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    const frame = () => {
      this.updatePhysics();
      this.draw();
      this.rafHandle = requestAnimationFrame(frame);
    };
    this.rafHandle = requestAnimationFrame(frame);
  },

  /**
   * Game tick runner (moves snake forward at discrete steps).
   */
  tick() {
    if (this.state !== GameConstants.STATE.PLAYING) return;
    this.step();
  },

  /**
   * Updates animations and sparks. Runs at 60Hz.
   */
  updatePhysics() {
    this.glowPhase += 0.05; // Pulsing rate
    ParticleSystem.update();
  },

  /**
   * Prepares and launches a new game.
   */
  startGame() {
    clearInterval(this.gameLoopTimer);
    ParticleSystem.clear();

    this.state = GameConstants.STATE.PLAYING;
    this.foodEaten = 0;
    this.speedLevel = 1;
    this.interval = GameConstants.INTERVAL_START;
    this.score = 0;
    this.flashFrames = 0;

    this.initSnake();
    this.spawnFood();
    this.updateHUD();

    SoundManager.playStart();

    // Start discrete mechanics clock
    this.gameLoopTimer = setInterval(() => this.tick(), this.interval);
  },

  /**
   * Toggles the active paused state.
   */
  togglePause() {
    if (this.state === GameConstants.STATE.PLAYING) {
      this.state = GameConstants.STATE.PAUSED;
      clearInterval(this.gameLoopTimer);
      SoundManager.playPause(true);
    } else if (this.state === GameConstants.STATE.PAUSED) {
      this.state = GameConstants.STATE.PLAYING;
      SoundManager.playPause(false);
      this.gameLoopTimer = setInterval(() => this.tick(), this.interval);
    }
  },

  /**
   * Resets and configurations the core snake segments.
   */
  initSnake() {
    const cx = Math.floor(GameConstants.GRID_COUNT / 2);
    const cy = Math.floor(GameConstants.GRID_COUNT / 2);
    
    // 3 segment starting size
    this.snake = [
      { x: cx,     y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy }
    ];
    this.direction = GameConstants.DIR.RIGHT;
    this.nextDirection = GameConstants.DIR.RIGHT;
  },

  /**
   * Spawns food on a random unoccupied cell.
   * Introduces a 10% chance to spawn a bonus Golden Food item.
   */
  spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    let cell;
    do {
      cell = {
        x: Math.floor(Math.random() * GameConstants.GRID_COUNT),
        y: Math.floor(Math.random() * GameConstants.GRID_COUNT)
      };
    } while (occupied.has(`${cell.x},${cell.y}`));

    this.food = cell;
    
    // 10% probability of golden bonus food
    this.isGoldenFood = Math.random() < 0.10;
  },

  /**
   * Recalculates and schedules the mechanics speed based on level progression.
   */
  recalcSpeed() {
    this.speedLevel = Math.floor(this.foodEaten / GameConstants.FOODS_PER_LEVEL) + 1;
    this.interval = Math.max(
      GameConstants.INTERVAL_MIN,
      GameConstants.INTERVAL_START - (this.speedLevel - 1) * GameConstants.INTERVAL_STEP
    );

    // Re-program discrete clock
    clearInterval(this.gameLoopTimer);
    this.gameLoopTimer = setInterval(() => this.tick(), this.interval);

    SoundManager.playLevelUp();
  },

  /**
   * Synchronizes variables and score values with the HTML DOM HUD.
   */
  updateHUD() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('highScore').textContent = this.highScore;

    const spdIndex = Math.min(this.speedLevel - 1, GameConstants.SPEED_LEVEL_NAMES.length - 1);
    const spdName = GameConstants.SPEED_LEVEL_NAMES[spdIndex];
    document.getElementById('speedLabel').textContent = `${spdName} (LVL ${this.speedLevel})`;
  },

  /**
   * Core movement algorithm with eating and collision evaluation.
   */
  step() {
    this.direction = this.nextDirection;

    const head = this.snake[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Evaluate walls and body collisions
    if (this.isOutOfBounds(newHead) || this.hitsBody(newHead)) {
      this.gameOver();
      return;
    }

    const ateFood = newHead.x === this.food.x && newHead.y === this.food.y;
    this.snake.unshift(newHead);

    if (ateFood) {
      this.foodEaten++;
      
      // Award score based on food quality
      const reward = this.isGoldenFood ? GameConstants.SCORE_PER_FOOD * 3 : GameConstants.SCORE_PER_FOOD;
      this.score += reward;

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('snakeHighScore', this.highScore);
      }

      // Spark sparks burst origin
      const burstX = this.food.x * GameConstants.CELL_SIZE + GameConstants.CELL_SIZE / 2;
      const burstY = this.food.y * GameConstants.CELL_SIZE + GameConstants.CELL_SIZE / 2;
      const burstColor = this.isGoldenFood ? GameConstants.COLORS.GOLDEN_FOOD : GameConstants.COLORS.FOOD;
      
      ParticleSystem.spawn(burstX, burstY, burstColor, 20);
      this.flashFrames = 3; // Trigger background flash

      if (this.isGoldenFood) {
        SoundManager.playGoldenEat();
      } else {
        SoundManager.playEat();
      }

      this.spawnFood();
      this.updateHUD();

      // Check level-up threshold
      const nextLvl = Math.floor(this.foodEaten / GameConstants.FOODS_PER_LEVEL) + 1;
      if (nextLvl !== this.speedLevel) {
        this.recalcSpeed();
        this.updateHUD();
      }
    } else {
      this.snake.pop();
    }
  },

  /**
   * Validates if cell exceeds grid borders.
   */
  isOutOfBounds(cell) {
    return cell.x < 0 || cell.x >= GameConstants.GRID_COUNT ||
           cell.y < 0 || cell.y >= GameConstants.GRID_COUNT;
  },

  /**
   * Validates if cell collides with internal body segments.
   */
  hitsBody(cell) {
    return this.snake.slice(1).some(s => s.x === cell.x && s.y === cell.y);
  },

  /**
   * Sets game state to Game Over and records final variables.
   */
  gameOver() {
    clearInterval(this.gameLoopTimer);
    this.state = GameConstants.STATE.GAMEOVER;
    SoundManager.playGameOver();
  },

  /**
   * Maps incoming keypresses to movement, pausing, or restarts.
   * @param {KeyboardEvent} e
   */
  handleInput(e) {
    const key = e.key;

    // State startup interactions
    if (key === ' ') {
      e.preventDefault();
      if (this.state === GameConstants.STATE.START || this.state === GameConstants.STATE.GAMEOVER) {
        this.startGame();
      }
      return;
    }

    // Pause interactions
    if (key.toLowerCase() === 'p' || key === 'Escape') {
      e.preventDefault();
      if (this.state === GameConstants.STATE.PLAYING || this.state === GameConstants.STATE.PAUSED) {
        this.togglePause();
      }
      return;
    }

    if (this.state !== GameConstants.STATE.PLAYING) return;

    // Movement mappings
    switch (key) {
      case 'ArrowRight': case 'd': case 'D':
        if (this.direction !== GameConstants.DIR.LEFT) {
          this.nextDirection = GameConstants.DIR.RIGHT;
        }
        e.preventDefault();
        break;
      case 'ArrowLeft': case 'a': case 'A':
        if (this.direction !== GameConstants.DIR.RIGHT) {
          this.nextDirection = GameConstants.DIR.LEFT;
        }
        e.preventDefault();
        break;
      case 'ArrowUp': case 'w': case 'W':
        if (this.direction !== GameConstants.DIR.DOWN) {
          this.nextDirection = GameConstants.DIR.UP;
        }
        e.preventDefault();
        break;
      case 'ArrowDown': case 's': case 'S':
        if (this.direction !== GameConstants.DIR.UP) {
          this.nextDirection = GameConstants.DIR.DOWN;
        }
        e.preventDefault();
        break;
    }
  },

  // ==========================================
  // RENDERING & CANVAS GRAPHICS ENGINE
  // ==========================================

  /**
   * Clears context and renders components based on state.
   */
  draw() {
    if (this.state === GameConstants.STATE.START) {
      // Welcoming screen draws continuously to ensure background particles or updates are visible
      this.drawStartScreen();
      return;
    }

    this.drawBackground();
    this.drawGrid();
    this.drawFood();
    this.drawSnake();
    ParticleSystem.draw(this.ctx);
    this.drawEatFlash();

    if (this.state === GameConstants.STATE.PAUSED) {
      this.drawPauseOverlay();
    } else if (this.state === GameConstants.STATE.GAMEOVER) {
      this.drawGameOverOverlay();
    }
  },

  drawBackground() {
    this.ctx.fillStyle = GameConstants.COLORS.BG;
    this.ctx.fillRect(0, 0, GameConstants.CANVAS_SIZE, GameConstants.CANVAS_SIZE);
  },

  /**
   * Draws a retro pixelated mesh.
   */
  drawGrid() {
    this.ctx.strokeStyle = GameConstants.COLORS.GRID_LINE;
    this.ctx.lineWidth = 1;
    
    for (let col = 1; col < GameConstants.GRID_COUNT; col++) {
      const x = col * GameConstants.CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, GameConstants.CANVAS_SIZE);
      this.ctx.stroke();
    }

    for (let row = 1; row < GameConstants.GRID_COUNT; row++) {
      const y = row * GameConstants.CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(GameConstants.CANVAS_SIZE, y);
      this.ctx.stroke();
    }
  },

  /**
   * Renders the retro apple/cherry food item with dynamic radial glow.
   */
  drawFood() {
    const cx = this.food.x * GameConstants.CELL_SIZE + GameConstants.CELL_SIZE / 2;
    const cy = this.food.y * GameConstants.CELL_SIZE + GameConstants.CELL_SIZE / 2;
    const r = GameConstants.CELL_SIZE / 2 - GameConstants.SEGMENT_GAP - 1.5;

    // Draw little wooden branch stem
    this.ctx.save();
    this.ctx.strokeStyle = '#8B5A2B';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - r + 2);
    this.ctx.quadraticCurveTo(cx + 4, cy - r - 6, cx + 7, cy - r - 4);
    this.ctx.stroke();

    // Draw a small bright green leaf
    this.ctx.fillStyle = '#39FF14';
    this.ctx.beginPath();
    this.ctx.ellipse(cx + 5, cy - r - 5, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Oscillating neon radial glow
    const glowAlpha = 0.18 + 0.22 * ((Math.sin(this.glowPhase * 1.5) + 1) / 2);
    const glowRadius = r + 6 + 5 * ((Math.sin(this.glowPhase * 1.5) + 1) / 2);
    
    const foodColor = this.isGoldenFood ? GameConstants.COLORS.GOLDEN_FOOD : GameConstants.COLORS.FOOD;
    const foodGlowColor = this.isGoldenFood ? GameConstants.COLORS.GOLDEN_FOOD_GLOW : GameConstants.COLORS.FOOD_GLOW;

    const grad = this.ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, glowRadius);
    grad.addColorStop(0, foodGlowColor);
    grad.addColorStop(0.5, foodGlowColor.replace('0.45', '0.2').replace('0.6', '0.25'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    this.ctx.save();
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Base main cherry body
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = foodColor;
    this.ctx.fillStyle = foodColor;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Small glossy reflecting highlight dot
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.ctx.beginPath();
    this.ctx.arc(cx - r / 3.5, cy - r / 3.5, r / 3.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  },

  /**
   * Renders the complete snake body with custom rounded segments and eye rotation.
   */
  drawSnake() {
    if (this.snake.length === 0) return;

    this.snake.forEach((seg, idx) => {
      const px = seg.x * GameConstants.CELL_SIZE + GameConstants.SEGMENT_GAP;
      const py = seg.y * GameConstants.CELL_SIZE + GameConstants.SEGMENT_GAP;
      const sz = GameConstants.CELL_SIZE - GameConstants.SEGMENT_GAP * 2;
      const radius = 5; // rounded border radius

      this.ctx.save();

      if (idx === 0) {
        // --- DRAW ROUNDED SNAKE HEAD ---
        this.ctx.shadowBlur = 14;
        this.ctx.shadowColor = GameConstants.COLORS.SNAKE_HEAD;
        this.ctx.fillStyle = GameConstants.COLORS.SNAKE_HEAD;
        
        this.ctx.beginPath();
        this.ctx.roundRect(px, py, sz, sz, radius + 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw cute animated eyes facing the direction vector
        const cx = px + sz / 2;
        const cy = py + sz / 2;
        const offset = sz / 2 - 3;
        
        let eye1 = { x: 0, y: 0 }, eye2 = { x: 0, y: 0 };

        if (this.direction === GameConstants.DIR.RIGHT) {
          eye1 = { x: cx + offset - 1, y: cy - 4.5 };
          eye2 = { x: cx + offset - 1, y: cy + 4.5 };
        } else if (this.direction === GameConstants.DIR.LEFT) {
          eye1 = { x: cx - offset + 1, y: cy - 4.5 };
          eye2 = { x: cx - offset + 1, y: cy + 4.5 };
        } else if (this.direction === GameConstants.DIR.UP) {
          eye1 = { x: cx - 4.5, y: cy - offset + 1 };
          eye2 = { x: cx + 4.5, y: cy - offset + 1 };
        } else if (this.direction === GameConstants.DIR.DOWN) {
          eye1 = { x: cx - 4.5, y: cy + offset - 1 };
          eye2 = { x: cx + 4.5, y: cy + offset - 1 };
        }

        // Eyeballs (white backing)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(eye1.x, eye1.y, 3, 0, Math.PI * 2);
        this.ctx.arc(eye2.x, eye2.y, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils (black dots facing movement)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(eye1.x, eye1.y, 1.3, 0, Math.PI * 2);
        this.ctx.arc(eye2.x, eye2.y, 1.3, 0, Math.PI * 2);
        this.ctx.fill();

      } else {
        // --- DRAW BODY SEGMENTS ---
        // Interpolate body colors dynamically
        const ratio = idx / (this.snake.length - 1);
        const colorPalette = GameConstants.COLORS.SNAKE_BODY_GRADIENT;
        let segmentColor;

        if (ratio < 0.5) {
          segmentColor = colorPalette[0]; // Neon upper
        } else if (ratio < 0.85) {
          segmentColor = colorPalette[1]; // Darker green
        } else {
          segmentColor = colorPalette[2]; // Tail segment
        }

        // Taper segment size slightly near the tail for high-end feel
        const scale = Math.max(0.70, 1 - ratio * 0.25);
        const innerSz = sz * scale;
        const delta = (sz - innerSz) / 2;

        this.ctx.fillStyle = segmentColor;
        this.ctx.beginPath();
        this.ctx.roundRect(px + delta, py + delta, innerSz, innerSz, radius);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  },

  /**
   * Draws a transparent full screen overlay flash after eating.
   */
  drawEatFlash() {
    if (this.flashFrames <= 0) return;
    const alpha = this.flashFrames === 3 ? 0.16 : this.flashFrames === 2 ? 0.08 : 0.03;
    this.ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
    this.ctx.fillRect(0, 0, GameConstants.CANVAS_SIZE, GameConstants.CANVAS_SIZE);
    this.flashFrames--;
  },

  /**
   * Renders the retro title splash screen.
   */
  drawStartScreen() {
    this.drawBackground();
    this.drawGrid();

    const midX = GameConstants.CANVAS_SIZE / 2;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Retro animated floating effect using trigonometric functions
    const floatOffset = Math.sin(this.glowPhase) * 6;

    // Glowing Neon Title Shadow
    this.ctx.save();
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#39FF14';
    this.ctx.fillStyle = '#39FF14';
    this.ctx.font = 'bold 52px "Press Start 2P", "Courier New", monospace';
    this.ctx.fillText('SNAKE', midX, 220 + floatOffset);
    this.ctx.restore();

    // Cyberpunk Subtitle Overlay
    this.ctx.fillStyle = 'rgba(255, 49, 49, 0.8)';
    this.ctx.font = '15px "Orbitron", "Courier New", monospace';
    this.ctx.letterSpacing = '5px';
    this.ctx.fillText('R E L O A D E D', midX, 280 + floatOffset);

    // Interactive Key Instructions
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.6)';
    this.ctx.font = '13px "Press Start 2P", monospace';
    this.ctx.letterSpacing = '0px';
    
    // Simple pulsing start text
    const pulseOpacity = 0.4 + 0.6 * ((Math.sin(this.glowPhase * 2.5) + 1) / 2);
    this.ctx.fillStyle = `rgba(57, 255, 20, ${pulseOpacity})`;
    this.ctx.fillText('PRESS SPACE TO START', midX, 370);

    // Instructions box
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
    this.ctx.font = '11px "Orbitron", sans-serif';
    this.ctx.fillText('CONTROLS: WASD / ARROWS TO MOVE  |  P TO PAUSE', midX, 430);

    // High Score Badge
    if (this.highScore > 0) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      this.ctx.font = 'bold 12px "Press Start 2P", monospace';
      this.ctx.fillText(`BEST RECORD: ${this.highScore}`, midX, 480);
    }
  },

  /**
   * Draws a beautiful glass-morphism overlay when paused.
   */
  drawPauseOverlay() {
    this.ctx.fillStyle = 'rgba(5, 5, 8, 0.7)';
    this.ctx.fillRect(0, 0, GameConstants.CANVAS_SIZE, GameConstants.CANVAS_SIZE);

    const midX = GameConstants.CANVAS_SIZE / 2;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Glowing pause banner
    this.ctx.save();
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#FF3131';
    this.ctx.fillStyle = '#FF3131';
    this.ctx.font = 'bold 36px "Press Start 2P", monospace';
    this.ctx.fillText('PAUSED', midX, 270);
    this.ctx.restore();

    const pulseOpacity = 0.4 + 0.6 * ((Math.sin(this.glowPhase * 2) + 1) / 2);
    this.ctx.fillStyle = `rgba(57, 255, 20, ${pulseOpacity})`;
    this.ctx.font = '12px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS P TO RESUME', midX, 335);
  },

  /**
   * Draws a detailed stats board on Game Over.
   */
  drawGameOverOverlay() {
    // Semi-transparent backdrop overlay
    this.ctx.fillStyle = 'rgba(8, 5, 5, 0.82)';
    this.ctx.fillRect(0, 0, GameConstants.CANVAS_SIZE, GameConstants.CANVAS_SIZE);

    const midX = GameConstants.CANVAS_SIZE / 2;
    const isNewHighScore = this.score > 0 && this.score === this.highScore;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Game Over title banner
    this.ctx.save();
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#FF3131';
    this.ctx.fillStyle = '#FF3131';
    this.ctx.font = 'bold 42px "Press Start 2P", monospace';
    this.ctx.fillText('GAME OVER', midX, 180);
    this.ctx.restore();

    // Stats Table Panels
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.85)';
    this.ctx.font = '14px "Press Start 2P", monospace';
    this.ctx.fillText(`SCORE: ${this.score}`, midX, 255);
    this.ctx.fillText(`BEST RECORD: ${this.highScore}`, midX, 295);

    if (isNewHighScore) {
      this.ctx.save();
      // Oscillating rainbow colors or glowing gold banner
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = '#FFD700';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 16px "Press Start 2P", monospace';
      
      const bounce = Math.sin(this.glowPhase * 3) * 3;
      this.ctx.fillText('👑 NEW HIGH SCORE! 👑', midX, 345 + bounce);
      this.ctx.restore();
    }

    // Speed display
    this.ctx.fillStyle = 'rgba(57, 255, 20, 0.5)';
    this.ctx.font = '12px "Orbitron", sans-serif';
    this.ctx.fillText(`PEAK SPEED REACHED: LEVEL ${this.speedLevel}`, midX, isNewHighScore ? 395 : 345);

    // Play again prompt
    const pulseOpacity = 0.5 + 0.5 * ((Math.sin(this.glowPhase * 2) + 1) / 2);
    this.ctx.fillStyle = `rgba(57, 255, 20, ${pulseOpacity})`;
    this.ctx.font = '11px "Press Start 2P", monospace';
    this.ctx.fillText('PRESS SPACE TO REPLAY', midX, isNewHighScore ? 440 : 395);
  }
};

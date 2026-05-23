/**
 * Snake Reloaded - Particles Engine
 * Spawns and simulates neon pixel sparks on food consumption.
 * Adds deep visual polish and kinetic feedback to interactions.
 */

class Particle {
  /**
   * Creates a single glowing spark.
   * @param {number} x Canvas coordinate X
   * @param {number} y Canvas coordinate Y
   * @param {string} color Neon hex color code
   */
  constructor(x, y, color) {
    this.x = x;
    this.y = y;

    // Randomized physics vectors
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5; // Slight upward force bias

    this.size = Math.random() * 3 + 2; // Spark pixel size
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.025 + 0.015; // Fade rate
    this.gravity = 0.12;
    this.friction = 0.96;
  }

  /**
   * Advances the particle's movement vectors.
   */
  update() {
    this.vx *= this.friction;
    this.vy += this.gravity;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;

    this.alpha -= this.decay;
  }

  /**
   * Renders the individual particle with subtle glow.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Glowing drop shadow shadow Blur
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

const ParticleSystem = {
  particles: [],

  /**
   * Spawns a burst of sparks.
   * @param {number} x Origin X
   * @param {number} y Origin Y
   * @param {string} color Colors for the burst
   * @param {number} count Particle count
   */
  spawn(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  },

  /**
   * Updates all active particles and prunes faded ones.
   */
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  /**
   * Renders all active particles.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  },

  /**
   * Cleans all active particles.
   */
  clear() {
    this.particles = [];
  }
};

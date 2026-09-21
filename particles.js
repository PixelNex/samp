/**
 * Canvas 2D Particle Engine for Birthday Celebrations
 * Handles:
 * 1. Realistic Curling Smoke Wisps on Extinguishing
 * 2. Grand Confetti Blast (Paper ribbons, stars, circles)
 * 3. Ambient Floating Magic Dust
 * 4. Physics-based Floating 3D Balloons
 */

class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    this.smokeParticles = [];
    this.confettiParticles = [];
    this.ambientParticles = [];
    this.balloons = [];
    
    this.isEmittingSmoke = false;
    this.smokeSources = []; // array of {x, y} coordinates for candle wicks
    this.smokeTimer = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._initAmbientParticles();
    this._loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  _initAmbientParticles() {
    this.ambientParticles = [];
    const count = Math.min(60, Math.floor((this.width * this.height) / 18000));
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.7 + 0.2,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: -Math.random() * 0.45 - 0.15,
        pulseSpeed: Math.random() * 0.04 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
        isStar: Math.random() < 0.3,
        color: ['#ffd166', '#ffb703', '#ff758f', '#ffffff', '#e0aaff', '#90e0ef'][Math.floor(Math.random() * 6)]
      });
    }
  }

  /**
   * Start emitting realistic rising smoke wisps from candle coordinates
   */
  startSmoke(sources, durationMs = 4000) {
    this.smokeSources = sources;
    this.isEmittingSmoke = true;

    if (this.smokeTimer) clearTimeout(this.smokeTimer);
    this.smokeTimer = setTimeout(() => {
      this.isEmittingSmoke = false;
    }, durationMs);
  }

  _spawnSmokeParticle(source) {
    const angle = (Math.random() - 0.5) * 0.6 - Math.PI / 2;
    const speed = Math.random() * 1.5 + 1.2;
    this.smokeParticles.push({
      x: source.x + (Math.random() - 0.5) * 4,
      y: source.y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.4,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 3 + 2,
      maxRadius: Math.random() * 18 + 14,
      growthRate: Math.random() * 0.18 + 0.12,
      alpha: 0.7,
      decay: Math.random() * 0.006 + 0.007,
      curlSpeed: (Math.random() - 0.5) * 0.05,
      curlAngle: Math.random() * Math.PI * 2
    });
  }

  /**
   * Launch a spectacular multi-burst confetti celebration
   */
  launchConfettiBlast(count = 180) {
    const colors = [
      '#FF5E7E', '#FFB800', '#00D2FF', '#9D4EDD', '#06D6A0',
      '#FF70A6', '#FFD166', '#70D6FF', '#E0AAFF', '#FFE45E'
    ];

    // Left cannon
    this._addConfettiBurst(this.width * 0.15, this.height * 0.85, count * 0.5, colors, Math.PI / 4, 1.1);
    // Right cannon
    this._addConfettiBurst(this.width * 0.85, this.height * 0.85, count * 0.5, colors, (3 * Math.PI) / 4, 1.1);
    // Center burst
    this._addConfettiBurst(this.width * 0.5, this.height * 0.5, count * 0.4, colors, -Math.PI / 2, 0.9);
  }

  _addConfettiBurst(originX, originY, count, colors, mainAngle, spreadRatio = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = mainAngle + (Math.random() - 0.5) * 1.4 * spreadRatio;
      const speed = Math.random() * 18 + 10;
      const shapeType = Math.random() < 0.55 ? 'rect' : (Math.random() < 0.6 ? 'star' : 'circle');

      this.confettiParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle) * speed) - 4,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.965,
        width: Math.random() * 10 + 6,
        height: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.2,
        rotSpeedY: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapeType,
        alpha: 1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.1 + 0.05
      });
    }
  }

  /**
   * Release floating 3D Party Balloons
   */
  launchBalloons(count = 14) {
    const balloonColors = [
      { body: '#ff4d6d', highlight: '#ff8fa3', dark: '#c9184a' },
      { body: '#7209b7', highlight: '#b5179e', dark: '#480ca8' },
      { body: '#4cc9f0', highlight: '#90e0ef', dark: '#0077b6' },
      { body: '#ffd166', highlight: '#ffe3a8', dark: '#f4a261' },
      { body: '#06d6a0', highlight: '#70e000', dark: '#38b000' },
      { body: '#ff758f', highlight: '#ffb3c1', dark: '#e01e37' },
    ];

    for (let i = 0; i < count; i++) {
      const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      this.balloons.push({
        x: Math.random() * (this.width - 120) + 60,
        y: this.height + Math.random() * 300 + 50,
        radius: Math.random() * 18 + 32, // balloon size
        speedY: -(Math.random() * 1.8 + 1.2),
        swingSpeed: Math.random() * 0.02 + 0.015,
        swingAmount: Math.random() * 25 + 15,
        swingOffset: Math.random() * Math.PI * 2,
        color: color,
        stringLength: Math.random() * 35 + 45,
        alpha: 1
      });
    }
  }

  _loop(time = 0) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw & update ambient sparkles
    this._renderAmbient(time);

    // 2. Spawn & update smoke particles
    if (this.isEmittingSmoke && this.smokeSources.length > 0) {
      this.smokeSources.forEach(source => {
        if (Math.random() < 0.6) {
          this._spawnSmokeParticle(source);
        }
      });
    }
    this._renderSmoke();

    // 3. Render floating balloons
    this._renderBalloons(time);

    // 4. Render celebratory confetti
    this._renderConfetti();

    requestAnimationFrame((t) => this._loop(t));
  }

  _renderAmbient(time) {
    this.ctx.save();
    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < -10) p.y = this.height + 10;
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;

      const pulsatingAlpha = p.alpha * (0.6 + 0.4 * Math.sin(time * p.pulseSpeed + p.pulseOffset));

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, Math.min(1, pulsatingAlpha));
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;

      if (p.isStar) {
        this.ctx.beginPath();
        const r = p.radius * 1.8;
        this.ctx.moveTo(p.x, p.y - r);
        this.ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
        this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
        this.ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
        this.ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  _renderSmoke() {
    this.ctx.save();
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.curlAngle += p.curlSpeed;
      p.x += p.vx + Math.sin(p.curlAngle) * 0.6;
      p.y += p.vy;
      p.radius = Math.min(p.maxRadius, p.radius + p.growthRate);
      p.alpha -= p.decay;

      if (p.alpha <= 0.01) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(220, 220, 230, ${p.alpha * 0.7})`);
      grad.addColorStop(0.5, `rgba(180, 185, 200, ${p.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(140, 145, 165, 0)`);

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  _renderConfetti() {
    this.ctx.save();
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx + Math.sin(p.wobble) * 1.2;
      p.y += p.vy;
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotSpeedX;

      if (p.y > this.height + 40) {
        this.confettiParticles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      const scaleY = Math.cos(p.wobble);
      this.ctx.scale(1, scaleY);

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      } else if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.width / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'star') {
        this._drawStar(0, 0, 5, p.width * 0.7, p.width * 0.35);
      }

      this.ctx.restore();
    }
    this.ctx.restore();
  }

  _drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  _renderBalloons(time) {
    this.ctx.save();
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.y += b.speedY;
      const currentX = b.x + Math.sin(time * b.swingSpeed + b.swingOffset) * b.swingAmount;

      if (b.y < -b.radius * 3 - b.stringLength) {
        this.balloons.splice(i, 1);
        continue;
      }

      // Draw String
      this.ctx.beginPath();
      this.ctx.moveTo(currentX, b.y + b.radius * 1.15);
      this.ctx.bezierCurveTo(
        currentX + Math.sin(time * 0.04) * 10, b.y + b.radius * 1.15 + b.stringLength * 0.5,
        currentX - Math.sin(time * 0.04) * 8, b.y + b.radius * 1.15 + b.stringLength * 0.8,
        currentX + Math.sin(time * 0.03) * 4, b.y + b.radius * 1.15 + b.stringLength
      );
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Balloon Body (Oval + Knot)
      this.ctx.save();
      this.ctx.translate(currentX, b.y);

      // Gradient fill with glossy reflection
      const grad = this.ctx.createRadialGradient(
        -b.radius * 0.35, -b.radius * 0.4, b.radius * 0.1,
        0, 0, b.radius * 1.2
      );
      grad.addColorStop(0, b.color.highlight);
      grad.addColorStop(0.4, b.color.body);
      grad.addColorStop(1, b.color.dark);

      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, b.radius * 0.85, b.radius * 1.15, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = b.color.body;
      this.ctx.fill();

      // Glossy highlight spot
      this.ctx.beginPath();
      this.ctx.ellipse(-b.radius * 0.35, -b.radius * 0.45, b.radius * 0.22, b.radius * 0.35, -0.4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      this.ctx.shadowBlur = 0;
      this.ctx.fill();

      // Balloon Knot
      this.ctx.beginPath();
      this.ctx.moveTo(-b.radius * 0.15, b.radius * 1.15);
      this.ctx.lineTo(b.radius * 0.15, b.radius * 1.15);
      this.ctx.lineTo(b.radius * 0.08, b.radius * 1.22);
      this.ctx.lineTo(-b.radius * 0.08, b.radius * 1.22);
      this.ctx.closePath();
      this.ctx.fillStyle = b.color.dark;
      this.ctx.fill();

      this.ctx.restore();
    }
    this.ctx.restore();
  }
}

window.ParticleEngine = ParticleEngine;

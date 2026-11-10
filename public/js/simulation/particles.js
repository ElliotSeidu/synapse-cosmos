// Quantum Particles, Slime Agents, Celestial Singularities, and Cosmic FX

export class QuantumSpore {
  constructor(x, y, energy = 40) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.energy = energy;
    this.radius = 2.5 + Math.random() * 2;
    this.hue = 45 + Math.random() * 25; // Golden amber
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(dt = 1, width, height, gravWells = []) {
    this.pulse += 0.04 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Fluid drag
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Celestial Gravitational Pull
    for (let i = 0; i < gravWells.length; i++) {
      const g = gravWells[i];
      const dx = g.x - this.x;
      const dy = g.y - this.y;
      const dSq = dx * dx + dy * dy + 100;
      const d = Math.sqrt(dSq);
      const force = (g.strength * 120) / dSq;
      this.vx += (dx / d) * force * dt;
      this.vy += (dy / d) * force * dt;
    }

    // Boundary wrap
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;
  }

  render(ctx) {
    const glow = Math.sin(this.pulse) * 0.3 + 0.7;
    ctx.save();
    ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${glow})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Defensive Bioluminescent Ink Puffs
export class BioluminescentInk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2.0;
    this.vy = (Math.random() - 0.5) * 2.0;
    this.radius = 8 + Math.random() * 12;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.015;
  }

  update(dt = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.radius += 0.3 * dt;
    this.life -= this.decay * dt;
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 240, 255, ${this.life * 0.4})`;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Expanding Shockwave Ring (from Supernovas & Singularity Events)
export class ShockwaveRing {
  constructor(x, y, maxRadius = 260, color = '#00f0ff') {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = maxRadius;
    this.life = 1.0;
    this.speed = 8.0;
    this.color = color;
  }

  update(dt = 1) {
    this.radius += this.speed * dt;
    this.life = Math.max(0, 1 - (this.radius / this.maxRadius));
  }

  isDead() {
    return this.life <= 0 || this.radius >= this.maxRadius;
  }

  render(ctx) {
    ctx.save();
    ctx.lineWidth = Math.max(1, 3.5 * this.life);
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = this.life * 0.85;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Localized Quantum Stasis Bubble (Freezes Entropic Time)
export class StasisBubble {
  constructor(x, y, radius = 90) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.life = 1.0;
    this.pulse = 0;
  }

  update(dt = 1) {
    this.pulse += 0.06 * dt;
    this.life -= 0.003 * dt; // ~5.5 seconds lifespan
  }

  isDead() {
    return this.life <= 0;
  }

  contains(px, py) {
    return Math.hypot(this.x - px, this.y - py) <= this.radius;
  }

  render(ctx) {
    const alpha = Math.min(1.0, this.life);
    const ringPulse = Math.sin(this.pulse) * 3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + ringPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// Physarum Polycephalum Slime Mold Chemotaxis Particle
export class PhysarumAgent {
  constructor(x, y, angle = Math.random() * Math.PI * 2) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 1.6 + Math.random() * 0.8;
    this.sensorAngle = 0.45; // ~26 degrees
    this.sensorDist = 12.0;
    this.turnSpeed = 0.35;
    this.size = 1.2 + Math.random() * 0.8;
  }

  update(pheromones, dt = 1, width, height) {
    const cX = this.x + Math.cos(this.angle) * this.sensorDist;
    const cY = this.y + Math.sin(this.angle) * this.sensorDist;

    const lX = this.x + Math.cos(this.angle - this.sensorAngle) * this.sensorDist;
    const lY = this.y + Math.sin(this.angle - this.sensorAngle) * this.sensorDist;

    const rX = this.x + Math.cos(this.angle + this.sensorAngle) * this.sensorDist;
    const rY = this.y + Math.sin(this.angle + this.sensorAngle) * this.sensorDist;

    const valC = pheromones.sample(cX, cY);
    const valL = pheromones.sample(lX, lY);
    const valR = pheromones.sample(rX, rY);

    if (valC > valL && valC > valR) {
      this.angle += (Math.random() - 0.5) * 0.05;
    } else if (valL > valR) {
      this.angle -= this.turnSpeed;
    } else if (valR > valL) {
      this.angle += this.turnSpeed;
    } else {
      this.angle += (Math.random() - 0.5) * 0.2;
    }

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    pheromones.deposit(this.x, this.y, 45, 'slime');

    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;
  }

  render(ctx) {
    ctx.fillStyle = 'rgba(255, 200, 50, 0.45)';
    ctx.fillRect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size);
  }
}

// Gravitational Singularity (Black Hole / White Hole)
export class CosmicWell {
  constructor(x, y, strength = 1.0, isRepulsor = false) {
    this.x = x;
    this.y = y;
    this.strength = strength * (isRepulsor ? -1.0 : 1.0);
    this.isRepulsor = isRepulsor;
    this.radius = isRepulsor ? 22 : 18;
    this.rotation = 0;
    this.accretionParticles = [];
    
    for (let i = 0; i < 40; i++) {
      const dist = this.radius * (1.2 + Math.random() * 2.5);
      const ang = Math.random() * Math.PI * 2;
      this.accretionParticles.push({
        dist: dist,
        ang: ang,
        speed: (isRepulsor ? -1 : 1) * (0.04 + (30 / dist) * 0.02),
        size: 1 + Math.random() * 2
      });
    }
  }

  get label() {
    return this.isRepulsor ? 'White Hole Repulsor' : 'Singularity Vortex';
  }

  update(dt = 1) {
    this.rotation += (this.isRepulsor ? -0.03 : 0.05) * dt;

    for (let i = 0; i < this.accretionParticles.length; i++) {
      const p = this.accretionParticles[i];
      p.ang += p.speed * dt;
      if (!this.isRepulsor) {
        p.dist -= 0.08 * dt;
        if (p.dist < this.radius * 0.9) {
          p.dist = this.radius * (2.2 + Math.random() * 1.5);
        }
      } else {
        p.dist += 0.15 * dt;
        if (p.dist > this.radius * 3.5) {
          p.dist = this.radius * 0.8;
        }
      }
    }
  }

  render(ctx) {
    ctx.save();

    const ringColor = this.isRepulsor ? '#00f0ff' : '#ff0077';
    const coreColor = this.isRepulsor ? '#ffffff' : '#030712';

    const aura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 3.0);
    aura.addColorStop(0, this.isRepulsor ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 0, 119, 0.35)');
    aura.addColorStop(0.6, this.isRepulsor ? 'rgba(0, 255, 136, 0.1)' : 'rgba(176, 38, 255, 0.1)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = ringColor;
    ctx.fillStyle = ringColor;
    for (let i = 0; i < this.accretionParticles.length; i++) {
      const p = this.accretionParticles[i];
      const px = this.x + Math.cos(p.ang) * p.dist;
      const py = this.y + Math.sin(p.ang) * (p.dist * 0.65);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ringColor;
    ctx.stroke();

    ctx.restore();
  }
}

// 4D Wormhole Rift
export class SpacetimeRift {
  constructor(x1, y1, x2, y2) {
    this.nodeA = { x: x1, y: y1 };
    this.nodeB = { x: x2, y: y2 };
    this.radius = 24;
    this.pulse = 0;
    this.life = 1.0;
    this.age = 0;
    this.maxAge = 3600;
  }

  update(dt = 1) {
    this.pulse += 0.05 * dt;
    this.age += dt;
    if (this.age > this.maxAge) {
      this.life -= 0.01 * dt;
    }
  }

  isDead() {
    return this.life <= 0;
  }

  checkTeleport(entity) {
    if (this.life <= 0) return false;

    const distA = Math.hypot(entity.x - this.nodeA.x, entity.y - this.nodeA.y);
    if (distA < this.radius && (!entity.lastTeleport || Date.now() - entity.lastTeleport > 1000)) {
      entity.x = this.nodeB.x + (Math.random() - 0.5) * 15;
      entity.y = this.nodeB.y + (Math.random() - 0.5) * 15;
      entity.lastTeleport = Date.now();
      return true;
    }

    const distB = Math.hypot(entity.x - this.nodeB.x, entity.y - this.nodeB.y);
    if (distB < this.radius && (!entity.lastTeleport || Date.now() - entity.lastTeleport > 1000)) {
      entity.x = this.nodeA.x + (Math.random() - 0.5) * 15;
      entity.y = this.nodeA.y + (Math.random() - 0.5) * 15;
      entity.lastTeleport = Date.now();
      return true;
    }

    return false;
  }

  render(ctx) {
    const alpha = Math.max(0, Math.min(1, this.life));
    const glow = Math.sin(this.pulse) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b026ff';
    ctx.shadowColor = '#b026ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(this.nodeA.x, this.nodeA.y, this.radius * glow, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.nodeB.x, this.nodeB.y, this.radius * glow, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(this.nodeA.x, this.nodeA.y);
    ctx.lineTo(this.nodeB.x, this.nodeB.y);
    ctx.strokeStyle = 'rgba(176, 38, 255, 0.3)';
    ctx.stroke();

    ctx.restore();
  }
}

// Orbital Dyson Pulsar Beacon (Sweeping Relativistic Energy Beams)
export class PulsarBeacon {
  constructor(x, y, beamLength = 230) {
    this.x = x;
    this.y = y;
    this.beamLength = beamLength;
    this.angle = Math.random() * Math.PI * 2;
    this.spinSpeed = 0.032;
    this.radius = 16;
    this.pulse = 0;
  }

  update(dt = 1) {
    this.angle += this.spinSpeed * dt;
    this.pulse += 0.08 * dt;
  }

  // Returns true if an entity at (px, py) is swept by either of the twin pulsar beams
  checkBeamHit(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.beamLength || dist < 6) return false;

    const ptAngle = Math.atan2(dy, dx);
    // Check both opposite beams (angle and angle + PI)
    for (let b = 0; b < 2; b++) {
      const beamAng = this.angle + b * Math.PI;
      let diff = Math.atan2(Math.sin(ptAngle - beamAng), Math.cos(ptAngle - beamAng));
      if (Math.abs(diff) < 0.14) {
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Outer Dyson Containment Rings
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.6, this.angle * 0.5, this.angle * 0.5 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Twin Sweeping Relativistic Beams
    ctx.rotate(this.angle);
    for (let b = 0; b < 2; b++) {
      ctx.rotate(b * Math.PI);
      const grad = ctx.createLinearGradient(0, 0, this.beamLength, 0);
      grad.addColorStop(0, 'rgba(255, 230, 100, 0.75)');
      grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.32)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.beamLength, -0.11, 0.11);
      ctx.closePath();
      ctx.fill();
    }

    // Pulsar Core Star
    const coreScale = 1 + Math.sin(this.pulse) * 0.15;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.55 * coreScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

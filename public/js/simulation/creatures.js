import { NeuralBrain } from './neuralNet.js';

let NEXT_CREATURE_ID = 1001;

export class Organism {
  constructor(x, y, species = 'herbivore', dna = null) {
    this.id = NEXT_CREATURE_ID++;
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.heading = Math.random() * Math.PI * 2;
    this.angularVelocity = 0;
    this.species = species; // 'herbivore', 'carnivore', or 'scavenger'

    // Genetic DNA Attributes
    this.dna = dna || this.createDefaultDNA(species);

    // Dynamic State
    this.energy = this.dna.initialEnergy;
    this.maxEnergy = this.dna.maxEnergy;
    this.age = 0;
    this.generation = this.dna.generation || 1;
    this.offspringCount = 0;
    this.killCount = 0;
    this.reproductionCooldown = 80 + Math.floor(Math.random() * 80);
    this.mutationCount = this.dna.mutationCount || 0;
    this.alive = true;
    this.matingDance = 0; // Ticks left in mating dance

    // Neural Network Cognitive Core
    this.brain = dna && dna.brain 
      ? (dna.brain instanceof NeuralBrain ? dna.brain : NeuralBrain.deserialize(dna.brain))
      : new NeuralBrain(8, 8, 4);

    // Segmented Tail Undulation (Procedural Vertebrae Chain)
    this.tailSegments = [];
    const segmentCount = this.species === 'carnivore' ? 7 : (this.species === 'scavenger' ? 4 : 5);
    for (let i = 0; i < segmentCount; i++) {
      this.tailSegments.push({ x: this.x, y: this.y, radius: Math.max(1, (segmentCount - i) * (this.dna.size * 0.22)) });
    }

    this.wigglePhase = Math.random() * Math.PI * 2;
    this.dashTimer = 0;
    this.lastTeleport = 0;
    this.inkCooldown = 0;
  }

  createDefaultDNA(species) {
    if (species === 'carnivore') {
      return {
        species: 'carnivore',
        generation: 1,
        size: 7.0,
        maxSpeed: 4.0,
        turnRate: 0.19,
        senseRadius: 170,
        fov: 120 * (Math.PI / 180),
        metabolism: 0.095,
        reproduceThreshold: 155,
        initialEnergy: 95,
        maxEnergy: 190,
        maxLifespan: 1900 + Math.random() * 600,
        mutationRate: 0.08,
        mutationCount: 0,
        hue: 345 + Math.random() * 25 // Crimson / Magenta
      };
    } else if (species === 'scavenger') {
      return {
        species: 'scavenger',
        generation: 1,
        size: 4.8,
        maxSpeed: 2.8,
        turnRate: 0.22,
        senseRadius: 140,
        fov: 180 * (Math.PI / 180),
        metabolism: 0.05,
        reproduceThreshold: 120,
        initialEnergy: 80,
        maxEnergy: 160,
        maxLifespan: 2200 + Math.random() * 800,
        mutationRate: 0.09,
        mutationCount: 0,
        hue: 40 + Math.random() * 25 // Amber / Gold
      };
    } else {
      // Herbivore
      return {
        species: 'herbivore',
        generation: 1,
        size: 5.2,
        maxSpeed: 3.2,
        turnRate: 0.18,
        senseRadius: 130,
        fov: 150 * (Math.PI / 180),
        metabolism: 0.065,
        reproduceThreshold: 130,
        initialEnergy: 85,
        maxEnergy: 180,
        maxLifespan: 1800 + Math.random() * 600,
        mutationRate: 0.08,
        mutationCount: 0,
        hue: 165 + Math.random() * 40 // Cyan / Emerald
      };
    }
  }

  // Sensory Perception + Neural Inference
  perceiveAndAct(quadTreeFood, quadTreePrey, quadTreePredators, pheromones, spacetimeDistortion, dt = 1) {
    if (!this.alive) {
      return { nearestTargetObj: null, dashActive: false, inkReleased: false };
    }

    this.age += dt;
    if (this.reproductionCooldown > 0) this.reproductionCooldown -= dt;
    if (this.inkCooldown > 0) this.inkCooldown -= dt;
    if (this.matingDance > 0) this.matingDance -= dt;

    this.wigglePhase += (0.15 + Math.hypot(this.vx, this.vy) * 0.1) * dt;

    // 1. Sensory Search: Food / Prey
    let nearestTargetDist = 1.0;
    let nearestTargetAngle = 0.0;
    let nearestTargetObj = null;

    const targetTree = this.species === 'carnivore' ? quadTreePrey : quadTreeFood;
    if (targetTree) {
      const candidates = targetTree.queryCircle(this.x, this.y, this.dna.senseRadius);
      let closestDistSq = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        if (item === this) continue;

        const dx = item.x - this.x;
        const dy = item.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < closestDistSq) {
          const angleToTarget = Math.atan2(dy, dx);
          let diffAngle = angleToTarget - this.heading;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) <= this.dna.fov * 0.5) {
            closestDistSq = distSq;
            nearestTargetDist = Math.sqrt(distSq) / this.dna.senseRadius;
            nearestTargetAngle = diffAngle / (this.dna.fov * 0.5);
            nearestTargetObj = item;
          }
        }
      }
    }

    // 2. Sensory Search: Danger / Predators
    let nearestDangerDist = 1.0;
    let nearestDangerAngle = 0.0;
    let inkReleased = false;

    if (this.species !== 'carnivore' && quadTreePredators) {
      const threats = quadTreePredators.queryCircle(this.x, this.y, this.dna.senseRadius * 1.15);
      let closestThreatSq = Infinity;

      for (let i = 0; i < threats.length; i++) {
        const threat = threats[i];
        const dx = threat.x - this.x;
        const dy = threat.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < closestThreatSq) {
          const angleToThreat = Math.atan2(dy, dx);
          let diffAngle = angleToThreat - this.heading;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          closestThreatSq = distSq;
          const threatDist = Math.sqrt(distSq);
          nearestDangerDist = threatDist / (this.dna.senseRadius * 1.15);
          nearestDangerAngle = diffAngle / Math.PI;

          // Defensive bioluminescent ink discharge when predator closes in
          if (threatDist < 35 && this.inkCooldown <= 0 && this.energy > 30) {
            this.inkCooldown = 180;
            this.energy -= 8;
            inkReleased = true;
          }
        }
      }
    }

    // 3. Sample Pheromone Field
    const scent = pheromones ? pheromones.sample(this.x, this.y) : 0;

    // 4. Neural Inputs Array (8 features)
    const inputs = [
      nearestTargetDist,
      nearestTargetAngle,
      nearestDangerDist,
      nearestDangerAngle,
      scent,
      Math.max(0, Math.min(1, this.energy / this.maxEnergy)),
      Math.min(1, Math.hypot(this.vx, this.vy) / this.dna.maxSpeed),
      Math.min(1, Math.abs(spacetimeDistortion.warpScalar || 0))
    ];

    // Neural Feedforward
    const outputs = this.brain.forward(inputs);

    // Apply Neural Outputs to Physics
    this.heading += outputs.steer * this.dna.turnRate * dt;

    let currentMaxSpeed = this.dna.maxSpeed;
    let dashActive = false;
    if (outputs.dash > 0.5 && this.energy > 28) {
      currentMaxSpeed *= 1.85;
      this.energy -= this.dna.metabolism * 1.6 * dt;
      dashActive = true;
    }

    const thrust = outputs.throttle * currentMaxSpeed;
    const targetVx = Math.cos(this.heading) * thrust;
    const targetVy = Math.sin(this.heading) * thrust;

    this.vx += (targetVx - this.vx) * 0.25 * dt;
    this.vy += (targetVy - this.vy) * 0.25 * dt;

    // Spacetime 4D distortion
    this.vx += (spacetimeDistortion.fx || 0) * dt;
    this.vy += (spacetimeDistortion.fy || 0) * dt;

    // Clamping: prevent relativistic runaway
    const speedLimit = currentMaxSpeed * 3.0;
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > speedLimit) {
      const scale = speedLimit / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }

    // Position integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Inverse Kinematics Tail Segment Update
    let leadX = this.x;
    let leadY = this.y;
    for (let i = 0; i < this.tailSegments.length; i++) {
      const seg = this.tailSegments[i];
      const dx = leadX - seg.x;
      const dy = leadY - seg.y;
      const dist = Math.hypot(dx, dy);
      const targetDist = this.dna.size * 1.1;

      if (dist > targetDist) {
        const angle = Math.atan2(dy, dx);
        seg.x = leadX - Math.cos(angle) * targetDist;
        seg.y = leadY - Math.sin(angle) * targetDist;
      }

      const wave = Math.sin(this.wigglePhase + i * 0.8) * (this.dna.size * 0.35);
      const normalX = -Math.sin(this.heading) * wave;
      const normalY = Math.cos(this.heading) * wave;
      seg.x += normalX * 0.2;
      seg.y += normalY * 0.2;

      leadX = seg.x;
      leadY = seg.y;
    }

    // Pheromone secretion
    if (pheromones && outputs.secrete > 0.3) {
      pheromones.deposit(this.x, this.y, 35 * outputs.secrete, this.species);
    }

    // Basal Metabolism
    const velocityBurn = (Math.hypot(this.vx, this.vy) / this.dna.maxSpeed) * 0.04;
    this.energy -= (this.dna.metabolism + velocityBurn) * dt;

    if (this.energy <= 0 || this.age > this.dna.maxLifespan) {
      this.alive = false;
    }

    return { nearestTargetObj, dashActive, inkReleased };
  }

  // Asexual Mitosis with Mutation
  reproduce() {
    this.energy *= 0.5;
    this.offspringCount++;
    this.reproductionCooldown = 180;

    const mutatedDNA = {
      ...this.dna,
      generation: this.generation + 1,
      size: Math.max(3.5, Math.min(10.0, this.dna.size + (Math.random() - 0.5) * 0.5)),
      maxSpeed: Math.max(1.8, Math.min(5.5, this.dna.maxSpeed + (Math.random() - 0.5) * 0.3)),
      senseRadius: Math.max(80, Math.min(240, this.dna.senseRadius + (Math.random() - 0.5) * 15)),
      fov: Math.max(60 * (Math.PI / 180), Math.min(220 * (Math.PI / 180), this.dna.fov + (Math.random() - 0.5) * 0.15)),
      metabolism: Math.max(0.04, Math.min(0.16, this.dna.metabolism + (Math.random() - 0.5) * 0.01)),
      hue: (this.dna.hue + (Math.random() - 0.5) * 12 + 360) % 360,
      mutationCount: this.mutationCount + 1,
      brain: this.brain.mutate(this.dna.mutationRate, 0.35)
    };

    const offspring = new Organism(
      this.x + (Math.random() - 0.5) * 24,
      this.y + (Math.random() - 0.5) * 24,
      this.species,
      mutatedDNA
    );
    offspring.energy = this.energy;
    offspring.reproductionCooldown = 120;
    return offspring;
  }

  // Sexual Reproduction (Meiosis / Crossover with Partner)
  mateWith(partner) {
    this.energy *= 0.6;
    partner.energy *= 0.6;
    this.offspringCount++;
    partner.offspringCount++;
    this.reproductionCooldown = 220;
    partner.reproductionCooldown = 220;
    this.matingDance = 40;
    partner.matingDance = 40;

    const childBrain = NeuralBrain.crossover(this.brain, partner.brain).mutate(0.06, 0.25);
    const childDNA = {
      species: this.species,
      generation: Math.max(this.generation, partner.generation) + 1,
      size: (this.dna.size + partner.dna.size) * 0.5 + (Math.random() - 0.5) * 0.3,
      maxSpeed: (this.dna.maxSpeed + partner.dna.maxSpeed) * 0.5 + (Math.random() - 0.5) * 0.2,
      senseRadius: (this.dna.senseRadius + partner.dna.senseRadius) * 0.5,
      fov: (this.dna.fov + partner.dna.fov) * 0.5,
      metabolism: (this.dna.metabolism + partner.dna.metabolism) * 0.5,
      reproduceThreshold: this.dna.reproduceThreshold,
      initialEnergy: 85,
      maxEnergy: (this.dna.maxEnergy + partner.dna.maxEnergy) * 0.5,
      maxLifespan: 1900 + Math.random() * 600,
      mutationRate: (this.dna.mutationRate + partner.dna.mutationRate) * 0.5,
      mutationCount: Math.max(this.mutationCount, partner.mutationCount) + 1,
      hue: (this.dna.hue + partner.dna.hue) * 0.5,
      brain: childBrain
    };

    const child = new Organism(
      (this.x + partner.x) * 0.5,
      (this.y + partner.y) * 0.5,
      this.species,
      childDNA
    );
    child.energy = 85;
    return child;
  }

  // Force Mutate (from God Tool Cosmic Mutagen Ray)
  forceMutate() {
    this.mutationCount++;
    this.dna.mutationRate = Math.min(0.35, this.dna.mutationRate * 1.4);
    this.dna.size = Math.max(3.5, Math.min(12.0, this.dna.size * (0.8 + Math.random() * 0.5)));
    this.dna.maxSpeed = Math.max(2.0, Math.min(6.5, this.dna.maxSpeed * (0.8 + Math.random() * 0.5)));
    this.dna.senseRadius = Math.max(80, Math.min(280, this.dna.senseRadius * (0.8 + Math.random() * 0.5)));
    this.dna.hue = (this.dna.hue + Math.random() * 140) % 360;
    this.brain = this.brain.mutate(0.35, 0.65);
  }

  render(ctx, isSelected = false, zoom = 1.0) {
    if (!this.alive) return;

    ctx.save();

    const isCarn = this.species === 'carnivore';
    const isScav = this.species === 'scavenger';
    const mainColor = `hsl(${this.dna.hue}, 100%, 65%)`;
    const coreColor = `hsl(${this.dna.hue}, 90%, 90%)`;

    // Bioluminescent Glow Aura
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = isSelected ? 24 : (this.mutationCount > 2 ? 16 : 10);

    // Mating Dance Halo
    if (this.matingDance > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.dna.size * 3.0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Tail Segments
    for (let i = this.tailSegments.length - 1; i >= 0; i--) {
      const seg = this.tailSegments[i];
      const alpha = 0.4 + (1 - i / this.tailSegments.length) * 0.5;
      ctx.fillStyle = `hsla(${this.dna.hue}, 90%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, Math.max(1, seg.radius), 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Head & Anatomy
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    // Head Oval
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.dna.size * 1.35, this.dna.size, 0, 0, Math.PI * 2);
    ctx.fill();

    // Core Energy Gem / Beating Heart
    const energyNorm = Math.max(0.2, Math.min(1.0, this.energy / this.maxEnergy));
    const heartBeat = Math.sin(this.age * 0.1) * 0.15 + 1.0;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.dna.size * 0.55 * energyNorm * heartBeat, 0, Math.PI * 2);
    ctx.fill();

    // Microscopic Detail: Internal neural fibers when zoomed in
    if (zoom >= 1.6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-this.dna.size * 0.7, 0);
      ctx.lineTo(this.dna.size * 0.7, 0);
      ctx.moveTo(0, -this.dna.size * 0.5);
      ctx.lineTo(0, this.dna.size * 0.5);
      ctx.stroke();
    }

    // Mandibles for Carnivores
    if (isCarn) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(this.dna.size * 0.8, -this.dna.size * 0.6);
      ctx.lineTo(this.dna.size * 1.8, -this.dna.size * 0.2);
      ctx.moveTo(this.dna.size * 0.8, this.dna.size * 0.6);
      ctx.lineTo(this.dna.size * 1.8, this.dna.size * 0.2);
      ctx.stroke();
    } else if (isScav) {
      // Feeder Tentacle Array for Scavengers
      ctx.strokeStyle = '#ffee88';
      ctx.lineWidth = 1.0;
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(this.dna.size * 0.9, t * 1.8);
        ctx.lineTo(this.dna.size * 1.5, t * 2.8 + Math.sin(this.wigglePhase + t) * 2);
        ctx.stroke();
      }
    }

    // Sensory Antennae / Whisker Filaments
    ctx.strokeStyle = `hsla(${this.dna.hue}, 100%, 80%, 0.65)`;
    ctx.lineWidth = 1.2;
    const whiskerWiggle = Math.sin(this.wigglePhase * 1.5) * 0.2;
    ctx.beginPath();
    ctx.moveTo(this.dna.size * 0.6, -this.dna.size * 0.4);
    ctx.lineTo(this.dna.size * 1.6, -this.dna.size * 0.9 + whiskerWiggle * 5);
    ctx.moveTo(this.dna.size * 0.6, this.dna.size * 0.4);
    ctx.lineTo(this.dna.size * 1.6, this.dna.size * 0.9 + whiskerWiggle * 5);
    ctx.stroke();

    // Extra mutation crown if mutated multiple times
    if (this.mutationCount >= 2) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, this.dna.size * 1.6, -0.8, 0.8);
      ctx.stroke();
    }

    // Selection Reticle if tracked
    if (isSelected) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, this.dna.size * 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // Vision cone indicator
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.dna.senseRadius, -this.dna.fov * 0.5, this.dna.fov * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

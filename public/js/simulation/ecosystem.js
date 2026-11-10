import { QuadTree } from './quadtree.js';
import { Organism } from './creatures.js';
import { QuantumSpore, PhysarumAgent, CosmicWell, SpacetimeRift, BioluminescentInk, ShockwaveRing, StasisBubble, PulsarBeacon } from './particles.js';
import { PheromoneField } from './pheromones.js';

export class Ecosystem {
  constructor(width, height, soundEngine, tesseract) {
    this.width = width;
    this.height = height;
    this.soundEngine = soundEngine;
    this.tesseract = tesseract;

    this.pheromones = new PheromoneField(width, height, 4);

    this.creatures = [];
    this.spores = [];
    this.slimeAgents = [];
    this.gravWells = [];
    this.rifts = [];
    this.pulsars = [];
    this.inkPuffs = [];
    this.shockwaves = [];
    this.stasisBubbles = [];
    this.lightningArcs = [];

    // Population Caps
    this.maxCreatures = 160;
    this.maxSpores = 400;
    this.maxSlimeAgents = 450;

    // Simulation Stats & Telemetry
    this.tick = 0;
    this.maxGeneration = 1;
    this.totalBorn = 0;
    this.totalDied = 0;
    this.totalKills = 0;
    this.history = [];
    this.timeDilation = 1.0;
    this.paused = false;

    // Selected Specimen for tracking & inspector
    this.selectedCreature = null;

    this.loadPreset('genesis');
  }

  resize(w, h) {
    this.width = w;
    this.height = h;
    this.pheromones.resize(w, h);
    if (this.tesseract) this.tesseract.resize(w, h);
  }

  reset() {
    this.creatures = [];
    this.spores = [];
    this.slimeAgents = [];
    this.gravWells = [];
    this.rifts = [];
    this.pulsars = [];
    this.inkPuffs = [];
    this.shockwaves = [];
    this.stasisBubbles = [];
    this.lightningArcs = [];
    this.pheromones.clear();
    this.selectedCreature = null;
    this.tick = 0;
    this.maxGeneration = 1;
    this.totalBorn = 0;
    this.totalDied = 0;
    this.totalKills = 0;
    this.history = [];
  }

  loadPreset(presetName) {
    this.reset();
    const cx = this.width / 2;
    const cy = this.height / 2;

    switch (presetName) {
      case 'genesis':
        for (let i = 0; i < 40; i++) {
          this.spawnCreature('herbivore', cx + (Math.random() - 0.5) * 600, cy + (Math.random() - 0.5) * 400);
        }
        for (let i = 0; i < 8; i++) {
          this.spawnCreature('carnivore', cx + (Math.random() - 0.5) * 700, cy + (Math.random() - 0.5) * 500);
        }
        for (let i = 0; i < 8; i++) {
          this.spawnCreature('scavenger', cx + (Math.random() - 0.5) * 500, cy + (Math.random() - 0.5) * 400);
        }
        for (let i = 0; i < 180; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        for (let i = 0; i < 160; i++) {
          this.slimeAgents.push(new PhysarumAgent(Math.random() * this.width, Math.random() * this.height));
        }
        break;

      case 'predator_wars':
        for (let i = 0; i < 55; i++) {
          this.spawnCreature('herbivore', cx + (Math.random() - 0.5) * 800, cy + (Math.random() - 0.5) * 600);
        }
        for (let i = 0; i < 22; i++) {
          this.spawnCreature('carnivore', cx + (Math.random() - 0.5) * 800, cy + (Math.random() - 0.5) * 600);
        }
        for (let i = 0; i < 10; i++) {
          this.spawnCreature('scavenger', cx + (Math.random() - 0.5) * 800, cy + (Math.random() - 0.5) * 600);
        }
        for (let i = 0; i < 240; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        break;

      case 'tesseract_singularity':
        for (let i = 0; i < 35; i++) {
          this.spawnCreature('herbivore', cx + (Math.random() - 0.5) * 500, cy + (Math.random() - 0.5) * 400);
        }
        for (let i = 0; i < 8; i++) {
          this.spawnCreature('carnivore', cx + (Math.random() - 0.5) * 500, cy + (Math.random() - 0.5) * 400);
        }
        for (let i = 0; i < 12; i++) {
          this.spawnCreature('scavenger', cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300);
        }
        this.gravWells.push(new CosmicWell(cx - 200, cy, 1.2, false));
        this.gravWells.push(new CosmicWell(cx + 200, cy, 1.0, true));
        this.rifts.push(new SpacetimeRift(cx, cy - 180, cx, cy + 180));
        for (let i = 0; i < 150; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        break;

      case 'physarum_mycelium':
        for (let i = 0; i < 400; i++) {
          this.slimeAgents.push(new PhysarumAgent(cx + (Math.random() - 0.5) * 350, cy + (Math.random() - 0.5) * 350));
        }
        for (let i = 0; i < 25; i++) {
          this.spawnCreature('herbivore', Math.random() * this.width, Math.random() * this.height);
        }
        for (let i = 0; i < 140; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        break;

      case 'supernova_entropy':
        for (let i = 0; i < 50; i++) {
          const type = Math.random() > 0.5 ? 'herbivore' : (Math.random() > 0.5 ? 'carnivore' : 'scavenger');
          const org = this.spawnCreature(type, Math.random() * this.width, Math.random() * this.height);
          if (org) org.forceMutate();
        }
        for (let i = 0; i < 3; i++) {
          this.gravWells.push(new CosmicWell(Math.random() * this.width, Math.random() * this.height, 1.4, Math.random() > 0.5));
        }
        for (let i = 0; i < 200; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        this.triggerSupernova(cx, cy);
        break;

      case 'dyson_swarm':
        this.pulsars.push(new PulsarBeacon(cx - 220, cy, 240));
        this.pulsars.push(new PulsarBeacon(cx + 220, cy, 240));
        this.rifts.push(new SpacetimeRift(cx - 220, cy - 160, cx + 220, cy + 160));
        for (let i = 0; i < 42; i++) {
          this.spawnCreature('herbivore', cx + (Math.random() - 0.5) * 700, cy + (Math.random() - 0.5) * 500);
        }
        for (let i = 0; i < 12; i++) {
          this.spawnCreature('carnivore', cx + (Math.random() - 0.5) * 700, cy + (Math.random() - 0.5) * 500);
        }
        for (let i = 0; i < 16; i++) {
          this.spawnCreature('scavenger', cx + (Math.random() - 0.5) * 600, cy + (Math.random() - 0.5) * 450);
        }
        for (let i = 0; i < 200; i++) {
          this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
        }
        break;
    }
  }

  spawnCreature(species, x, y, dna = null) {
    if (this.creatures.length >= this.maxCreatures) return null;
    const org = new Organism(x, y, species, dna);
    this.creatures.push(org);
    this.totalBorn++;
    return org;
  }

  // --- God Interventions ---
  spawnSingularity(x, y) {
    const well = new CosmicWell(x, y, 1.2, false);
    this.gravWells.push(well);
    this.shockwaves.push(new ShockwaveRing(x, y, 180, '#ff0077'));
    if (this.soundEngine) this.soundEngine.playEat(true);
    return well;
  }

  spawnRepulsor(x, y) {
    const well = new CosmicWell(x, y, 1.2, true);
    this.gravWells.push(well);
    this.shockwaves.push(new ShockwaveRing(x, y, 180, '#00f0ff'));
    if (this.soundEngine) this.soundEngine.playBirth();
    return well;
  }

  spawnSporeBloom(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      if (this.spores.length >= this.maxSpores) break;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      this.spores.push(new QuantumSpore(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist));
    }
  }

  fireCosmicRay(x, y, radius = 85) {
    let mutated = 0;
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      if (Math.hypot(c.x - x, c.y - y) <= radius) {
        c.forceMutate();
        mutated++;
      }
    }
    this.shockwaves.push(new ShockwaveRing(x, y, radius * 1.5, '#b026ff'));
    if (this.soundEngine) this.soundEngine.playCosmicRay();
    return mutated;
  }

  triggerSupernova(x, y) {
    this.shockwaves.push(new ShockwaveRing(x, y, 380, '#ffaa00'));
    this.shockwaves.push(new ShockwaveRing(x, y, 220, '#ffffff'));
    this.spawnSporeBloom(x, y, 40);

    // Push entities outward
    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      const dx = c.x - x;
      const dy = c.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < 320 && dist > 1) {
        c.vx += (dx / dist) * 12;
        c.vy += (dy / dist) * 12;
        c.energy = Math.min(c.maxEnergy, c.energy + 30);
      }
    }
    if (this.soundEngine) this.soundEngine.playCosmicRay();
  }

  spawnStasisBubble(x, y, radius = 95) {
    const bubble = new StasisBubble(x, y, radius);
    this.stasisBubbles.push(bubble);
    this.shockwaves.push(new ShockwaveRing(x, y, radius, '#00f0ff'));
    if (this.soundEngine) this.soundEngine.playBirth();
    return bubble;
  }

  chainLightning(x, y, targetCount = 6) {
    const targets = [];
    const sorted = [...this.creatures].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y));
    const count = Math.min(targetCount, sorted.length);

    let prevPoint = { x, y };
    for (let i = 0; i < count; i++) {
      const c = sorted[i];
      c.forceMutate();
      c.energy = Math.min(c.maxEnergy, c.energy + 40);
      this.lightningArcs.push({ x1: prevPoint.x, y1: prevPoint.y, x2: c.x, y2: c.y, life: 1.0 });
      prevPoint = { x: c.x, y: c.y };
    }
    if (this.soundEngine) this.soundEngine.playCosmicRay();
    return count;
  }

  spawnRift(x1, y1, x2, y2) {
    const rift = new SpacetimeRift(x1, y1, x2, y2);
    this.rifts.push(rift);
    this.shockwaves.push(new ShockwaveRing(x1, y1, 80, '#b026ff'));
    this.shockwaves.push(new ShockwaveRing(x2, y2, 80, '#b026ff'));
    if (this.soundEngine) this.soundEngine.playBirth();
    return rift;
  }

  spawnPulsar(x, y) {
    const pulsar = new PulsarBeacon(x, y, 230);
    this.pulsars.push(pulsar);
    this.shockwaves.push(new ShockwaveRing(x, y, 160, '#ffaa00'));
    if (this.soundEngine) this.soundEngine.playCosmicRay();
    return pulsar;
  }

  removeWellAt(x, y, radius = 35) {
    const prevCount = this.gravWells.length;
    this.gravWells = this.gravWells.filter(w => Math.hypot(w.x - x, w.y - y) > radius);
    return prevCount !== this.gravWells.length;
  }

  removePulsarAt(x, y, radius = 35) {
    const prevCount = this.pulsars.length;
    this.pulsars = this.pulsars.filter(p => Math.hypot(p.x - x, p.y - y) > radius);
    return prevCount !== this.pulsars.length;
  }

  removeRiftAt(x, y, radius = 35) {
    const prevCount = this.rifts.length;
    this.rifts = this.rifts.filter(r => {
      const d1 = Math.hypot(r.nodeA.x - x, r.nodeA.y - y);
      const d2 = Math.hypot(r.nodeB.x - x, r.nodeB.y - y);
      return d1 > radius && d2 > radius;
    });
    return prevCount !== this.rifts.length;
  }

  // Main Simulation Step
  update() {
    if (this.paused) return;

    const dt = this.timeDilation;
    this.tick++;

    // 1. Update 4D Manifold
    if (this.tesseract) {
      this.tesseract.update(dt);
    }

    // 2. Diffuse & Evaporate Pheromones
    this.pheromones.step();

    // 3. Update Cosmic Wells, Rifts, Pulsars, and FX
    for (let i = 0; i < this.gravWells.length; i++) this.gravWells[i].update(dt);
    for (let i = 0; i < this.rifts.length; i++) this.rifts[i].update(dt);
    this.rifts = this.rifts.filter(r => !r.isDead());

    for (let i = 0; i < this.pulsars.length; i++) {
      const p = this.pulsars[i];
      p.update(dt);
      // Periodically catalyze quantum spores along pulsar beam tips
      if (this.spores.length < this.maxSpores && Math.random() < 0.18 * dt) {
        const bAng = p.angle + (Math.random() > 0.5 ? Math.PI : 0);
        const dist = 35 + Math.random() * (p.beamLength - 35);
        const sx = (p.x + Math.cos(bAng) * dist + this.width) % this.width;
        const sy = (p.y + Math.sin(bAng) * dist + this.height) % this.height;
        this.spores.push(new QuantumSpore(sx, sy, 48));
      }
    }

    for (let i = 0; i < this.inkPuffs.length; i++) this.inkPuffs[i].update(dt);
    this.inkPuffs = this.inkPuffs.filter(p => !p.isDead());

    for (let i = 0; i < this.shockwaves.length; i++) this.shockwaves[i].update(dt);
    this.shockwaves = this.shockwaves.filter(s => !s.isDead());

    for (let i = 0; i < this.stasisBubbles.length; i++) this.stasisBubbles[i].update(dt);
    this.stasisBubbles = this.stasisBubbles.filter(b => !b.isDead());

    for (let i = 0; i < this.lightningArcs.length; i++) this.lightningArcs[i].life -= 0.08 * dt;
    this.lightningArcs = this.lightningArcs.filter(l => l.life > 0);

    // 4. Update Slime Mold Agents
    for (let i = 0; i < this.slimeAgents.length; i++) {
      this.slimeAgents[i].update(this.pheromones, dt, this.width, this.height);
    }

    // 5. Update Spores
    for (let i = 0; i < this.spores.length; i++) {
      this.spores[i].update(dt, this.width, this.height, this.gravWells);
    }

    // Smooth Spore replenishment
    if (this.spores.length < 110) {
      const needed = Math.min(5, 130 - this.spores.length);
      for (let s = 0; s < needed; s++) {
        this.spores.push(new QuantumSpore(Math.random() * this.width, Math.random() * this.height));
      }
    }

    // 6. Build Spatial Partitioning QuadTrees
    const boundary = { x: 0, y: 0, width: this.width, height: this.height };
    const quadTreeFood = new QuadTree(boundary, 8);
    const quadTreePrey = new QuadTree(boundary, 8);
    const quadTreePredators = new QuadTree(boundary, 8);

    for (let i = 0; i < this.spores.length; i++) {
      const s = this.spores[i];
      quadTreeFood.insert({ x: s.x, y: s.y, data: s });
    }

    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      if (c.species === 'carnivore') {
        quadTreePredators.insert({ x: c.x, y: c.y, data: c });
      } else {
        quadTreePrey.insert({ x: c.x, y: c.y, data: c });
      }
    }

    // 7. Update Organisms
    const newOffspring = [];
    const deadIndices = new Set();
    const consumedSpores = new Set();

    for (let i = 0; i < this.creatures.length; i++) {
      const org = this.creatures[i];
      if (!org.alive) {
        deadIndices.add(i);
        continue;
      }

      // Check if inside Stasis Bubble (time frozen)
      let inStasis = false;
      for (let b = 0; b < this.stasisBubbles.length; b++) {
        if (this.stasisBubbles[b].contains(org.x, org.y)) {
          inStasis = true;
          break;
        }
      }
      if (inStasis) continue;

      const warp = this.tesseract ? this.tesseract.getSpacetimeDistortion(org.x, org.y) : { fx: 0, fy: 0, warpScalar: 0 };

      for (let w = 0; w < this.gravWells.length; w++) {
        const well = this.gravWells[w];
        const dx = well.x - org.x;
        const dy = well.y - org.y;
        const dSq = dx * dx + dy * dy + 100;
        const d = Math.sqrt(dSq);
        if (d < 300) {
          const f = (well.strength * 1600) / dSq;
          warp.fx += (dx / d) * f;
          warp.fy += (dy / d) * f;
        }

        if (!well.isRepulsor && d < well.radius) {
          org.alive = false;
        }
      }

      for (let r = 0; r < this.rifts.length; r++) {
        this.rifts[r].checkTeleport(org);
      }

      // Pulsar Beam Energization & Hyper-Evolution
      for (let p = 0; p < this.pulsars.length; p++) {
        if (this.pulsars[p].checkBeamHit(org.x, org.y)) {
          org.energy = Math.min(org.maxEnergy, org.energy + 0.9 * dt);
          if (Math.random() < 0.008 * dt) {
            org.forceMutate();
          }
        }
      }

      const { nearestTargetObj, inkReleased } = org.perceiveAndAct(
        quadTreeFood,
        quadTreePrey,
        quadTreePredators,
        this.pheromones,
        warp,
        dt
      );

      if (inkReleased) {
        for (let k = 0; k < 4; k++) {
          this.inkPuffs.push(new BioluminescentInk(org.x, org.y));
        }
      }

      if (org.x < 0) org.x += this.width;
      if (org.x > this.width) org.x -= this.width;
      if (org.y < 0) org.y += this.height;
      if (org.y > this.height) org.y -= this.height;

      // Contact & Eating
      if (nearestTargetObj) {
        const dist = Math.hypot(nearestTargetObj.x - org.x, nearestTargetObj.y - org.y);
        const contactRadius = org.dna.size + (nearestTargetObj.dna ? nearestTargetObj.dna.size : nearestTargetObj.radius);

        if (dist <= contactRadius) {
          if (org.species !== 'carnivore' && nearestTargetObj instanceof QuantumSpore) {
            org.energy = Math.min(org.maxEnergy, org.energy + nearestTargetObj.energy);
            consumedSpores.add(nearestTargetObj);
            if (this.soundEngine && Math.random() < 0.25) this.soundEngine.playEat(false);
          } else if (org.species === 'carnivore' && nearestTargetObj instanceof Organism && nearestTargetObj.species !== 'carnivore') {
            org.energy = Math.min(org.maxEnergy, org.energy + nearestTargetObj.energy * 0.75);
            org.killCount++;
            this.totalKills++;
            nearestTargetObj.alive = false;
            if (this.soundEngine) this.soundEngine.playEat(true);

            for (let s = 0; s < 3; s++) {
              if (this.spores.length < this.maxSpores) {
                this.spores.push(new QuantumSpore(nearestTargetObj.x + (Math.random() - 0.5) * 15, nearestTargetObj.y + (Math.random() - 0.5) * 15, 25));
              }
            }
          }
        }
      }

      // Check Sexual Mating Dance (Meiosis)
      if (org.energy >= org.dna.reproduceThreshold && org.reproductionCooldown <= 0 && this.creatures.length < this.maxCreatures) {
        let mated = false;
        // Search nearby partners of same species
        for (let j = i + 1; j < this.creatures.length; j++) {
          const partner = this.creatures[j];
          if (partner.alive && partner.species === org.species && partner.energy >= partner.dna.reproduceThreshold && partner.reproductionCooldown <= 0) {
            if (Math.hypot(partner.x - org.x, partner.y - org.y) < 32) {
              const child = org.mateWith(partner);
              newOffspring.push(child);
              this.totalBorn++;
              if (child.generation > this.maxGeneration) this.maxGeneration = child.generation;
              if (this.soundEngine) this.soundEngine.playBirth();
              mated = true;
              break;
            }
          }
        }

        // Asexual fallback if alone
        if (!mated && org.age > 90) {
          const baby = org.reproduce();
          newOffspring.push(baby);
          this.totalBorn++;
          if (baby.generation > this.maxGeneration) this.maxGeneration = baby.generation;
          if (this.soundEngine && Math.random() < 0.25) this.soundEngine.playBirth();
        }
      }

      if (!org.alive) {
        deadIndices.add(i);
        this.totalDied++;
        for (let s = 0; s < 2; s++) {
          if (this.spores.length < this.maxSpores) {
            this.spores.push(new QuantumSpore(org.x + (Math.random() - 0.5) * 10, org.y + (Math.random() - 0.5) * 10, 30));
          }
        }
      }
    }

    if (consumedSpores.size > 0) {
      this.spores = this.spores.filter(s => !consumedSpores.has(s));
    }

    if (deadIndices.size > 0 || newOffspring.length > 0) {
      this.creatures = this.creatures.filter((_, idx) => !deadIndices.has(idx)).concat(newOffspring);
    }

    // Extinction Prevention Re-seeding
    let herbCount = 0;
    let carnCount = 0;
    let scavCount = 0;
    for (let i = 0; i < this.creatures.length; i++) {
      if (this.creatures[i].species === 'herbivore') herbCount++;
      else if (this.creatures[i].species === 'carnivore') carnCount++;
      else if (this.creatures[i].species === 'scavenger') scavCount++;
    }

    if (herbCount === 0) {
      for (let i = 0; i < 15; i++) {
        this.spawnCreature('herbivore', Math.random() * this.width, Math.random() * this.height);
      }
    }
    if (carnCount === 0 && herbCount > 25) {
      for (let i = 0; i < 3; i++) {
        this.spawnCreature('carnivore', Math.random() * this.width, Math.random() * this.height);
      }
    }
    if (scavCount === 0 && this.creatures.length > 15) {
      for (let i = 0; i < 3; i++) {
        this.spawnCreature('scavenger', Math.random() * this.width, Math.random() * this.height);
      }
    }

    if (this.tick % 20 === 0) {
      this.recordTelemetry(herbCount, carnCount, scavCount);
    }
  }

  recordTelemetry(herbCount, carnCount, scavCount = 0) {
    let totalBiomass = 0;
    for (let i = 0; i < this.creatures.length; i++) totalBiomass += this.creatures[i].energy;

    const diversity = this.calculateDiversityIndex();
    this.history.push({
      tick: this.tick,
      herbivores: herbCount,
      carnivores: carnCount,
      scavengers: scavCount,
      biomass: totalBiomass,
      diversity: diversity
    });
    if (this.history.length > 100) this.history.shift();
  }

  // Compute composite evolutionary fitness for Hall of Fame Leaderboard
  getCreatureFitness(c) {
    if (!c || !c.alive) return 0;
    return Math.round(
      c.generation * 25 +
      c.killCount * 40 +
      c.offspringCount * 35 +
      c.age * 0.12 +
      c.energy * 0.25 +
      c.mutationCount * 15
    );
  }

  getHallOfFame(limit = 5) {
    return this.creatures
      .filter(c => c.alive)
      .map(c => ({
        creature: c,
        fitness: this.getCreatureFitness(c)
      }))
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, limit);
  }

  calculateDiversityIndex() {
    if (this.creatures.length === 0) return 0;
    let sumSpeedVariance = 0;
    let sumSenseVariance = 0;
    const avgSpeed = this.creatures.reduce((acc, c) => acc + c.dna.maxSpeed, 0) / this.creatures.length;
    const avgSense = this.creatures.reduce((acc, c) => acc + c.dna.senseRadius, 0) / this.creatures.length;

    for (let i = 0; i < this.creatures.length; i++) {
      const c = this.creatures[i];
      sumSpeedVariance += Math.abs(c.dna.maxSpeed - avgSpeed);
      sumSenseVariance += Math.abs(c.dna.senseRadius - avgSense);
    }

    const diversity = (sumSpeedVariance / this.creatures.length) * 0.5 + (sumSenseVariance / (this.creatures.length * 100)) * 0.5;
    return Math.min(1.0, diversity);
  }

  // Camera-Aware Multi-Layer Rendering
  render(canvasTrails, canvasSim, canvasFX, camera = { x: 0, y: 0, zoom: 1.0 }) {
    const ctxTrails = canvasTrails.getContext('2d');
    const ctxSim = canvasSim.getContext('2d');
    const ctxFX = canvasFX.getContext('2d');

    // 1. Trails Canvas
    ctxTrails.clearRect(0, 0, this.width, this.height);
    this.pheromones.renderTo(ctxTrails, this.width, this.height, camera);

    // 2. Sim Canvas (Slime agents, spores, ink puffs, organisms)
    ctxSim.clearRect(0, 0, this.width, this.height);
    ctxSim.save();
    ctxSim.translate(this.width / 2, this.height / 2);
    ctxSim.scale(camera.zoom, camera.zoom);
    ctxSim.translate(-this.width / 2 + camera.x, -this.height / 2 + camera.y);

    for (let i = 0; i < this.slimeAgents.length; i++) this.slimeAgents[i].render(ctxSim);
    for (let i = 0; i < this.spores.length; i++) this.spores[i].render(ctxSim);
    for (let i = 0; i < this.inkPuffs.length; i++) this.inkPuffs[i].render(ctxSim);

    for (let i = 0; i < this.creatures.length; i++) {
      const org = this.creatures[i];
      const isSelected = org === this.selectedCreature;
      org.render(ctxSim, isSelected, camera.zoom);
    }
    ctxSim.restore();

    // 3. FX Canvas (Singularities, rifts, shockwaves, stasis bubbles, lightning)
    ctxFX.clearRect(0, 0, this.width, this.height);
    ctxFX.save();
    ctxFX.translate(this.width / 2, this.height / 2);
    ctxFX.scale(camera.zoom, camera.zoom);
    ctxFX.translate(-this.width / 2 + camera.x, -this.height / 2 + camera.y);

    for (let i = 0; i < this.stasisBubbles.length; i++) this.stasisBubbles[i].render(ctxFX);
    for (let i = 0; i < this.pulsars.length; i++) this.pulsars[i].render(ctxFX);
    for (let i = 0; i < this.gravWells.length; i++) this.gravWells[i].render(ctxFX);
    for (let i = 0; i < this.rifts.length; i++) this.rifts[i].render(ctxFX);
    for (let i = 0; i < this.shockwaves.length; i++) this.shockwaves[i].render(ctxFX);

    // Render Lightning Arcs
    for (let i = 0; i < this.lightningArcs.length; i++) {
      const l = this.lightningArcs[i];
      ctxFX.save();
      ctxFX.strokeStyle = `rgba(180, 100, 255, ${l.life})`;
      ctxFX.shadowColor = '#b026ff';
      ctxFX.shadowBlur = 14;
      ctxFX.lineWidth = 2.0 * l.life;
      ctxFX.beginPath();
      ctxFX.moveTo(l.x1, l.y1);
      // Zigzag lightning
      const midX = (l.x1 + l.x2) * 0.5 + (Math.random() - 0.5) * 24;
      const midY = (l.y1 + l.y2) * 0.5 + (Math.random() - 0.5) * 24;
      ctxFX.lineTo(midX, midY);
      ctxFX.lineTo(l.x2, l.y2);
      ctxFX.stroke();
      ctxFX.restore();
    }

    ctxFX.restore();
  }

  exportState(name = 'Universe_Snapshot') {
    return {
      name: name,
      version: '1.2.0',
      timestamp: Date.now(),
      stats: {
        tick: this.tick,
        generation: this.maxGeneration,
        totalBorn: this.totalBorn,
        totalDied: this.totalDied,
        totalKills: this.totalKills,
        creaturesCount: this.creatures.length,
        sporesCount: this.spores.length
      },
      creatures: this.creatures.map(c => ({
        x: c.x,
        y: c.y,
        species: c.species,
        dna: {
          ...c.dna,
          brain: c.brain.serialize()
        },
        energy: c.energy,
        age: c.age,
        generation: c.generation,
        kills: c.killCount,
        offspring: c.offspringCount
      })),
      spores: this.spores.map(s => ({ x: s.x, y: s.y, energy: s.energy })),
      gravWells: this.gravWells.map(g => ({ x: g.x, y: g.y, strength: g.strength, isRepulsor: g.isRepulsor })),
      pulsars: this.pulsars.map(p => ({ x: p.x, y: p.y, beamLength: p.beamLength }))
    };
  }

  importState(data) {
    this.reset();
    this.tick = data.stats?.tick || 0;
    this.totalBorn = data.stats?.totalBorn || (data.creatures?.length || 0);
    this.totalDied = data.stats?.totalDied || 0;
    this.totalKills = data.stats?.totalKills || 0;

    let maxGen = 1;
    if (data.creatures) {
      for (let i = 0; i < data.creatures.length; i++) {
        const item = data.creatures[i];
        const org = this.spawnCreature(item.species, item.x, item.y, item.dna);
        if (org) {
          org.energy = item.energy;
          org.age = item.age;
          org.generation = item.generation || 1;
          org.killCount = item.kills || 0;
          org.offspringCount = item.offspring || 0;
          if (org.generation > maxGen) maxGen = org.generation;
        }
      }
    }
    this.maxGeneration = data.stats?.generation || maxGen;

    if (data.spores) {
      for (let i = 0; i < data.spores.length; i++) {
        const s = data.spores[i];
        this.spores.push(new QuantumSpore(s.x, s.y, s.energy));
      }
    }

    if (data.gravWells) {
      for (let i = 0; i < data.gravWells.length; i++) {
        const g = data.gravWells[i];
        this.gravWells.push(new CosmicWell(g.x, g.y, Math.abs(g.strength), g.isRepulsor));
      }
    }

    if (data.pulsars) {
      for (let i = 0; i < data.pulsars.length; i++) {
        const p = data.pulsars[i];
        this.pulsars.push(new PulsarBeacon(p.x, p.y, p.beamLength || 230));
      }
    }
  }
}

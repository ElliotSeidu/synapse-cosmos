// Specimen Inspector & Live Neural Network Visualizer

export class SpecimenInspector {
  constructor(ecosystem, soundEngine) {
    this.ecosystem = ecosystem;
    this.soundEngine = soundEngine;

    this.panel = document.getElementById('specimen-panel');
    this.canvas = document.getElementById('brain-canvas');
    this.ctx = this.canvas.getContext('2d');

    // DOM Elements
    this.nameEl = document.getElementById('specimen-name');
    this.taxonomyEl = document.getElementById('specimen-taxonomy');
    this.glyphEl = document.getElementById('specimen-glyph');
    this.energyBar = document.getElementById('energy-bar');
    this.energyVal = document.getElementById('energy-val');
    this.ageVal = document.getElementById('age-val');
    this.speedVal = document.getElementById('speed-val');
    this.senseVal = document.getElementById('sense-val');
    this.fovVal = document.getElementById('fov-val');
    this.metabolismVal = document.getElementById('metabolism-val');
    this.offspringVal = document.getElementById('offspring-val');
    this.killsVal = document.getElementById('kills-val');

    this.trackingActive = true;
    this.deathTimer = 0;
    this.pulsePhase = 0;
    this.brainRipples = [];
    this.cachedNodes = [];

    // Synapse Labels
    this.inputLabels = ['Food Dist', 'Food Ang', 'Threat D', 'Threat A', 'Scent', 'Energy', 'Speed', '4D Warp'];
    this.outputLabels = ['Steer', 'Throttle', 'Dash', 'Secrete'];

    this.initListeners();
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = 290;
    this.canvas.height = 170;
  }

  initListeners() {
    document.getElementById('close-inspector-btn').addEventListener('click', () => {
      this.close();
    });

    document.getElementById('zap-specimen-btn').addEventListener('click', () => {
      if (this.ecosystem.selectedCreature && this.ecosystem.selectedCreature.alive) {
        this.ecosystem.selectedCreature.forceMutate();
        if (this.soundEngine) this.soundEngine.playCosmicRay();
      }
    });

    const evolveBtn = document.getElementById('evolve-specimen-btn');
    if (evolveBtn) {
      evolveBtn.addEventListener('click', () => {
        const c = this.ecosystem.selectedCreature;
        if (c && c.alive) {
          c.dna.maxSpeed = Math.min(6.5, c.dna.maxSpeed * 1.18);
          c.dna.senseRadius = Math.min(280, c.dna.senseRadius * 1.2);
          c.maxEnergy = Math.round(c.maxEnergy * 1.25);
          c.energy = c.maxEnergy;
          c.generation++;
          if (c.generation > this.ecosystem.maxGeneration) {
            this.ecosystem.maxGeneration = c.generation;
          }
          c.brain = c.brain.mutate(0.25, 0.25);
          this.brainRipples.push({ x: this.canvas.width / 2, y: this.canvas.height / 2, r: 4, maxR: 110, life: 1.0, color: '#00ff88' });
          if (this.soundEngine) this.soundEngine.playBirth();
        }
      });
    }

    document.getElementById('clone-specimen-btn').addEventListener('click', () => {
      const c = this.ecosystem.selectedCreature;
      if (c && c.alive) {
        const mutatedBrain = c.brain.mutate(0.05, 0.1);
        const cloneDNA = {
          ...c.dna,
          generation: c.generation + 1,
          brain: mutatedBrain
        };
        this.ecosystem.spawnCreature(c.species, c.x + 20, c.y + 20, cloneDNA);
        if (this.soundEngine) this.soundEngine.playBirth();
      }
    });

    const trackBtn = document.getElementById('track-camera-btn');
    trackBtn.addEventListener('click', () => {
      this.trackingActive = !this.trackingActive;
      trackBtn.classList.toggle('active-state', this.trackingActive);
      trackBtn.textContent = this.trackingActive ? '🎯 Lock Tracking' : '👁️ Free View';
    });

    // Interactive Neural Brain Surgery on Canvas Click
    this.canvas.style.cursor = 'pointer';
    this.canvas.title = 'Click any neuron to inject a live Synaptic Action Potential & perturb weights';
    this.canvas.addEventListener('click', (e) => {
      const c = this.ecosystem.selectedCreature;
      if (!c || !c.alive || !c.brain) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let clickedNode = null;
      let minDist = 18;
      for (const node of this.cachedNodes) {
        const d = Math.hypot(node.x - mx, node.y - my);
        if (d < minDist) {
          minDist = d;
          clickedNode = node;
        }
      }

      if (clickedNode) {
        if (clickedNode.layer === 'input') {
          for (let h = 0; h < c.brain.hiddenSize; h++) {
            c.brain.wIH[h][clickedNode.index] = Math.max(-2, Math.min(2, c.brain.wIH[h][clickedNode.index] * 1.3 + (Math.random() - 0.5) * 0.4));
          }
        } else if (clickedNode.layer === 'hidden') {
          c.brain.bH[clickedNode.index] += (Math.random() - 0.5) * 0.6;
          for (let o = 0; o < c.brain.outputSize; o++) {
            c.brain.wHO[o][clickedNode.index] = Math.max(-2, Math.min(2, c.brain.wHO[o][clickedNode.index] * 1.35 + (Math.random() - 0.5) * 0.4));
          }
        } else if (clickedNode.layer === 'output') {
          c.brain.bO[clickedNode.index] += 0.45;
          if (clickedNode.index === 2) {
            // Instant Dash Surge
            c.vx *= 1.8;
            c.vy *= 1.8;
          }
        }
        c.energy = Math.min(c.maxEnergy, c.energy + 15);
        this.brainRipples.push({ x: clickedNode.x, y: clickedNode.y, r: 3, maxR: 42, life: 1.0, color: clickedNode.color });
        if (this.soundEngine) this.soundEngine.playEat(false);
      } else {
        // Global gentle synapse perturbation
        c.brain = c.brain.mutate(0.2, 0.25);
        this.brainRipples.push({ x: mx, y: my, r: 3, maxR: 55, life: 1.0, color: '#00f0ff' });
        if (this.soundEngine) this.soundEngine.playEat(false);
      }
    });
  }

  open(creature) {
    this.ecosystem.selectedCreature = creature;
    this.deathTimer = 0;
    this.panel.classList.add('open');
    this.updateStats();
  }

  close() {
    this.ecosystem.selectedCreature = null;
    this.deathTimer = 0;
    this.panel.classList.remove('open');
  }

  update() {
    const c = this.ecosystem.selectedCreature;
    if (!c) {
      return;
    }

    if (!c.alive) {
      this.deathTimer++;
      this.nameEl.textContent = `SPECIMEN #${c.id} [DECEASED]`;
      this.energyBar.style.width = '0%';
      this.energyVal.textContent = '0 / 0 (Decayed)';
      
      // Auto-close after ~180 ticks (3 seconds)
      if (this.deathTimer > 180) {
        this.close();
      }
      return;
    }

    this.pulsePhase += 0.08;
    this.updateStats();
    this.renderBrain();
  }

  updateStats() {
    const c = this.ecosystem.selectedCreature;
    if (!c) return;

    const isCarn = c.species === 'carnivore';
    const isScav = c.species === 'scavenger';
    this.glyphEl.textContent = isCarn ? '🦞' : (isScav ? '🦂' : '🧬');
    this.nameEl.textContent = `SPECIMEN #${c.id}`;
    const fitness = this.ecosystem.getCreatureFitness ? this.ecosystem.getCreatureFitness(c) : 0;
    this.taxonomyEl.textContent = `${c.species.toUpperCase()} // G${c.generation} • FIT ${fitness}${c.mutationCount > 1 ? ` (MUT-x${c.mutationCount})` : ''}`;

    const energyPct = Math.max(0, Math.min(100, (c.energy / c.maxEnergy) * 100));
    this.energyBar.style.width = `${energyPct}%`;
    this.energyVal.textContent = `${Math.round(c.energy)} / ${Math.round(c.maxEnergy)}`;

    this.ageVal.textContent = `Tick ${Math.round(c.age)} (Gen ${c.generation})`;
    this.speedVal.textContent = `${c.dna.maxSpeed.toFixed(1)} px/t`;
    this.senseVal.textContent = `${Math.round(c.dna.senseRadius)} px`;
    this.fovVal.textContent = `${Math.round((c.dna.fov * 180) / Math.PI)}°`;
    this.metabolismVal.textContent = `${c.dna.metabolism.toFixed(3)} e/t`;
    this.offspringVal.textContent = `${c.offspringCount}`;
    this.killsVal.textContent = `${c.killCount}`;
  }

  renderBrain() {
    const c = this.ecosystem.selectedCreature;
    if (!c || !c.brain) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const brain = c.brain;
    const inputs = brain.lastInputs || [];
    const hidden = brain.lastHidden || [];
    const outputs = brain.lastOutputs || [];

    // Node layout positions
    const inputX = 48;
    const hiddenX = w / 2;
    const outputX = w - 48;

    const inPositions = [];
    const inCount = brain.inputSize;
    const inStep = h / (inCount + 1);
    for (let i = 0; i < inCount; i++) {
      inPositions.push({ x: inputX, y: (i + 1) * inStep });
    }

    const hidPositions = [];
    const hidCount = brain.hiddenSize;
    const hidStep = h / (hidCount + 1);
    for (let i = 0; i < hidCount; i++) {
      hidPositions.push({ x: hiddenX, y: (i + 1) * hidStep });
    }

    const outPositions = [];
    const outCount = brain.outputSize;
    const outStep = h / (outCount + 1);
    for (let i = 0; i < outCount; i++) {
      outPositions.push({ x: outputX, y: (i + 1) * outStep });
    }

    // 1. Draw Synapses: Input to Hidden
    for (let hIdx = 0; hIdx < hidCount; hIdx++) {
      for (let iIdx = 0; iIdx < inCount; iIdx++) {
        const weight = brain.wIH[hIdx][iIdx];
        const pIn = inPositions[iIdx];
        const pHid = hidPositions[hIdx];

        ctx.lineWidth = Math.min(2.5, Math.max(0.5, Math.abs(weight) * 1.5));
        ctx.strokeStyle = weight > 0 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 0, 119, 0.22)';
        ctx.beginPath();
        ctx.moveTo(pIn.x, pIn.y);
        ctx.lineTo(pHid.x, pHid.y);
        ctx.stroke();

        // Synaptic Signal Pulse particle
        const inputSignal = Math.abs(inputs[iIdx] || 0);
        if (inputSignal > 0.25) {
          const t = (this.pulsePhase + iIdx * 0.3) % 1.0;
          const px = pIn.x + (pHid.x - pIn.x) * t;
          const py = pIn.y + (pHid.y - pIn.y) * t;
          ctx.fillStyle = weight > 0 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 119, 0.7)';
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Synapses: Hidden to Output
    for (let oIdx = 0; oIdx < outCount; oIdx++) {
      for (let hIdx = 0; hIdx < hidCount; hIdx++) {
        const weight = brain.wHO[oIdx][hIdx];
        const pHid = hidPositions[hIdx];
        const pOut = outPositions[oIdx];

        ctx.lineWidth = Math.min(2.5, Math.max(0.5, Math.abs(weight) * 1.5));
        ctx.strokeStyle = weight > 0 ? 'rgba(0, 240, 255, 0.28)' : 'rgba(255, 0, 119, 0.28)';
        ctx.beginPath();
        ctx.moveTo(pHid.x, pHid.y);
        ctx.lineTo(pOut.x, pOut.y);
        ctx.stroke();

        const hidSignal = Math.abs(hidden[hIdx] || 0);
        if (hidSignal > 0.25) {
          const t = (this.pulsePhase + hIdx * 0.4) % 1.0;
          const px = pHid.x + (pOut.x - pHid.x) * t;
          const py = pHid.y + (pOut.y - pHid.y) * t;
          ctx.fillStyle = weight > 0 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 119, 0.7)';
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Draw Nodes with Glowing Activation Rings & Cache Positions for Click Surgery
    this.cachedNodes = [];
    const drawNodes = (positions, activations, baseColor, layerName) => {
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        const act = Math.abs(activations[i] || 0);
        this.cachedNodes.push({ x: p.x, y: p.y, layer: layerName, index: i, color: baseColor });

        ctx.save();
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = act * 8 + 2;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5 + act * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    drawNodes(inPositions, inputs, '#ffcc00', 'input'); // Amber inputs
    drawNodes(hidPositions, hidden, '#00f0ff', 'hidden'); // Cyan hidden
    drawNodes(outPositions, outputs, '#ff0077', 'output'); // Magenta outputs

    // Render Interactive Brain Surgery Ripples
    for (let r = this.brainRipples.length - 1; r >= 0; r--) {
      const rip = this.brainRipples[r];
      rip.r += 2.2;
      rip.life = Math.max(0, 1 - rip.r / rip.maxR);
      ctx.save();
      ctx.strokeStyle = rip.color;
      ctx.globalAlpha = rip.life;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (rip.life <= 0) this.brainRipples.splice(r, 1);
    }

    // 4. Render Clean Micro-Labels
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 204, 0, 0.75)';
    for (let i = 0; i < inCount; i++) {
      ctx.fillText(this.inputLabels[i] || `In${i}`, inPositions[i].x - 6, inPositions[i].y + 3);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 0, 119, 0.85)';
    for (let i = 0; i < outCount; i++) {
      ctx.fillText(this.outputLabels[i] || `Out${i}`, outPositions[i].x + 6, outPositions[i].y + 3);
    }
  }
}

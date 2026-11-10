// Cybernetic HUD Controller & God-Tool Interactivity

export class HUD {
  constructor(ecosystem, soundEngine, tesseract, inspector, analytics) {
    this.ecosystem = ecosystem;
    this.soundEngine = soundEngine;
    this.tesseract = tesseract;
    this.inspector = inspector;
    this.analytics = analytics;

    this.activeTool = 'inspect';

    // Telemetry Elements
    this.fpsVal = document.getElementById('fps-val');
    this.genVal = document.getElementById('gen-val');
    this.popVal = document.getElementById('pop-val');
    this.herbVal = document.getElementById('herb-val');
    this.carnVal = document.getElementById('carn-val');
    this.scavVal = document.getElementById('scav-val');
    this.sporeVal = document.getElementById('spore-val');
    this.bornVal = document.getElementById('born-val');
    this.diedVal = document.getElementById('died-val');
    this.hallGrid = document.getElementById('hall-of-fame-grid');
    this.lastHallUpdate = 0;

    this.toastEl = document.getElementById('toast');
    this.toastTimeout = null;
    this.extinctionAlertGiven = false;

    this.initToolbox();
    this.initTimeControls();
    this.initDockTabs();
    this.initTesseractControls();
    this.initAudioControls();
    this.initBioArchitect();
    this.initArchives();
    this.initShortcutsModal();
    this.initHeaderControls();
  }

  showToast(msg) {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2800);
  }

  setTool(mode) {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      if (btn.dataset.mode === mode) {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = mode;
        const label = btn.querySelector('.btn-label')?.textContent || mode;
        this.showToast(`Active Tool: ${label}`);
      }
    });
  }

  initHeaderControls() {
    const camBtn = document.getElementById('cam-center-btn');
    if (camBtn) {
      camBtn.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      });
    }

    const cineBtn = document.getElementById('cinematic-btn');
    if (cineBtn) {
      cineBtn.addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      });
    }

    const apexBtn = document.getElementById('apex-track-btn');
    if (apexBtn) {
      apexBtn.addEventListener('click', () => {
        this.lockApexSpecimen();
      });
    }
  }

  lockApexSpecimen() {
    const leaders = this.ecosystem.getHallOfFame ? this.ecosystem.getHallOfFame(1) : [];
    if (leaders.length > 0) {
      const champ = leaders[0].creature;
      this.inspector.trackingActive = true;
      const trackBtn = document.getElementById('track-camera-btn');
      if (trackBtn) {
        trackBtn.classList.add('active-state');
        trackBtn.textContent = '🎯 Lock Tracking';
      }
      this.inspector.open(champ);
      this.showToast(`👑 Locked onto Apex Champion #${champ.id} (Fitness: ${leaders[0].fitness})`);
    } else {
      this.showToast('No living organisms to lock onto');
    }
  }

  initToolbox() {
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.dataset.mode;
        this.showToast(`Active Tool: ${btn.querySelector('.btn-label').textContent}`);
      });
    });

    const presetSelect = document.getElementById('preset-select');
    presetSelect.addEventListener('change', (e) => {
      this.ecosystem.loadPreset(e.target.value);
      this.extinctionAlertGiven = false;
      this.showToast(`Cosmic Realm Shifted: ${e.target.selectedOptions[0].text}`);
    });
  }

  initTimeControls() {
    const slider = document.getElementById('time-slider');
    const label = document.getElementById('time-rate-label');
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.ecosystem.timeDilation = val;
      label.textContent = `${val.toFixed(1)}x`;
    });

    const pauseBtn = document.getElementById('time-pause-btn');
    pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });

    const stepBtn = document.getElementById('time-step-btn');
    stepBtn.addEventListener('click', () => {
      this.ecosystem.paused = false;
      this.ecosystem.update();
      this.ecosystem.paused = true;
      pauseBtn.textContent = '▶️ Resume';
    });

    const resetBtn = document.getElementById('respawn-btn');
    resetBtn.addEventListener('click', () => {
      const currentPreset = document.getElementById('preset-select').value;
      this.ecosystem.loadPreset(currentPreset);
      this.extinctionAlertGiven = false;
      this.showToast('Universe Genesis Rebooted');
    });
  }

  togglePause() {
    const pauseBtn = document.getElementById('time-pause-btn');
    this.ecosystem.paused = !this.ecosystem.paused;
    pauseBtn.textContent = this.ecosystem.paused ? '▶️ Resume' : '⏸️ Pause';
    this.showToast(this.ecosystem.paused ? 'Temporal Flow Frozen' : 'Temporal Flow Resumed');
  }

  initDockTabs() {
    const tabs = document.querySelectorAll('.dock-tab');
    const panes = document.querySelectorAll('.dock-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');

        if (tab.dataset.tab === 'archives') {
          this.refreshServerUniverses();
        } else if (tab.dataset.tab === 'hall') {
          this.renderHallOfFame();
        }
      });
    });
  }

  renderHallOfFame() {
    if (!this.hallGrid || !this.ecosystem.getHallOfFame) return;
    const leaders = this.ecosystem.getHallOfFame(5);
    if (leaders.length === 0) {
      this.hallGrid.innerHTML = '<span class="empty-hint">No living organisms in biosphere.</span>';
      return;
    }

    this.hallGrid.innerHTML = '';
    leaders.forEach((entry, idx) => {
      const c = entry.creature;
      const isCarn = c.species === 'carnivore';
      const isScav = c.species === 'scavenger';
      const icon = isCarn ? '🦞' : (isScav ? '🦂' : '🧬');
      const rankBadge = idx === 0 ? '👑 #1 APEX' : `#${idx + 1}`;
      const color = `hsl(${c.dna.hue}, 100%, 65%)`;

      const card = document.createElement('div');
      card.className = `hall-card ${this.ecosystem.selectedCreature === c ? 'selected' : ''}`;
      card.style.borderColor = idx === 0 ? 'var(--amber-neon)' : 'rgba(0, 240, 255, 0.22)';
      card.innerHTML = `
        <div class="hall-card-top">
          <span class="hall-rank" style="color:${idx === 0 ? 'var(--amber-neon)' : 'var(--cyan-neon)'}">${rankBadge}</span>
          <span class="hall-fit">FIT ${entry.fitness}</span>
        </div>
        <div class="hall-main">
          <span class="hall-icon">${icon}</span>
          <div>
            <div class="hall-id" style="color:${color}">Specimen #${c.id}</div>
            <div class="hall-meta">G${c.generation} • Offspring: ${c.offspringCount} • Kills: ${c.killCount}</div>
          </div>
        </div>
        <div class="hall-actions">
          <button class="hall-btn track-btn">🎯 Track</button>
          <button class="hall-btn clone-btn">🧬 Clone</button>
        </div>
      `;

      card.querySelector('.track-btn').addEventListener('click', () => {
        this.inspector.open(c);
        this.showToast(`Tracking Hall of Fame Specimen #${c.id}`);
      });

      card.querySelector('.clone-btn').addEventListener('click', () => {
        if (c.alive) {
          const cloneDNA = {
            ...c.dna,
            generation: c.generation + 1,
            brain: c.brain.mutate(0.05, 0.1)
          };
          const baby = this.ecosystem.spawnCreature(c.species, c.x + 18, c.y + 18, cloneDNA);
          if (baby) {
            this.showToast(`Cloned Apex Specimen #${c.id} -> #${baby.id}`);
            if (this.soundEngine) this.soundEngine.playBirth();
          }
        }
      });

      this.hallGrid.appendChild(card);
    });
  }

  initTesseractControls() {
    const geomSelect = document.getElementById('manifold-geom-select');
    if (geomSelect) {
      geomSelect.addEventListener('change', (e) => {
        this.tesseract.loadGeometry(e.target.value);
        this.showToast(`4D Geometry: ${this.tesseract.geometryName}`);
      });
    }

    const rotXW = document.getElementById('rot-xw');
    const rotYW = document.getElementById('rot-yw');
    const rotZW = document.getElementById('rot-zw');
    const warp = document.getElementById('warp-force');

    rotXW.addEventListener('input', (e) => {
      this.tesseract.rotSpeeds.xw = parseFloat(e.target.value);
      document.getElementById('rot-xw-val').textContent = e.target.value;
    });

    rotYW.addEventListener('input', (e) => {
      this.tesseract.rotSpeeds.yw = parseFloat(e.target.value);
      document.getElementById('rot-yw-val').textContent = e.target.value;
    });

    rotZW.addEventListener('input', (e) => {
      this.tesseract.rotSpeeds.zw = parseFloat(e.target.value);
      document.getElementById('rot-zw-val').textContent = e.target.value;
    });

    warp.addEventListener('input', (e) => {
      this.tesseract.warpForce = parseFloat(e.target.value);
      document.getElementById('warp-val').textContent = `${e.target.value}x`;
    });

    document.getElementById('manifold-mesh-toggle').addEventListener('change', (e) => {
      this.tesseract.renderWireframe = e.target.checked;
    });

    document.getElementById('manifold-grav-toggle').addEventListener('change', (e) => {
      this.tesseract.gravityBend = e.target.checked;
    });
  }

  initBioArchitect() {
    const sizeSlider = document.getElementById('arch-size');
    const speedSlider = document.getElementById('arch-speed');
    const senseSlider = document.getElementById('arch-sense');
    const hueSlider = document.getElementById('arch-hue');
    const previewSwatch = document.getElementById('arch-color-preview');
    const injectBtn = document.getElementById('inject-specimen-btn');

    const updatePreview = () => {
      const hue = hueSlider.value;
      if (previewSwatch) {
        previewSwatch.style.background = `hsl(${hue}, 100%, 60%)`;
        previewSwatch.style.boxShadow = `0 0 15px hsl(${hue}, 100%, 60%)`;
      }
      document.getElementById('arch-size-val').textContent = sizeSlider.value;
      document.getElementById('arch-speed-val').textContent = speedSlider.value;
      document.getElementById('arch-sense-val').textContent = `${senseSlider.value} px`;
      document.getElementById('arch-hue-val').textContent = `${hue}°`;
    };

    [sizeSlider, speedSlider, senseSlider, hueSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', updatePreview);
    });
    updatePreview();

    if (injectBtn) {
      injectBtn.addEventListener('click', () => {
        const kingdom = document.getElementById('arch-kingdom').value;
        const size = parseFloat(sizeSlider.value);
        const maxSpeed = parseFloat(speedSlider.value);
        const senseRadius = parseFloat(senseSlider.value);
        const hue = parseFloat(hueSlider.value);

        const customDNA = {
          species: kingdom,
          generation: 1,
          size: size,
          maxSpeed: maxSpeed,
          turnRate: 0.19,
          senseRadius: senseRadius,
          fov: (kingdom === 'carnivore' ? 120 : 155) * (Math.PI / 180),
          metabolism: kingdom === 'carnivore' ? 0.09 : 0.06,
          reproduceThreshold: 140,
          initialEnergy: 95,
          maxEnergy: 180,
          maxLifespan: 2000,
          mutationRate: 0.08,
          mutationCount: 0,
          hue: hue
        };

        const cx = this.ecosystem.width / 2 + (Math.random() - 0.5) * 100;
        const cy = this.ecosystem.height / 2 + (Math.random() - 0.5) * 100;
        const org = this.ecosystem.spawnCreature(kingdom, cx, cy, customDNA);

        if (org) {
          this.inspector.open(org);
          this.showToast(`Custom Synthetic Organism #${org.id} injected!`);
          if (this.soundEngine) this.soundEngine.playBirth();
        }
      });
    }
  }

  initAudioControls() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioBtnText = document.getElementById('audio-btn-text');

    const updateAudioUI = () => {
      const isEnabled = this.soundEngine.enabled;
      audioBtnText.textContent = isEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
      audioBtn.style.borderColor = isEnabled ? 'var(--cyan-neon)' : 'var(--text-dim)';
      audioBtn.style.color = isEnabled ? 'var(--cyan-neon)' : 'var(--text-dim)';
    };

    audioBtn.addEventListener('click', () => {
      this.soundEngine.ensureContext();
      const state = this.soundEngine.toggleAudio();
      updateAudioUI();
      this.showToast(state ? 'Synesthetic Audio Activated' : 'Audio Silenced');
    });

    const vizModeBtn = document.getElementById('viz-mode-btn');
    if (vizModeBtn) {
      vizModeBtn.addEventListener('click', () => {
        this.soundEngine.vizMode = this.soundEngine.vizMode === 'waveform' ? 'frequency' : 'waveform';
        vizModeBtn.textContent = `MODE: ${this.soundEngine.vizMode === 'waveform' ? 'WAVE' : 'SPECTRUM'}`;
        this.showToast(`Visualizer: ${this.soundEngine.vizMode.toUpperCase()}`);
      });
    }

    document.getElementById('audio-master-gain').addEventListener('input', (e) => {
      this.soundEngine.setMasterGain(parseFloat(e.target.value));
    });

    document.getElementById('audio-scale-select').addEventListener('change', (e) => {
      this.soundEngine.setScale(e.target.value);
      this.showToast(`Harmonic Resonance: ${e.target.selectedOptions[0].text}`);
    });

    document.getElementById('audio-drone-toggle').addEventListener('change', (e) => {
      this.soundEngine.isDroneActive = e.target.checked;
      if (this.soundEngine.droneFilter && this.soundEngine.masterGain) {
        try {
          if (!e.target.checked) this.soundEngine.droneFilter.disconnect();
          else this.soundEngine.droneFilter.connect(this.soundEngine.masterGain);
        } catch (err) {}
      }
    });

    document.getElementById('audio-events-toggle').addEventListener('change', (e) => {
      this.soundEngine.isEventsActive = e.target.checked;
    });

    document.getElementById('audio-theremin-toggle').addEventListener('change', (e) => {
      this.soundEngine.isThereminActive = e.target.checked;
    });
  }

  initArchives() {
    document.getElementById('save-universe-btn').addEventListener('click', async () => {
      const nameInput = document.getElementById('universe-name-input');
      const name = nameInput.value.trim() || `Universe_${Date.now()}`;
      const state = this.ecosystem.exportState(name);

      try {
        const res = await fetch('/api/universes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, data: state })
        });
        const result = await res.json();
        if (result.success) {
          this.showToast(`Universe '${name}' immortalized in vault!`);
          this.refreshServerUniverses();
        }
      } catch (err) {
        this.showToast(`Save error: ${err.message}`);
      }
    });

    document.getElementById('export-json-btn').addEventListener('click', () => {
      const state = this.ecosystem.exportState('Exported_Cosmos');
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synapse_cosmos_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Universe exported as local JSON');
    });

    document.getElementById('import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          this.ecosystem.importState(parsed);
          this.extinctionAlertGiven = false;
          this.showToast(`Universe '${parsed.name || 'Imported'}' restored!`);
        } catch (err) {
          this.showToast('Invalid Universe JSON file');
        }
      };
      reader.readAsText(file);
    });
  }

  async refreshServerUniverses() {
    const listEl = document.getElementById('saved-universes-list');
    try {
      const res = await fetch('/api/universes');
      const items = await res.json();
      if (!items || items.length === 0) {
        listEl.innerHTML = '<span class="empty-hint">No saved timelines found on server. Save one above!</span>';
        return;
      }

      listEl.innerHTML = '';
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'saved-item';
        row.innerHTML = `
          <div>
            <b>${item.title || item.id}</b> 
            <span style="color:var(--text-dim); margin-left:6px;">(${item.creaturesCount} orgs, Gen ${item.generation})</span>
          </div>
          <div style="display:flex; gap:5px;">
            <button class="load-item-btn" data-id="${item.id}">Load</button>
            <button class="delete-item-btn" data-id="${item.id}" title="Delete Archive">✕</button>
          </div>
        `;
        row.querySelector('.load-item-btn').addEventListener('click', async () => {
          const uRes = await fetch(`/api/universes/${item.id}`);
          const uData = await uRes.json();
          this.ecosystem.importState(uData);
          this.extinctionAlertGiven = false;
          this.showToast(`Loaded timeline: ${item.title || item.id}`);
        });
        row.querySelector('.delete-item-btn').addEventListener('click', async () => {
          await fetch(`/api/universes/${item.id}`, { method: 'DELETE' });
          this.showToast(`Deleted archive: ${item.title || item.id}`);
          this.refreshServerUniverses();
        });
        listEl.appendChild(row);
      });
    } catch (err) {
      listEl.innerHTML = `<span class="empty-hint">Failed to load server archives: ${err.message}</span>`;
    }
  }

  initShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    const openBtn = document.getElementById('help-modal-btn');
    const closeBtn = document.getElementById('close-shortcuts-btn');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => { modal.classList.add('open'); });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => { modal.classList.remove('open'); });
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }
  }

  update(fps) {
    if (this.fpsVal) this.fpsVal.textContent = Math.round(fps);
    if (this.genVal) this.genVal.textContent = this.ecosystem.maxGeneration;
    if (this.popVal) this.popVal.textContent = this.ecosystem.creatures.length;

    let herbs = 0;
    let carns = 0;
    let scavs = 0;
    for (let i = 0; i < this.ecosystem.creatures.length; i++) {
      const sp = this.ecosystem.creatures[i].species;
      if (sp === 'herbivore') herbs++;
      else if (sp === 'carnivore') carns++;
      else if (sp === 'scavenger') scavs++;
    }

    if (this.herbVal) this.herbVal.textContent = herbs;
    if (this.carnVal) this.carnVal.textContent = carns;
    if (this.scavVal) this.scavVal.textContent = scavs;
    if (this.sporeVal) this.sporeVal.textContent = this.ecosystem.spores.length;
    if (this.bornVal) this.bornVal.textContent = this.ecosystem.totalBorn;
    if (this.diedVal) this.diedVal.textContent = this.ecosystem.totalDied;

    const now = performance.now();
    if (now - this.lastHallUpdate > 600) {
      this.lastHallUpdate = now;
      const hallPane = document.getElementById('pane-hall');
      if (hallPane && hallPane.classList.contains('active')) {
        this.renderHallOfFame();
      }
    }

    if (herbs === 0 && carns === 0 && !this.extinctionAlertGiven) {
      this.showToast('⚠️ EXTINCTION CRISIS: Biosphere collapsed! Auto-spawning seeds...');
      this.extinctionAlertGiven = true;
    }
  }
}

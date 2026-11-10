// Biosphere Telemetry Analytics Chart Renderer

export class BiosphereAnalytics {
  constructor(ecosystem) {
    this.ecosystem = ecosystem;
    this.canvas = document.getElementById('analytics-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.maxGenEl = document.getElementById('stat-max-gen');
    this.riskEl = document.getElementById('stat-extinction-risk');
    this.diversityEl = document.getElementById('stat-diversity');
    this.gravWellsEl = document.getElementById('stat-grav-wells');

    this.lastRenderTime = 0;
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0) {
        this.canvas.width = Math.floor(rect.width);
        this.canvas.height = Math.floor(rect.height) || 90;
      }
    }
  }

  update() {
    const now = performance.now();
    if (now - this.lastRenderTime < 100) return; // 10 fps throttle
    this.lastRenderTime = now;

    this.resizeCanvas();
    this.updateStatsText();
    this.renderChart();
  }

  updateStatsText() {
    this.maxGenEl.textContent = this.ecosystem.maxGeneration;
    this.gravWellsEl.textContent = this.ecosystem.gravWells.length + (this.ecosystem.pulsars?.length || 0) + (this.ecosystem.rifts?.length || 0);

    let herbCount = 0;
    let carnCount = 0;
    let scavCount = 0;
    for (let i = 0; i < this.ecosystem.creatures.length; i++) {
      const sp = this.ecosystem.creatures[i].species;
      if (sp === 'herbivore') herbCount++;
      else if (sp === 'carnivore') carnCount++;
      else if (sp === 'scavenger') scavCount++;
    }

    // Determine Trend
    let trend = '↔ Stable';
    if (this.ecosystem.history.length >= 6) {
      const recent = this.ecosystem.history[this.ecosystem.history.length - 1];
      const older = this.ecosystem.history[this.ecosystem.history.length - 6];
      const diff = (recent.herbivores + recent.carnivores + (recent.scavengers || 0)) - (older.herbivores + older.carnivores + (older.scavengers || 0));
      if (diff > 4) trend = '↗ Growing';
      else if (diff < -4) trend = '↘ Declining';
    }

    if (herbCount < 5 || (carnCount > 0 && herbCount / carnCount < 1.3)) {
      this.riskEl.textContent = `CRITICAL (${trend})`;
      this.riskEl.className = 'risk-high';
    } else if (herbCount < 15) {
      this.riskEl.textContent = `MODERATE (${trend})`;
      this.riskEl.className = 'risk-mid';
    } else {
      this.riskEl.textContent = `STABLE (${trend})`;
      this.riskEl.className = 'risk-low';
    }

    const diversity = this.ecosystem.calculateDiversityIndex();
    this.diversityEl.textContent = `${diversity.toFixed(2)} (${this.ecosystem.totalBorn} born / ${this.ecosystem.totalDied} died)`;
  }

  renderChart() {
    const ctx = this.ctx;
    const history = this.ecosystem.history;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (history.length < 2) return;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 15; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Determine scale maxima
    let maxPop = 40;
    let maxBiomass = 2000;
    for (let i = 0; i < history.length; i++) {
      const pt = history[i];
      if (pt.herbivores > maxPop) maxPop = pt.herbivores;
      if (pt.carnivores > maxPop) maxPop = pt.carnivores;
      if ((pt.scavengers || 0) > maxPop) maxPop = pt.scavengers;
      if (pt.biomass > maxBiomass) maxBiomass = pt.biomass;
    }

    const stepX = w / Math.max(1, history.length - 1);

    // Plot series helper
    const drawSeries = (getter, maxVal, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;

      for (let i = 0; i < history.length; i++) {
        const x = i * stepX;
        const val = getter(history[i]);
        const y = h - 6 - (val / maxVal) * (h - 14);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Herbivores: Cyan / Emerald
    drawSeries(pt => pt.herbivores, maxPop * 1.15, '#00ffcc');
    // Carnivores: Ruby / Magenta
    drawSeries(pt => pt.carnivores, maxPop * 1.15, '#ff3366');
    // Scavengers: Golden Amber
    drawSeries(pt => pt.scavengers || 0, maxPop * 1.15, '#ffaa00');
    // Biomass: Violet
    drawSeries(pt => pt.biomass, maxBiomass * 1.15, '#b026ff');
  }
}

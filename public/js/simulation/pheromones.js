// Physarum Polycephalum Slime Mold Pheromone Field
// Simulates scent trail deposition, optimized cross diffusion, and exponential evaporation.

export class PheromoneField {
  constructor(width, height, scale = 4) {
    this.scale = scale;
    this.width = Math.max(10, Math.floor(width / scale));
    this.height = Math.max(10, Math.floor(height / scale));

    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.width;
    this.bufferCanvas.height = this.height;
    this.bufferCtx = this.bufferCanvas.getContext('2d', { willReadFrequently: true });

    this.imageData = this.bufferCtx.createImageData(this.width, this.height);
    this.data = this.imageData.data; // RGBA Uint8ClampedArray
    this.tempData = new Uint8ClampedArray(this.data.length);

    this.evaporationRate = 0.985;
    this.diffusionRate = 0.42;
  }

  resize(newWidth, newHeight) {
    this.width = Math.max(10, Math.floor(newWidth / this.scale));
    this.height = Math.max(10, Math.floor(newHeight / this.scale));
    this.bufferCanvas.width = this.width;
    this.bufferCanvas.height = this.height;
    this.imageData = this.bufferCtx.createImageData(this.width, this.height);
    this.data = this.imageData.data;
    this.tempData = new Uint8ClampedArray(this.data.length);
  }

  clear() {
    this.data.fill(0);
    this.tempData.fill(0);
    this.bufferCtx.clearRect(0, 0, this.width, this.height);
  }

  // Deposit pheromone scent into the field
  // type: 'herbivore' (greenish cyan), 'carnivore' (reddish pink), 'scavenger' (amber/gold), 'slime' (amber/gold)
  deposit(screenX, screenY, amount = 120, type = 'slime') {
    const gx = Math.floor(screenX / this.scale);
    const gy = Math.floor(screenY / this.scale);

    if (gx < 1 || gx >= this.width - 1 || gy < 1 || gy >= this.height - 1) return;

    const idx = (gy * this.width + gx) * 4;

    if (type === 'herbivore') {
      this.data[idx] = Math.min(255, this.data[idx] + amount * 0.2); // R
      this.data[idx + 1] = Math.min(255, this.data[idx + 1] + amount); // G
      this.data[idx + 2] = Math.min(255, this.data[idx + 2] + amount * 0.8); // B
      this.data[idx + 3] = 255; // Alpha
    } else if (type === 'carnivore') {
      this.data[idx] = Math.min(255, this.data[idx] + amount); // R
      this.data[idx + 1] = Math.min(255, this.data[idx + 1] + amount * 0.1); // G
      this.data[idx + 2] = Math.min(255, this.data[idx + 2] + amount * 0.4); // B
      this.data[idx + 3] = 255;
    } else {
      // Slime mold amber/gold
      this.data[idx] = Math.min(255, this.data[idx] + amount);
      this.data[idx + 1] = Math.min(255, this.data[idx + 1] + amount * 0.75);
      this.data[idx + 2] = Math.min(255, this.data[idx + 2] + amount * 0.18);
      this.data[idx + 3] = 255;
    }
  }

  // Sample scent intensity at screen coords [0..1]
  sample(screenX, screenY) {
    const gx = Math.floor(screenX / this.scale);
    const gy = Math.floor(screenY / this.scale);

    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return 0;

    const idx = (gy * this.width + gx) * 4;
    return (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / (255 * 3);
  }

  // Optimized cross-diffusion kernel (Up + Down + Left + Right + Center) + Evaporation
  step() {
    const w = this.width;
    const h = this.height;
    const data = this.data;
    const temp = this.tempData;
    const evap = this.evaporationRate;
    const diff = this.diffusionRate;
    const invDiff = 1 - diff;

    temp.set(data);

    for (let y = 1; y < h - 1; y++) {
      const rowOffset = y * w;
      const upOffset = (y - 1) * w;
      const downOffset = (y + 1) * w;

      for (let x = 1; x < w - 1; x++) {
        const centerIdx = (rowOffset + x) * 4;
        const upIdx = (upOffset + x) * 4;
        const downIdx = (downOffset + x) * 4;
        const leftIdx = (rowOffset + x - 1) * 4;
        const rightIdx = (rowOffset + x + 1) * 4;

        // Process 3 color channels with fast 5-point Laplacian cross
        for (let c = 0; c < 3; c++) {
          const avgNeighbor = (temp[upIdx + c] + temp[downIdx + c] + temp[leftIdx + c] + temp[rightIdx + c]) * 0.25;
          const orig = temp[centerIdx + c];
          data[centerIdx + c] = (orig * invDiff + avgNeighbor * diff) * evap;
        }

        // Alpha channel set to maximum component
        data[centerIdx + 3] = Math.max(data[centerIdx], Math.max(data[centerIdx + 1], data[centerIdx + 2]));
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);
  }

  // Render the diffused glowing trail map onto the target canvas
  renderTo(targetCtx, screenWidth, screenHeight, camera = { x: 0, y: 0, zoom: 1.0 }) {
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = 'medium';
    targetCtx.globalAlpha = 0.88;

    // Apply Camera Transform
    targetCtx.translate(screenWidth / 2, screenHeight / 2);
    targetCtx.scale(camera.zoom, camera.zoom);
    targetCtx.translate(-screenWidth / 2 + camera.x, -screenHeight / 2 + camera.y);

    targetCtx.drawImage(this.bufferCanvas, 0, 0, screenWidth, screenHeight);
    targetCtx.restore();
  }
}

import { HyperMatrix4D, Polytope4DFactory } from './hypermath.js';

export class Tesseract4D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.currentGeometryType = 'tesseract';
    this.baseVertices = [];
    this.edges = [];
    this.geometryName = '';
    this.loadGeometry('tesseract');

    // Current 4D rotation angles
    this.angles = {
      xy: 0,
      xz: 0,
      xw: 0,
      yz: 0,
      yw: 0,
      zw: 0
    };

    // Rotation angular velocities
    this.rotSpeeds = {
      xy: 0.003,
      xz: 0.005,
      xw: 0.012,
      yz: 0.002,
      yw: 0.008,
      zw: 0.015
    };

    this.focalDistance4D = 2.6;
    this.viewDistance3D = 3.2;
    this.scale = 220;
    this.warpForce = 1.0;
    this.renderWireframe = true;
    this.gravityBend = true;

    // Projected 2D screen positions for this frame
    this.projected2D = [];
    this.center2D = { x: 0, y: 0 };
  }

  loadGeometry(type) {
    this.currentGeometryType = type;
    let data;
    switch (type) {
      case 'clifford_torus':
        data = Polytope4DFactory.createCliffordTorus(14, 14);
        break;
      case 'cell24':
        data = Polytope4DFactory.create24Cell();
        break;
      case 'simplex5':
        data = Polytope4DFactory.create5Cell();
        break;
      case 'cell16':
        data = Polytope4DFactory.create16Cell();
        break;
      case 'klein_bottle':
        data = Polytope4DFactory.createKleinBottle(14, 10);
        break;
      case 'tesseract':
      default:
        data = Polytope4DFactory.createTesseract();
        break;
    }
    this.baseVertices = data.vertices;
    this.edges = data.edges;
    this.geometryName = data.name;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.center2D = { x: width / 2, y: height / 2 };
  }

  update(dt = 1) {
    this.angles.xy += this.rotSpeeds.xy * dt;
    this.angles.xz += this.rotSpeeds.xz * dt;
    this.angles.xw += this.rotSpeeds.xw * dt;
    this.angles.yz += this.rotSpeeds.yz * dt;
    this.angles.yw += this.rotSpeeds.yw * dt;
    this.angles.zw += this.rotSpeeds.zw * dt;

    // Project vertices
    this.projected2D = [];
    for (let i = 0; i < this.baseVertices.length; i++) {
      const v4 = HyperMatrix4D.rotate4D(this.baseVertices[i], this.angles);
      const p3 = HyperMatrix4D.project4Dto3D(v4, this.focalDistance4D);
      const p2 = HyperMatrix4D.project3Dto2D(p3, this.width, this.height, this.scale, this.viewDistance3D);
      this.projected2D.push({
        x: p2.x,
        y: p2.y,
        depth: p2.depth,
        w: v4.w
      });
    }
  }

  // Calculate spacetime warp vector at an arbitrary 2D point (x, y)
  getSpacetimeDistortion(px, py) {
    if (!this.gravityBend || this.warpForce <= 0 || this.projected2D.length === 0) {
      return { fx: 0, fy: 0, warpScalar: 0 };
    }

    let fx = 0;
    let fy = 0;
    let totalWarp = 0;

    // Central core gravitational pull + hyper-rotational twist
    const cx = this.center2D.x;
    const cy = this.center2D.y;
    const dx = cx - px;
    const dy = cy - py;
    const distSq = dx * dx + dy * dy + 400;
    const dist = Math.sqrt(distSq);

    if (dist < 480) {
      const g = (this.warpForce * 2200) / distSq;
      // Radial pull
      fx += (dx / dist) * g;
      fy += (dy / dist) * g;

      // 4D Coriolis / frame-dragging angular torque
      const twist = (this.rotSpeeds.xw + this.rotSpeeds.zw) * 35;
      fx += (-dy / dist) * g * twist;
      fy += (dx / dist) * g * twist;

      totalWarp = Math.min(1.0, 150 / dist);
    }

    return { fx, fy, warpScalar: totalWarp };
  }

  render(camera = { x: 0, y: 0, zoom: 1.0 }) {
    if (!this.renderWireframe || !this.ctx || this.projected2D.length === 0) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Apply Camera Transform
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-this.width / 2 + camera.x, -this.height / 2 + camera.y);

    // Render subtle 4D manifold warp field glow in center
    const grad = ctx.createRadialGradient(
      this.center2D.x, this.center2D.y, 5,
      this.center2D.x, this.center2D.y, this.scale * 1.6
    );
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
    grad.addColorStop(0.4, 'rgba(176, 38, 255, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.center2D.x, this.center2D.y, this.scale * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Render edges of the 4D Polytope
    for (let i = 0; i < this.edges.length; i++) {
      const [idxA, idxB] = this.edges[i];
      const pA = this.projected2D[idxA];
      const pB = this.projected2D[idxB];
      if (!pA || !pB) continue;

      const avgW = (pA.w + pB.w) * 0.5; // -1 to 1 along 4th axis
      const alpha = Math.max(0.12, Math.min(0.9, 0.5 + avgW * 0.4));
      
      // Interpolate color based on 4D coordinate: Cyan (w < 0) to Magenta (w > 0)
      const r = Math.floor(avgW > 0 ? 255 * avgW : 0);
      const g = Math.floor(avgW < 0 ? 240 * (1 - Math.abs(avgW)) : 90);
      const b = 255;

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
      ctx.lineWidth = Math.max(1, 2.0 + avgW * 1.2);
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }

    // Render vertices as glowing hyper-nodes
    for (let i = 0; i < this.projected2D.length; i++) {
      const p = this.projected2D[i];
      const nodeAlpha = Math.max(0.3, Math.min(1.0, 0.6 + p.w * 0.4));
      const radius = Math.max(2, 4 + p.w * 2.5);

      ctx.shadowColor = p.w > 0 ? '#ff0077' : '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.w > 0 ? `rgba(255, 0, 119, ${nodeAlpha})` : `rgba(0, 240, 255, ${nodeAlpha})`;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

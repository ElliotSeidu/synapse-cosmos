// Hyperdimensional 4D Math Utilities
// Handles 4D vectors, 6-plane 4D rotation matrices, and non-Euclidean perspective projections.

export class Vec4 {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  clone() {
    return new Vec4(this.x, this.y, this.z, this.w);
  }
}

export class HyperMatrix4D {
  // Rotate a 4D vector across the 6 fundamental orthogonal planes:
  // XY, XZ, XW, YZ, YW, ZW
  static rotate4D(v, angles) {
    let { x, y, z, w } = v;
    const { xy = 0, xz = 0, xw = 0, yz = 0, yw = 0, zw = 0 } = angles;

    // XY rotation
    if (xy !== 0) {
      const cos = Math.cos(xy);
      const sin = Math.sin(xy);
      const nx = x * cos - y * sin;
      const ny = x * sin + y * cos;
      x = nx;
      y = ny;
    }

    // XZ rotation
    if (xz !== 0) {
      const cos = Math.cos(xz);
      const sin = Math.sin(xz);
      const nx = x * cos - z * sin;
      const nz = x * sin + z * cos;
      x = nx;
      z = nz;
    }

    // XW rotation (4th dimensional hyper-rotation)
    if (xw !== 0) {
      const cos = Math.cos(xw);
      const sin = Math.sin(xw);
      const nx = x * cos - w * sin;
      const nw = x * sin + w * cos;
      x = nx;
      w = nw;
    }

    // YZ rotation
    if (yz !== 0) {
      const cos = Math.cos(yz);
      const sin = Math.sin(yz);
      const ny = y * cos - z * sin;
      const nz = y * sin + z * cos;
      y = ny;
      z = nz;
    }

    // YW rotation (4th dimensional hyper-rotation)
    if (yw !== 0) {
      const cos = Math.cos(yw);
      const sin = Math.sin(yw);
      const ny = y * cos - w * sin;
      const nw = y * sin + w * cos;
      y = ny;
      w = nw;
    }

    // ZW rotation (4th dimensional hyper-rotation)
    if (zw !== 0) {
      const cos = Math.cos(zw);
      const sin = Math.sin(zw);
      const nz = z * cos - w * sin;
      const nw = z * sin + w * cos;
      z = nz;
      w = nw;
    }

    return new Vec4(x, y, z, w);
  }

  // Stereographic / Perspective Projection from 4D (x,y,z,w) into 3D (x,y,z)
  // cameraDistance is the distance along the 4th axis (W)
  static project4Dto3D(v, cameraDistance = 2.5) {
    const wFactor = 1 / Math.max(0.01, cameraDistance - v.w);
    return {
      x: v.x * wFactor,
      y: v.y * wFactor,
      z: v.z * wFactor,
      wFactor: wFactor
    };
  }

  // Perspective Projection from 3D (x,y,z) into 2D Screen Space (sx, sy)
  static project3Dto2D(p3, screenWidth, screenHeight, scale = 300, viewDist = 3.0) {
    const zFactor = 1 / Math.max(0.01, viewDist - p3.z);
    const sx = screenWidth / 2 + p3.x * zFactor * scale;
    const sy = screenHeight / 2 + p3.y * zFactor * scale;
    return {
      x: sx,
      y: sy,
      depth: p3.z + p3.wFactor,
      scale: zFactor * scale
    };
  }
}

// Geometric Polytope Builders in 4D
export class Polytope4DFactory {
  // 1. Tesseract (8 cells, 16 vertices, 32 edges)
  static createTesseract() {
    const vertices = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            vertices.push(new Vec4(x, y, z, w));
          }
        }
      }
    }

    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        let diffs = 0;
        if (vertices[i].x !== vertices[j].x) diffs++;
        if (vertices[i].y !== vertices[j].y) diffs++;
        if (vertices[i].z !== vertices[j].z) diffs++;
        if (vertices[i].w !== vertices[j].w) diffs++;
        if (diffs === 1) edges.push([i, j]);
      }
    }
    return { vertices, edges, name: '4D Tesseract (Hypercube)' };
  }

  // 2. Clifford Torus (Parametric non-Euclidean manifold with Villarceau rings)
  static createCliffordTorus(uSteps = 12, vSteps = 12) {
    const vertices = [];
    const edges = [];
    const r1 = 1.0;
    const r2 = 1.0;

    for (let i = 0; i < uSteps; i++) {
      const u = (i / uSteps) * Math.PI * 2;
      for (let j = 0; j < vSteps; j++) {
        const v = (j / vSteps) * Math.PI * 2;
        vertices.push(new Vec4(
          r1 * Math.cos(u),
          r1 * Math.sin(u),
          r2 * Math.cos(v),
          r2 * Math.sin(v)
        ));
      }
    }

    for (let i = 0; i < uSteps; i++) {
      for (let j = 0; j < vSteps; j++) {
        const current = i * vSteps + j;
        const nextU = ((i + 1) % uSteps) * vSteps + j;
        const nextV = i * vSteps + ((j + 1) % vSteps);
        edges.push([current, nextU]);
        edges.push([current, nextV]);
      }
    }
    return { vertices, edges, name: '4D Clifford Torus (Hopf Fibration)' };
  }

  // 3. 24-Cell (Icositetrachoron: 24 vertices, 96 edges)
  static create24Cell() {
    const vertices = [];
    // 8 vertices: permutations of (±1, 0, 0, 0) * sqrt(2)
    const s = Math.SQRT2;
    vertices.push(new Vec4(s, 0, 0, 0), new Vec4(-s, 0, 0, 0));
    vertices.push(new Vec4(0, s, 0, 0), new Vec4(0, -s, 0, 0));
    vertices.push(new Vec4(0, 0, s, 0), new Vec4(0, 0, -s, 0));
    vertices.push(new Vec4(0, 0, 0, s), new Vec4(0, 0, 0, -s));

    // 16 vertices: all combinations of (±1/2, ±1/2, ±1/2, ±1/2) * 2 = (±1, ±1, ±1, ±1)
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            vertices.push(new Vec4(x, y, z, w));
          }
        }
      }
    }

    // Connect vertices at Euclidean distance sqrt(2)
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dx = vertices[i].x - vertices[j].x;
        const dy = vertices[i].y - vertices[j].y;
        const dz = vertices[i].z - vertices[j].z;
        const dw = vertices[i].w - vertices[j].w;
        const distSq = dx * dx + dy * dy + dz * dz + dw * dw;
        if (Math.abs(distSq - 2.0) < 0.1 || Math.abs(distSq - 1.414) < 0.1) {
          edges.push([i, j]);
        }
      }
    }
    return { vertices, edges, name: '4D 24-Cell (Icositetrachoron)' };
  }

  // 4. 5-Cell (Pentachoron / 4D Hyper-Tetrahedron: 5 vertices, 10 edges)
  static create5Cell() {
    const a = 1 / Math.sqrt(5);
    const vertices = [
      new Vec4(1, 1, 1, -a),
      new Vec4(1, -1, -1, -a),
      new Vec4(-1, 1, -1, -a),
      new Vec4(-1, -1, 1, -a),
      new Vec4(0, 0, 0, Math.sqrt(5) - a)
    ];

    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        edges.push([i, j]);
      }
    }
    return { vertices, edges, name: '4D 5-Cell (Pentachoron)' };
  }

  // 5. 16-Cell (Hexadecachoron / 4D Hyper-Octahedron: 8 vertices, 24 edges)
  static create16Cell() {
    const s = 1.45;
    const vertices = [
      new Vec4(s, 0, 0, 0), new Vec4(-s, 0, 0, 0),
      new Vec4(0, s, 0, 0), new Vec4(0, -s, 0, 0),
      new Vec4(0, 0, s, 0), new Vec4(0, 0, -s, 0),
      new Vec4(0, 0, 0, s), new Vec4(0, 0, 0, -s)
    ];
    const edges = [];
    // Connect every vertex to all non-antipodal vertices
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        // Antipodal pairs are (0,1), (2,3), (4,5), (6,7)
        if (Math.floor(i / 2) !== Math.floor(j / 2)) {
          edges.push([i, j]);
        }
      }
    }
    return { vertices, edges, name: '4D 16-Cell (Hyper-Octahedron)' };
  }

  // 6. 4D Klein Bottle Immersion (Non-orientable topological manifold in R^4)
  static createKleinBottle(uSteps = 14, vSteps = 10) {
    const vertices = [];
    const edges = [];
    const R = 1.05;
    const P = 0.45;

    for (let i = 0; i < uSteps; i++) {
      const u = (i / uSteps) * Math.PI * 2;
      for (let j = 0; j < vSteps; j++) {
        const v = (j / vSteps) * Math.PI * 2;
        const r = R + P * Math.cos(v);
        const x = r * Math.cos(u);
        const y = r * Math.sin(u);
        const z = P * Math.sin(v) * Math.cos(u * 0.5);
        const w = P * Math.sin(v) * Math.sin(u * 0.5);
        vertices.push(new Vec4(x, y, z, w));
      }
    }

    for (let i = 0; i < uSteps; i++) {
      for (let j = 0; j < vSteps; j++) {
        const current = i * vSteps + j;
        const nextU = ((i + 1) % uSteps) * vSteps + (i + 1 === uSteps ? (vSteps - j) % vSteps : j);
        const nextV = i * vSteps + ((j + 1) % vSteps);
        edges.push([current, nextU]);
        edges.push([current, nextV]);
      }
    }
    return { vertices, edges, name: '4D Klein Bottle Immersion' };
  }
}

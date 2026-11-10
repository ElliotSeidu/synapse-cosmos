export class WebGLBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    this.program = null;
    this.timeLocation = null;
    this.resolutionLocation = null;
    this.warpLocation = null;
    this.warpFactor = 0.0;
    
    this.init();
  }

  init() {
    if (!this.gl) return;
    
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Incredible generative nebula shader
    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_warp;
      
      // Noise functions
      float hash(vec2 p) {
        vec3 p3  = fract(vec3(p.xyx) * .1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      
      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }

      mat2 rot(float a) {
        float s = sin(a), c = cos(a);
        return mat2(c, -s, s, c);
      }

      float fbm(vec2 p) {
        float f = 0.0;
        float amp = 0.5;
        for(int i=0; i<5; i++) {
          f += amp * noise(p);
          p = rot(u_time * 0.1) * p * 2.0;
          amp *= 0.5;
        }
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= u_resolution.x / u_resolution.y;
        
        vec2 p = uv;
        
        // Spacetime warp effect
        float r = length(p);
        p += p * (u_warp * 0.5) / (r + 0.5);
        
        float q = fbm(p * 2.0 + u_time * 0.2);
        vec2 r2 = vec2(fbm(p + q + u_time * 0.3), fbm(p - q - u_time * 0.4));
        float f = fbm(p + r2 * 2.0);
        
        vec3 col = mix(
          vec3(0.02, 0.05, 0.15), 
          vec3(0.1, 0.4, 0.8), 
          clamp(f * f * 4.0, 0.0, 1.0)
        );
        col = mix(
          col,
          vec3(0.8, 0.1, 0.5),
          clamp(length(r2) * 1.5 - 0.5, 0.0, 1.0)
        );
        col += vec3(0.0, 0.9, 1.0) * pow(max(0.0, 1.0 - r), 3.0) * (u_warp * 0.5);
        
        // Stars
        float star = noise(p * 150.0);
        if (star > 0.98) col += vec3(1.0) * (star - 0.98) * 50.0;
        
        gl_FragColor = vec4(col * 0.6, 1.0);
      }
    `;

    this.program = this.createProgram(vsSource, fsSource);
    if (!this.program) return;

    this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
    this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
    this.warpLocation = this.gl.getUniformLocation(this.program, "u_warp");

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  createProgram(vs, fs) {
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vs);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fs);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  render(time, warpForce) {
    if (!this.gl || !this.program) return;
    
    this.warpFactor += (warpForce - this.warpFactor) * 0.05;
    
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.timeLocation, time);
    this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.warpLocation, this.warpFactor);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}

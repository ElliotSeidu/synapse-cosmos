import { SoundEngine } from './audio/soundEngine.js';
import { Tesseract4D } from './math4d/tesseract.js';
import { Ecosystem } from './simulation/ecosystem.js';
import { HUD } from './ui/hud.js';
import { SpecimenInspector } from './ui/inspector.js';
import { BiosphereAnalytics } from './ui/analytics.js';
import { WebGLBackground } from './webglBackground.js';

window.addEventListener('DOMContentLoaded', () => {
  // Canvases
  const bgCanvas = document.getElementById('bg-canvas');
  const trailsCanvas = document.getElementById('trails-canvas');
  const manifoldCanvas = document.getElementById('manifold-canvas');
  const simCanvas = document.getElementById('sim-canvas');
  const fxCanvas = document.getElementById('fx-canvas');
  const scopeCanvas = document.getElementById('audio-scope-canvas');

  let width = window.innerWidth;
  let height = window.innerHeight;

  // Infinite Camera Navigation Transform
  const camera = {
    x: 0,
    y: 0,
    zoom: 1.0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    camStart: { x: 0, y: 0 }
  };

  let webglBg = null;

  const resizeAll = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    [bgCanvas, trailsCanvas, manifoldCanvas, simCanvas, fxCanvas].forEach(c => {
      c.width = width;
      c.height = height;
    });
  };

  resizeAll();
  webglBg = new WebGLBackground(bgCanvas);
  
  // Convert Screen Coordinates (clientX, clientY) to World Simulation Space
  const screenToWorld = (sx, sy) => {
    const wx = (sx - width / 2) / camera.zoom + width / 2 - camera.x;
    const wy = (sy - height / 2) / camera.zoom + height / 2 - camera.y;
    return { x: wx, y: wy };
  };

  window.addEventListener('resize', () => {
    resizeAll();
    if (ecosystem) ecosystem.resize(width, height);
  });

  // Subsystems Initialization
  const soundEngine = new SoundEngine();
  soundEngine.init(scopeCanvas);

  const tesseract = new Tesseract4D(manifoldCanvas);
  tesseract.resize(width, height);

  const ecosystem = new Ecosystem(width, height, soundEngine, tesseract);
  const inspector = new SpecimenInspector(ecosystem, soundEngine);
  const analytics = new BiosphereAnalytics(ecosystem);
  const hud = new HUD(ecosystem, soundEngine, tesseract, inspector, analytics);

  // WebSocket Collaborative Relay with Auto-Reconnect
  let ws = null;
  let reconnectDelay = 2000;
  const clientId = 'client_' + Math.random().toString(36).substr(2, 9);
  const remoteCursors = {};

  const initWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => { reconnectDelay = 2000; };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'BLACK_HOLE_SPAWN') {
            ecosystem.spawnSingularity(data.x, data.y);
            hud.showToast('Remote Singularity detected in the cosmic ether');
          } else if (data.type === 'SUPERNOVA_BLAST') {
            ecosystem.triggerSupernova(data.x, data.y);
            hud.showToast('Remote Supernova detonation detected');
          } else if (data.type === 'MUTATION_BURST') {
            ecosystem.fireCosmicRay(data.x, data.y);
            hud.showToast('Remote Cosmic Ray strike detected');
          } else if (data.type === 'CURSOR_MOVE') {
            remoteCursors[data.clientId] = { x: data.x, y: data.y, lastUpdate: Date.now() };
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        setTimeout(initWebSocket, reconnectDelay);
        reconnectDelay = Math.min(30000, reconnectDelay * 1.5);
      };
      ws.onerror = () => { ws.close(); };
    } catch (err) {}
  };
  initWebSocket();

  // Mouse & Touch Controls with Infinite Camera Navigation
  let isPointerDown = false;
  let riftStart = null;
  let rawMousePos = { x: 0, y: 0 };
  let worldMousePos = { x: 0, y: 0 };

  const handlePointerDown = (e) => {
    soundEngine.ensureContext();
    if (e.button === 2) return; // Right click = anomaly neutralization

    const rect = simCanvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    rawMousePos = { x: sx, y: sy };
    worldMousePos = screenToWorld(sx, sy);

    // Pan with middle mouse (button 1) or Shift + Click
    if (e.button === 1 || e.shiftKey) {
      camera.isPanning = true;
      camera.panStart = { x: sx, y: sy };
      camera.camStart = { x: camera.x, y: camera.y };
      return;
    }

    isPointerDown = true;
    executeToolAction(worldMousePos.x, worldMousePos.y);
  };

  const handlePointerMove = (e) => {
    const rect = simCanvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    rawMousePos = { x: sx, y: sy };
    worldMousePos = screenToWorld(sx, sy);

    if (ws && ws.readyState === WebSocket.OPEN) {
      const now = Date.now();
      if (!camera.lastCursorBroadcast || now - camera.lastCursorBroadcast > 50) {
        camera.lastCursorBroadcast = now;
        ws.send(JSON.stringify({ type: 'CURSOR_MOVE', clientId, x: worldMousePos.x, y: worldMousePos.y }));
      }
    }

    if (camera.isPanning) {
      const dx = sx - camera.panStart.x;
      const dy = sy - camera.panStart.y;
      camera.x = camera.camStart.x + dx / camera.zoom;
      camera.y = camera.camStart.y + dy / camera.zoom;
      return;
    }

    if (isPointerDown) {
      soundEngine.setTheremin(true, sx / width, sy / height);

      if (hud.activeTool === 'spores' && Math.random() < 0.4) {
        ecosystem.spawnSporeBloom(worldMousePos.x, worldMousePos.y, 4);
      } else if (hud.activeTool === 'cosmicray') {
        ecosystem.fireCosmicRay(worldMousePos.x, worldMousePos.y, 50);
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDown = false;
    camera.isPanning = false;
    soundEngine.setTheremin(false);
  };

  // Zoom with Wheel centered at cursor
  simCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    soundEngine.ensureContext();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.3, Math.min(4.5, camera.zoom * zoomFactor));

    // Keep world coordinate under cursor stable
    const rect = simCanvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const before = screenToWorld(sx, sy);
    camera.zoom = newZoom;
    const after = screenToWorld(sx, sy);

    camera.x += (after.x - before.x);
    camera.y += (after.y - before.y);
  }, { passive: false });

  // Right-Click Context Menu Deletion for Anomaly Neutralization
  simCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = simCanvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    const removedWell = ecosystem.removeWellAt(world.x, world.y, 45 / camera.zoom);
    const removedRift = ecosystem.removeRiftAt(world.x, world.y, 45 / camera.zoom);
    const removedPulsar = ecosystem.removePulsarAt ? ecosystem.removePulsarAt(world.x, world.y, 45 / camera.zoom) : false;

    if (removedWell || removedRift || removedPulsar) {
      hud.showToast('Celestial Anomaly neutralized & removed');
      if (soundEngine) soundEngine.playEat(false);
    } else {
      if (riftStart) {
        riftStart = null;
        hud.showToast('Rift construction canceled');
      }
    }
  });

  const executeToolAction = (x, y) => {
    switch (hud.activeTool) {
      case 'inspect': {
        let closest = null;
        let closestDist = 50 / camera.zoom;
        for (let i = 0; i < ecosystem.creatures.length; i++) {
          const c = ecosystem.creatures[i];
          const dist = Math.hypot(c.x - x, c.y - y);
          if (dist < closestDist) {
            closestDist = dist;
            closest = c;
          }
        }
        if (closest) {
          inspector.open(closest);
          hud.showToast(`Tracking Specimen #${closest.id}`);
        } else {
          inspector.close();
        }
        break;
      }

      case 'singularity': {
        ecosystem.spawnSingularity(x, y);
        hud.showToast('Singularity Event Horizon formed');
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'BLACK_HOLE_SPAWN', x, y }));
        }
        break;
      }

      case 'repulsor': {
        ecosystem.spawnRepulsor(x, y);
        hud.showToast('White Hole Anti-Gravity Anchor deployed');
        break;
      }

      case 'spores': {
        ecosystem.spawnSporeBloom(x, y, 24);
        hud.showToast('Quantum Spores scattered');
        break;
      }

      case 'cosmicray': {
        const count = ecosystem.fireCosmicRay(x, y, 95 / camera.zoom);
        hud.showToast(`Cosmic Ray irradiated ${count} organism(s)!`);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'MUTATION_BURST', x, y }));
        }
        break;
      }

      case 'supernova': {
        ecosystem.triggerSupernova(x, y);
        hud.showToast('💥 SUPERNOVA DETONATED: Relativistic blast wave propagating!');
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'SUPERNOVA_BLAST', x, y }));
        }
        break;
      }

      case 'stasis': {
        ecosystem.spawnStasisBubble(x, y, 100 / camera.zoom);
        hud.showToast('❄️ Quantum Stasis Field established');
        break;
      }

      case 'lightning': {
        const hits = ecosystem.chainLightning(x, y, 6);
        hud.showToast(`⚡ Chain Mutagen Lightning struck ${hits} organism(s)!`);
        break;
      }

      case 'rift': {
        if (!riftStart) {
          riftStart = { x, y };
          hud.showToast('Rift Anchor A locked. Click target location for Anchor B...');
        } else {
          ecosystem.spawnRift(riftStart.x, riftStart.y, x, y);
          hud.showToast('4D Spacetime Wormhole stabilized!');
          riftStart = null;
        }
        break;
      }

      case 'pulsar': {
        ecosystem.spawnPulsar(x, y);
        hud.showToast('☀️ Orbital Dyson Pulsar deployed — sweeping relativistic beams!');
        break;
      }
    }
  };

  simCanvas.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);
  window.addEventListener('mouseleave', handlePointerUp);

  simCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) handlePointerDown(e.touches[0]);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handlePointerMove(e.touches[0]);
  }, { passive: true });

  window.addEventListener('touchend', handlePointerUp);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    soundEngine.ensureContext();

    switch (e.key) {
      case ' ':
        e.preventDefault();
        hud.togglePause();
        break;
      case '1': hud.setTool('inspect'); break;
      case '2': hud.setTool('singularity'); break;
      case '3': hud.setTool('repulsor'); break;
      case '4': hud.setTool('spores'); break;
      case '5': hud.setTool('cosmicray'); break;
      case '6': hud.setTool('supernova'); break;
      case '7': hud.setTool('stasis'); break;
      case '8': hud.setTool('lightning'); break;
      case '9': hud.setTool('rift'); break;
      case '0': hud.setTool('pulsar'); break;
      case 'f':
      case 'F':
        hud.lockApexSpecimen();
        break;
      case 'h':
      case 'H':
        // Toggle Cinematic Screensaver Mode
        document.body.classList.toggle('cinematic-mode');
        hud.showToast(document.body.classList.contains('cinematic-mode') ? 'Holographic Cinematic Mode (Press H to restore)' : 'Tactical HUD Restored');
        break;
      case 'c':
      case 'C':
        // Center Camera
        camera.x = 0;
        camera.y = 0;
        camera.zoom = 1.0;
        hud.showToast('Camera Centered');
        break;
      case 'r':
      case 'R':
        document.getElementById('respawn-btn').click();
        break;
      case 'Escape':
        if (riftStart) {
          riftStart = null;
          hud.showToast('Rift creation canceled');
        } else {
          inspector.close();
        }
        break;
      case '+':
      case '=':
        ecosystem.timeDilation = Math.min(3.0, ecosystem.timeDilation + 0.2);
        document.getElementById('time-slider').value = ecosystem.timeDilation;
        document.getElementById('time-rate-label').textContent = `${ecosystem.timeDilation.toFixed(1)}x`;
        break;
      case '-':
      case '_':
        ecosystem.timeDilation = Math.max(0.1, ecosystem.timeDilation - 0.2);
        document.getElementById('time-slider').value = ecosystem.timeDilation;
        document.getElementById('time-rate-label').textContent = `${ecosystem.timeDilation.toFixed(1)}x`;
        break;
    }
  });

  // Interactive Cosmic Mini-Map Radar
  const minimapCanvas = document.getElementById('minimap-canvas');
  const zoomIndicator = document.getElementById('zoom-indicator');
  const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
  let isMinimapDragging = false;

  const teleportCameraFromMinimap = (e) => {
    if (!minimapCanvas) return;
    const rect = minimapCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const targetWorldX = mx * width;
    const targetWorldY = my * height;
    inspector.trackingActive = false;
    camera.x = width / 2 - targetWorldX;
    camera.y = height / 2 - targetWorldY;
  };

  if (minimapCanvas) {
    minimapCanvas.addEventListener('mousedown', (e) => {
      isMinimapDragging = true;
      teleportCameraFromMinimap(e);
    });
    window.addEventListener('mousemove', (e) => {
      if (isMinimapDragging) teleportCameraFromMinimap(e);
    });
    window.addEventListener('mouseup', () => {
      isMinimapDragging = false;
    });
  }

  const renderMinimap = () => {
    if (!minimapCtx || !minimapCanvas) return;
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;
    minimapCtx.clearRect(0, 0, mw, mh);

    // Background grid
    minimapCtx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    minimapCtx.lineWidth = 0.5;
    minimapCtx.beginPath();
    minimapCtx.moveTo(mw / 2, 0); minimapCtx.lineTo(mw / 2, mh);
    minimapCtx.moveTo(0, mh / 2); minimapCtx.lineTo(mw, mh / 2);
    minimapCtx.stroke();

    const sx = mw / Math.max(1, width);
    const sy = mh / Math.max(1, height);

    // Anomalies (Wells, Pulsars, Rifts)
    for (let i = 0; i < ecosystem.gravWells.length; i++) {
      const g = ecosystem.gravWells[i];
      minimapCtx.fillStyle = g.isRepulsor ? '#00f0ff' : '#ff0077';
      minimapCtx.beginPath();
      minimapCtx.arc(g.x * sx, g.y * sy, 3.2, 0, Math.PI * 2);
      minimapCtx.fill();
    }
    if (ecosystem.pulsars) {
      for (let i = 0; i < ecosystem.pulsars.length; i++) {
        const p = ecosystem.pulsars[i];
        minimapCtx.fillStyle = '#ffaa00';
        minimapCtx.beginPath();
        minimapCtx.arc(p.x * sx, p.y * sy, 3.2, 0, Math.PI * 2);
        minimapCtx.fill();
      }
    }

    // Organisms
    for (let i = 0; i < ecosystem.creatures.length; i++) {
      const c = ecosystem.creatures[i];
      if (!c.alive) continue;
      const isSelected = c === ecosystem.selectedCreature;
      minimapCtx.fillStyle = isSelected ? '#ffffff' : (c.species === 'carnivore' ? '#ff3366' : (c.species === 'scavenger' ? '#ffaa00' : '#00ffcc'));
      minimapCtx.beginPath();
      minimapCtx.arc(c.x * sx, c.y * sy, isSelected ? 3.2 : 1.6, 0, Math.PI * 2);
      minimapCtx.fill();
    }

    // Camera Viewport Box
    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(width, height);
    const vx = topLeft.x * sx;
    const vy = topLeft.y * sy;
    const vw = (bottomRight.x - topLeft.x) * sx;
    const vh = (bottomRight.y - topLeft.y) * sy;

    minimapCtx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    minimapCtx.lineWidth = 1.2;
    minimapCtx.strokeRect(vx, vy, vw, vh);

    if (zoomIndicator) {
      zoomIndicator.textContent = `${camera.zoom.toFixed(1)}x`;
    }
  };

  // Main 60 FPS Animation & Simulation Loop
  let frameCount = 0;
  let fps = 60;
  let lastFpsCalc = performance.now();

  const loop = (currentTime) => {
    requestAnimationFrame(loop);

    frameCount++;
    if (currentTime - lastFpsCalc >= 500) {
      fps = (frameCount * 1000) / (currentTime - lastFpsCalc);
      frameCount = 0;
      lastFpsCalc = currentTime;
    }

    // Camera Tracking Mode
    if (inspector.trackingActive && ecosystem.selectedCreature && ecosystem.selectedCreature.alive) {
      const targetCamX = width / 2 - ecosystem.selectedCreature.x;
      const targetCamY = height / 2 - ecosystem.selectedCreature.y;
      camera.x += (targetCamX - camera.x) * 0.08;
      camera.y += (targetCamY - camera.y) * 0.08;
    }

    // Step Simulation
    ecosystem.update();

    // Render WebGL Background
    if (webglBg) {
      const currentWarp = parseFloat(document.getElementById('warp-force').value) || 1.0;
      webglBg.render(currentTime / 1000, currentWarp);
    }

    // Render 4D Manifold with Camera
    tesseract.render(camera);

    // Render Biosphere, Particles & FX with Camera
    ecosystem.render(trailsCanvas, simCanvas, fxCanvas, camera);

    const ctxFX = fxCanvas.getContext('2d');

    // Render Multiplayer Cursors
    ctxFX.save();
    ctxFX.translate(width / 2, height / 2);
    ctxFX.scale(camera.zoom, camera.zoom);
    ctxFX.translate(-width / 2 + camera.x, -height / 2 + camera.y);

    const nowTime = Date.now();
    for (const [id, cursor] of Object.entries(remoteCursors)) {
      if (nowTime - cursor.lastUpdate > 5000) {
        delete remoteCursors[id];
        continue;
      }
      ctxFX.beginPath();
      ctxFX.arc(cursor.x, cursor.y, 4 / camera.zoom, 0, Math.PI * 2);
      ctxFX.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctxFX.shadowBlur = 10 / camera.zoom;
      ctxFX.shadowColor = '#00f0ff';
      ctxFX.fill();

      ctxFX.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctxFX.lineWidth = 1 / camera.zoom;
      ctxFX.beginPath();
      ctxFX.moveTo(cursor.x - 10 / camera.zoom, cursor.y);
      ctxFX.lineTo(cursor.x + 10 / camera.zoom, cursor.y);
      ctxFX.moveTo(cursor.x, cursor.y - 10 / camera.zoom);
      ctxFX.lineTo(cursor.x, cursor.y + 10 / camera.zoom);
      ctxFX.stroke();
    }
    ctxFX.restore();

    // In-Progress Rift Construction Beam
    if (riftStart) {
      ctxFX.save();
      ctxFX.translate(width / 2, height / 2);
      ctxFX.scale(camera.zoom, camera.zoom);
      ctxFX.translate(-width / 2 + camera.x, -height / 2 + camera.y);

      ctxFX.lineWidth = 1.8 / camera.zoom;
      ctxFX.setLineDash([6, 6]);
      ctxFX.strokeStyle = 'rgba(176, 38, 255, 0.85)';
      ctxFX.shadowColor = '#b026ff';
      ctxFX.shadowBlur = 10;
      ctxFX.beginPath();
      ctxFX.moveTo(riftStart.x, riftStart.y);
      ctxFX.lineTo(worldMousePos.x, worldMousePos.y);
      ctxFX.stroke();

      ctxFX.beginPath();
      ctxFX.arc(riftStart.x, riftStart.y, 16 / camera.zoom, 0, Math.PI * 2);
      ctxFX.stroke();

      ctxFX.restore();
    }

    // Update UI & Telemetry
    inspector.update();
    analytics.update();
    hud.update(fps);
    renderMinimap();
  };

  requestAnimationFrame(loop);
});

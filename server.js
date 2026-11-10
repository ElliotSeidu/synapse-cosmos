import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4321;
const DATA_DIR = path.join(__dirname, 'saved_universes');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API: List saved universes
app.get('/api/universes', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const metaList = files.map(file => {
      const fullPath = path.join(DATA_DIR, file);
      const stat = fs.statSync(fullPath);
      let preview = {};
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        preview = {
          title: data.name || file.replace('.json', ''),
          creaturesCount: data.creatures?.length || 0,
          generation: data.stats?.generation || 1,
          createdAt: stat.birthtime || stat.mtime
        };
      } catch (e) {}
      return { id: file, ...preview };
    });
    res.json(metaList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Save universe snapshot
app.post('/api/universes', (req, res) => {
  try {
    const { name, data } = req.body;
    const sanitizedName = (name || `universe_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedName}.json`;
    const target = path.join(DATA_DIR, filename);
    fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, id: filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Load specific universe
app.get('/api/universes/:id', (req, res) => {
  try {
    const file = path.basename(req.params.id);
    const target = path.join(DATA_DIR, file);
    if (!fs.existsSync(target)) {
      return res.status(404).json({ error: 'Universe not found' });
    }
    const content = fs.readFileSync(target, 'utf8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete specific universe
app.delete('/api/universes/:id', (req, res) => {
  try {
    const file = path.basename(req.params.id);
    const target = path.join(DATA_DIR, file);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Universe not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcast WebSocket message to all connected clients
function broadcast(msg, senderWs = null) {
  const payload = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'WELCOME',
    message: 'Connected to Synapse Cosmos Quantum Simulation Hub',
    peerCount: wss.clients.size
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      // Relay multi-user god-interactions (e.g. collaborative black hole creation, cosmic ray strikes)
      if (['CELESTIAL_EVENT', 'MUTATION_BURST', 'BLACK_HOLE_SPAWN', 'SUPERNOVA_BLAST', 'ECOSYSTEM_PING', 'CURSOR_MOVE'].includes(parsed.type)) {
        broadcast(parsed, ws);
      }
    } catch (err) {
      console.error('WS Parse Error:', err);
    }
  });

  ws.on('close', () => {
    broadcast({ type: 'PEER_UPDATE', peerCount: wss.clients.size });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌌 SYNAPSE // COSMOS is live and hyper-accelerated!`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./db');
const { calculateRoute } = require('./routeEngine');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── STATIONS ───────────────────────────────────────────────────────────────

// GET /stations - All stations
app.get('/stations', (req, res) => {
  const { line } = req.query;
  let stations;
  if (line) {
    stations = db.prepare('SELECT * FROM stations WHERE line = ? ORDER BY order_index').all(line);
  } else {
    stations = db.prepare('SELECT * FROM stations ORDER BY line, order_index').all();
  }
  res.json({ stations });
});

// GET /stations/search?q=
app.get('/stations/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const stations = db.prepare(
    "SELECT DISTINCT station_name, is_interchange FROM stations WHERE station_name LIKE ? GROUP BY station_name ORDER BY station_name"
  ).all(q);
  res.json({ stations });
});

// ─── ROUTE ──────────────────────────────────────────────────────────────────

// GET /route?source=A&destination=B
app.get('/route', (req, res) => {
  const { source, destination } = req.query;
  if (!source || !destination) {
    return res.status(400).json({ error: 'source and destination are required' });
  }
  try {
    const route = calculateRoute(source, destination);
    res.json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── TICKETS ────────────────────────────────────────────────────────────────

// POST /tickets
app.post('/tickets', async (req, res) => {
  const { source, destination, passengerName } = req.body;
  if (!source || !destination) {
    return res.status(400).json({ error: 'source and destination are required' });
  }
  try {
    const route = calculateRoute(source, destination);
    const ticketId = uuidv4();
    const now = new Date().toISOString();

    const ticketData = {
      id: ticketId,
      source,
      destination,
      route: route.stations.map(s => s.name),
      fare: route.fare,
      travelTime: route.travelTime,
      passengerName: passengerName || 'Passenger',
      issuedAt: now,
      validFor: '90 minutes'
    };

    const qrString = JSON.stringify({
      id: ticketId,
      from: source,
      to: destination,
      fare: route.fare,
      issued: now
    });

    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });

    db.prepare(
      'INSERT INTO tickets (id, source, destination, route, fare, travel_time, qr_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(ticketId, source, destination, JSON.stringify(route.stations), route.fare, route.travelTime, qrDataUrl, now);

    res.json({
      ticket: ticketData,
      route,
      qr: qrDataUrl,
      fare: route.fare,
      time: route.travelTime
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /tickets/:id
app.get('/tickets/:id', (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.route = JSON.parse(ticket.route);
  res.json(ticket);
});

// ─── TRAIN TIMING ───────────────────────────────────────────────────────────

// GET /trains/timing?station=Guindy
app.get('/trains/timing', (req, res) => {
  const { station } = req.query;
  if (!station) return res.status(400).json({ error: 'station is required' });

  const stationExists = db.prepare('SELECT * FROM stations WHERE station_name = ? LIMIT 1').get(station);
  if (!stationExists) return res.status(404).json({ error: 'Station not found' });

  // Dynamically generated real-time schedule representation based on actual Time-To-Arrival logic
  const now = new Date();
  const minuteOfHour = now.getMinutes();
  const seconds = now.getSeconds();

  // Chennai Metro Real Operational Parameters
  // Peak: 5 mins, Off-peak: 10 mins. We'll use 5 for demonstration density.
  const INTERVAL = 5; 
  const stationHash = station.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % INTERVAL;
  
  const lines = db.prepare('SELECT DISTINCT line FROM stations WHERE station_name = ?').all(station).map(r => r.line);

  let next_trains = [];
  const trainsByLine = {};
  const activeTrains = [];

  const getStatus = (minutes) => {
    if (minutes === 0) return 'Arriving';
    if (minutes === 1) return 'Live';
    // 5% chance of minor delay
    if (Math.random() < 0.05 && minutes > 3) return 'Delayed';
    return 'Scheduled';
  };

  lines.forEach(line => {
    const isGreen = line === 'Green';
    const directions = isGreen 
      ? [{ dir: 'To MGR Central', plat: 'Platform 1' }, { dir: 'To St. Thomas Mount', plat: 'Platform 2' }]
      : [{ dir: 'To Airport', plat: 'Platform 1' },     { dir: 'To Wimco Nagar', plat: 'Platform 2' }];
      
    // Calculate precise staggered arrivals for each direction
    const lineOffset = isGreen ? 0 : 2;
    trainsByLine[line] = [];

    directions.forEach((d, dirIndex) => {
      // Offset direction mathematically so trains cross correctly
      const directionOffset = (stationHash + lineOffset + (dirIndex * 2)) % INTERVAL;
      const minutesSinceLast = ((minuteOfHour - directionOffset) % INTERVAL + INTERVAL) % INTERVAL;
      
      let nextFromNow = INTERVAL - minutesSinceLast;
      if (nextFromNow === INTERVAL && seconds > 30) {
        nextFromNow = 0; // Train is literally pulling in
      }

      for (let i=0; i<3; i++) {
        const eta = nextFromNow + (i * INTERVAL);
        const tObj = {
          line,
          direction: d.dir,
          platform: d.plat,
          eta,
          status: getStatus(eta)
        };
        activeTrains.push(tObj);
        trainsByLine[line].push(eta);
        next_trains.push(eta);
      }
    });
    // Sort array per line ascending
    trainsByLine[line].sort((a,b) => a - b);
  });

  // Sort overall ascending
  next_trains.sort((a,b) => a - b);
  activeTrains.sort((a,b) => a.eta - b.eta);

  res.json({
    station,
    next_trains: next_trains.slice(0, 3), 
    by_line: trainsByLine,
    active_trains: activeTrains.slice(0, 6), // Give frontend rich objects
    updated_at: now.toISOString()
  });
});

// ─── QUICK ROUTES ───────────────────────────────────────────────────────────

// GET /quick-routes
app.get('/quick-routes', (req, res) => {
  const routes = db.prepare('SELECT * FROM quick_routes ORDER BY use_count DESC, last_used DESC LIMIT 5').all();
  res.json({ routes });
});

// POST /quick-routes
app.post('/quick-routes', (req, res) => {
  const { source, destination, label } = req.body;
  if (!source || !destination) return res.status(400).json({ error: 'source and destination required' });

  const existing = db.prepare('SELECT * FROM quick_routes WHERE source = ? AND destination = ?').get(source, destination);
  if (existing) {
    db.prepare('UPDATE quick_routes SET use_count = use_count + 1, last_used = ? WHERE id = ?')
      .run(new Date().toISOString(), existing.id);
    return res.json({ message: 'Updated', id: existing.id });
  }

  const result = db.prepare(
    'INSERT INTO quick_routes (source, destination, label, last_used) VALUES (?, ?, ?, ?)'
  ).run(source, destination, label || `${source} → ${destination}`, new Date().toISOString());

  res.json({ message: 'Saved', id: result.lastInsertRowid });
});

// DELETE /quick-routes/:id
app.delete('/quick-routes/:id', (req, res) => {
  db.prepare('DELETE FROM quick_routes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── SYSTEM STATUS ──────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  const statuses = ['On Time', 'On Time', 'On Time', 'Slight Delay'];
  const pick = statuses[Math.floor(Date.now() / 300000) % statuses.length];
  res.json({
    status: pick,
    lines: {
      Green: { status: 'On Time', frequency: '5 min' },
      Blue: { status: pick, frequency: '5 min' }
    },
    lastUpdated: new Date().toISOString()
  });
});

// ─── START ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚇 Namma Chennai Metro API running on http://localhost:${PORT}`);
});

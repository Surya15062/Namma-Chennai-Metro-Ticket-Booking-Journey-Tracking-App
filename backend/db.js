const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'metro.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT NOT NULL,
    line TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_interchange INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    route TEXT NOT NULL,
    fare INTEGER NOT NULL,
    travel_time INTEGER NOT NULL,
    qr_data TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quick_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'default',
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    label TEXT,
    use_count INTEGER DEFAULT 1,
    last_used TEXT NOT NULL
  );
`);

// --- Seed Data ---
const METRO_DATA = {
  lines: {
    Green: {
      stations: [
        "Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro", "Egmore", "Nehru Park",
        "Kilpauk", "Pachaiyappa’s College", "Shenoy Nagar", "Anna Nagar East",
        "Anna Nagar Tower", "Thirumangalam", "Koyambedu", "Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro", "Arumbakkam",
        "Vadapalani", "Ashok Nagar", "Ekkattuthangal", "Arignar Anna Alandur Metro", "St. Thomas Mount"
      ]
    },
    Blue: {
      stations: [
        "Wimco Nagar Depot", "Wimco Nagar", "Tiruvottiyur", "Tiruvottiyur Theradi",
        "Kaladipet", "Tollgate", "New Washermenpet", "Tondiarpet", "Sir Theagaraya College",
        "Washermenpet", "Mannadi", "High Court", "Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro",
        "Government Estate", "LIC", "Thousand Lights", "AG-DMS", "Teynampet",
        "Nandanam", "Saidapet", "Little Mount", "Guindy", "Arignar Anna Alandur Metro",
        "Nanganallur Road", "Meenambakkam", "Chennai International Airport"
      ]
    }
  },
  interchanges: ["Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro", "Arignar Anna Alandur Metro"]
};

function seedStations() {
  db.prepare('DELETE FROM stations').run(); // Always reload fresh data

  const insert = db.prepare(
    'INSERT INTO stations (station_name, line, order_index, is_interchange) VALUES (?, ?, ?, ?)'
  );

  const insertAll = db.transaction(() => {
    for (const [line, data] of Object.entries(METRO_DATA.lines)) {
      data.stations.forEach((station, idx) => {
        const isInterchange = METRO_DATA.interchanges.includes(station) ? 1 : 0;
        insert.run(station, line, idx, isInterchange);
      });
    }
  });

  insertAll();
  console.log('✅ Metro stations seeded successfully');
}

seedStations();

module.exports = { db, METRO_DATA };

const { db, METRO_DATA } = require('./db');

/**
 * Route Engine - finds optimal path between two stations
 */

function getStationsOnLine(line) {
  return db.prepare('SELECT * FROM stations WHERE line = ? ORDER BY order_index').all(line);
}

function findStationOnLine(stationName, line) {
  return db.prepare('SELECT * FROM stations WHERE station_name = ? AND line = ?').get(stationName, line);
}

function getStationLines(stationName) {
  return db.prepare('SELECT DISTINCT line FROM stations WHERE station_name = ?').all(stationName).map(r => r.line);
}

function buildSegment(stations, fromOrder, toOrder) {
  if (fromOrder <= toOrder) {
    return stations.filter(s => s.order_index >= fromOrder && s.order_index <= toOrder);
  } else {
    return stations.filter(s => s.order_index >= toOrder && s.order_index <= fromOrder).reverse();
  }
}

function calculateFare(totalStations) {
  if (totalStations <= 3) return 10;
  if (totalStations <= 6) return 20;
  if (totalStations <= 10) return 30;
  if (totalStations <= 15) return 40;
  return 60;
}

function calculateTime(totalStations) {
  // ~3 minutes per station
  return totalStations * 3;
}

function calculateRoute(source, destination) {
  if (source === destination) {
    throw new Error('Source and destination cannot be the same');
  }

  const sourceLines = getStationLines(source);
  const destLines = getStationLines(destination);

  if (!sourceLines.length) throw new Error(`Station not found: ${source}`);
  if (!destLines.length) throw new Error(`Station not found: ${destination}`);

  // Check for direct route (same line)
  const commonLines = sourceLines.filter(l => destLines.includes(l));
  if (commonLines.length > 0) {
    const line = commonLines[0];
    const lineStations = getStationsOnLine(line);
    const srcStation = lineStations.find(s => s.station_name === source);
    const dstStation = lineStations.find(s => s.station_name === destination);
    const segment = buildSegment(lineStations, srcStation.order_index, dstStation.order_index);

    return {
      type: 'direct',
      line,
      stations: segment.map(s => ({ name: s.station_name, line: s.line, isInterchange: s.is_interchange === 1 })),
      totalStations: segment.length,
      fare: calculateFare(segment.length),
      travelTime: calculateTime(segment.length),
      interchange: null,
      segments: [{ line, stations: segment.map(s => s.station_name) }]
    };
  }

  // Need interchange - try Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro then Arignar Anna Alandur Metro
  const interchanges = METRO_DATA.interchanges;
  let bestRoute = null;

  for (const interchange of interchanges) {
    const interchangeLines = getStationLines(interchange);
    const srcLine = sourceLines.find(l => interchangeLines.includes(l));
    const dstLine = destLines.find(l => interchangeLines.includes(l));

    if (!srcLine || !dstLine) continue;

    // Segment 1: source → interchange (on srcLine)
    const lineA = getStationsOnLine(srcLine);
    const srcSt = lineA.find(s => s.station_name === source);
    const intSt1 = lineA.find(s => s.station_name === interchange);
    if (!srcSt || !intSt1) continue;
    const seg1 = buildSegment(lineA, srcSt.order_index, intSt1.order_index);

    // Segment 2: interchange → destination (on dstLine)
    const lineB = getStationsOnLine(dstLine);
    const intSt2 = lineB.find(s => s.station_name === interchange);
    const dstSt = lineB.find(s => s.station_name === destination);
    if (!intSt2 || !dstSt) continue;
    const seg2 = buildSegment(lineB, intSt2.order_index, dstSt.order_index);

    // Combine (avoid duplicate interchange station)
    const combined = [...seg1, ...seg2.slice(1)];
    const total = combined.length;

    if (!bestRoute || total < bestRoute.totalStations) {
      bestRoute = {
        type: 'interchange',
        interchange,
        stations: combined.map(s => ({
          name: s.station_name,
          line: s.line,
          isInterchange: s.station_name === interchange
        })),
        totalStations: total,
        fare: calculateFare(total),
        travelTime: calculateTime(total),
        segments: [
          { line: srcLine, stations: seg1.map(s => s.station_name) },
          { line: dstLine, stations: seg2.map(s => s.station_name) }
        ]
      };
    }
  }

  if (!bestRoute) {
    throw new Error('No route found between the given stations');
  }

  return bestRoute;
}

module.exports = { calculateRoute, calculateFare, calculateTime };

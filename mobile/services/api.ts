import axios from 'axios';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

// ── Configure base URL ────────────────────────────────────────
const getBaseUrl = () => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3001`;
    }
  }
  // Fallback map
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
};

const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ─────────────────────────────────────────────────────
export interface Station {
  id: number;
  station_name: string;
  line: string;
  order_index: number;
  is_interchange: number;
}

export interface RouteStation {
  name: string;
  line: string;
  isInterchange: boolean;
}

export interface RouteSegment {
  line: string;
  stations: string[];
}

export interface RouteResponse {
  type: 'direct' | 'interchange';
  interchange?: string;
  line?: string;
  stations: RouteStation[];
  totalStations: number;
  fare: number;
  travelTime: number;
  segments: RouteSegment[];
}

export interface TicketResponse {
  ticket: {
    id: string;
    source: string;
    destination: string;
    route: string[];
    fare: number;
    travelTime: number;
    passengerName: string;
    issuedAt: string;
    validFor: string;
  };
  route: RouteResponse;
  qr: string;
  fare: number;
  time: number;
}

export interface ActiveTrain {
  line: string;
  direction: string;
  platform: string;
  eta: number;
  status: string;
}

export interface TrainTimingResponse {
  station: string;
  next_trains: number[];
  by_line: Record<string, number[]>;
  active_trains: ActiveTrain[];
  updated_at: string;
}

export interface SystemStatusResponse {
  status: string;
  lines: Record<string, { status: string; frequency: string }>;
  lastUpdated: string;
}

export interface QuickRoute {
  id: number;
  source: string;
  destination: string;
  label: string;
  use_count: number;
  last_used: string;
}

// ── API Functions ─────────────────────────────────────────────
export const getStations = async (line?: string): Promise<Station[]> => {
  const params = line ? { line } : {};
  const { data } = await api.get('/stations', { params });
  return data.stations;
};

export const searchStations = async (q: string): Promise<Station[]> => {
  const { data } = await api.get('/stations/search', { params: { q } });
  return data.stations;
};

export const getRoute = async (
  source: string,
  destination: string
): Promise<RouteResponse> => {
  const { data } = await api.get('/route', { params: { source, destination } });
  return data;
};

export const bookTicket = async (
  source: string,
  destination: string,
  passengerName = 'Traveller'
): Promise<TicketResponse> => {
  const { data } = await api.post('/tickets', { source, destination, passengerName });
  return data;
};

export const getTrainTiming = async (
  station: string
): Promise<TrainTimingResponse> => {
  const { data } = await api.get('/trains/timing', { params: { station } });
  return data;
};

export const getSystemStatus = async (): Promise<SystemStatusResponse> => {
  const { data } = await api.get('/status');
  return data;
};

export const getQuickRoutes = async (): Promise<QuickRoute[]> => {
  const { data } = await api.get('/quick-routes');
  return data.routes;
};

export const saveQuickRoute = async (
  source: string,
  destination: string
): Promise<void> => {
  await api.post('/quick-routes', { source, destination });
};

export const deleteQuickRoute = async (id: number): Promise<void> => {
  await api.delete(`/quick-routes/${id}`);
};

export default api;

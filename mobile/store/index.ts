import { create } from 'zustand';
import {
  RouteResponse,
  TicketResponse,
  QuickRoute,
  SystemStatusResponse,
  getRoute,
  bookTicket,
  getQuickRoutes,
  saveQuickRoute,
  deleteQuickRoute,
  getSystemStatus,
} from '@/services/api';

// ── Types ─────────────────────────────────────────────────────
interface BookingState {
  source: string;
  destination: string;
  route: RouteResponse | null;
  ticket: TicketResponse | null;
  ticketCount: number;
  activeTicket: TicketResponse | null;
  activeTicketCount: number;
  activeTicketBookedAt: number | null;
  isCalculating: boolean;
  isBooking: boolean;
  error: string | null;

  setTicketCount: (count: number) => void;
  setSource: (s: string) => void;
  setDestination: (d: string) => void;
  swapStations: () => void;
  calculateRoute: () => Promise<void>;
  confirmBooking: () => Promise<void>;
  resetBooking: () => void;
  clearActiveTicket: () => void;
  clearError: () => void;
}

interface AppState {
  systemStatus: SystemStatusResponse | null;
  quickRoutes: QuickRoute[];
  isLoadingStatus: boolean;

  fetchSystemStatus: () => Promise<void>;
  fetchQuickRoutes: () => Promise<void>;
  addQuickRoute: (source: string, destination: string) => Promise<void>;
  removeQuickRoute: (id: number) => Promise<void>;
}

// ── Booking Store ─────────────────────────────────────────────
export const useBookingStore = create<BookingState>((set, get) => ({
  source: '',
  destination: '',
  route: null,
  ticket: null,
  ticketCount: 1,
  activeTicket: null,
  activeTicketCount: 1,
  activeTicketBookedAt: null,
  isCalculating: false,
  isBooking: false,
  error: null,

  setTicketCount: (count) => set({ ticketCount: count }),
  setSource: (source) => set({ source, route: null, ticket: null, error: null }),
  setDestination: (destination) => set({ destination, route: null, ticket: null, error: null }),

  swapStations: () => {
    const { source, destination } = get();
    set({ source: destination, destination: source, route: null, ticket: null });
  },

  calculateRoute: async () => {
    const { source, destination } = get();
    if (!source || !destination || source === destination) return;
    set({ isCalculating: true, error: null, route: null });
    try {
      const route = await getRoute(source, destination);
      set({ route, isCalculating: false });
    } catch (e: any) {
      set({
        error: e?.response?.data?.error || 'Could not calculate route',
        isCalculating: false,
      });
    }
  },

  confirmBooking: async () => {
    const { source, destination, ticketCount } = get();
    set({ isBooking: true, error: null });
    try {
      const ticket = await bookTicket(source, destination);
      set({ ticket, activeTicket: ticket, activeTicketCount: ticketCount, activeTicketBookedAt: Date.now(), isBooking: false });
      
      // Save to rides history as Active
      const newRide: any = {
        id: 'ride_' + ticket.ticket.id,
        timestamp: Date.now(),
        fare: ticket.fare * ticketCount,
        passengers: ticketCount,
        source: source,
        destination: destination,
        line: ticket.route?.type === 'interchange' ? 'Interchange' : (ticket.route?.line || 'Blue Line'),
        status: 'Active',
        durationMin: ticket.time,
        distanceKm: (ticket.route?.totalStations || 0) * 1.5,
        ticketId: ticket.ticket.id,
        paymentMethod: 'Wallet',
        entryGate: 'Gate A', exitGate: '—', rating: null,
      };
      // We will cast to any to bypass the tight union check temporarily here.
      useRidesStore.getState().addRide(newRide);

      await saveQuickRoute(source, destination).catch(() => {});
    } catch (e: any) {
      set({
        error: e?.response?.data?.error || 'Booking failed. Try again.',
        isBooking: false,
      });
    }
  },

  resetBooking: () =>
    set({ source: '', destination: '', route: null, ticket: null, ticketCount: 1, error: null }),

  clearActiveTicket: () => set({ activeTicket: null, activeTicketCount: 1, activeTicketBookedAt: null }),

  clearError: () => set({ error: null }),
}));

// ── App Store ─────────────────────────────────────────────────
export const useAppStore = create<AppState>((set) => ({
  systemStatus: null,
  quickRoutes: [],
  isLoadingStatus: false,

  fetchSystemStatus: async () => {
    set({ isLoadingStatus: true });
    try {
      const status = await getSystemStatus();
      set({ systemStatus: status, isLoadingStatus: false });
    } catch {
      set({ isLoadingStatus: false });
    }
  },

  fetchQuickRoutes: async () => {
    try {
      const routes = await getQuickRoutes();
      set({ quickRoutes: routes });
    } catch {}
  },

  addQuickRoute: async (source, destination) => {
    await saveQuickRoute(source, destination);
    const routes = await getQuickRoutes();
    set({ quickRoutes: routes });
  },

  removeQuickRoute: async (id) => {
    await deleteQuickRoute(id);
    set((state) => ({
      quickRoutes: state.quickRoutes.filter((r) => r.id !== id),
    }));
  },
}));

// ── User Store ────────────────────────────────────────────────
interface UserState {
  user: {
    name: string;
    age: string;
    email?: string;
    phone?: string;
    avatar?: string;
  } | null;
  theme: 'dark' | 'light';
  isDark: boolean;

  setUser: (name: string, age: string) => void;
  updateUser: (data: Partial<UserState['user']>) => void;
  clearUser: () => void;
  toggleTheme: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  theme: 'light',
  isDark: false,

  setUser: (name, age) => set({ user: { name, age } }),
  
  updateUser: (data) => set((state) => ({ 
    user: state.user ? { ...state.user, ...data } : null 
  })),

  clearUser: () => set({ user: null }),

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    return { theme: newTheme, isDark: newTheme === 'dark' };
  }),
}));

// ── Transit Preferences Store ─────────────────────────────────
export type MetroLine = 'Blue Line' | 'Green Line' | 'Both Lines';
export type RoutePriority = 'Fastest Route' | 'Least Interchange' | 'Less Walking' | 'Cheapest Fare';
export type CoachPreference = 'Front Coach' | 'Middle Coach' | 'Rear Coach' | 'No Preference';

interface TransitPrefsState {
  preferredLine: MetroLine;
  homeStation: string;
  workStation: string;
  routePriority: RoutePriority;
  coachPreference: CoachPreference;
  wheelchairFriendly: boolean;
  liftEscalatorPreferred: boolean;
  seniorCitizenFriendly: boolean;
  peakHourAlerts: boolean;
  rememberLastJourney: boolean;

  setPreferredLine: (line: MetroLine) => void;
  setHomeStation: (station: string) => void;
  setWorkStation: (station: string) => void;
  setRoutePriority: (priority: RoutePriority) => void;
  setCoachPreference: (coach: CoachPreference) => void;
  toggleWheelchair: () => void;
  toggleLiftEscalator: () => void;
  toggleSeniorCitizen: () => void;
  togglePeakHourAlerts: () => void;
  toggleRememberLastJourney: () => void;
  resetTransitPrefs: () => void;
}

const defaultTransitPrefs = {
  preferredLine: 'Both Lines' as MetroLine,
  homeStation: '',
  workStation: '',
  routePriority: 'Fastest Route' as RoutePriority,
  coachPreference: 'No Preference' as CoachPreference,
  wheelchairFriendly: false,
  liftEscalatorPreferred: false,
  seniorCitizenFriendly: false,
  peakHourAlerts: true,
  rememberLastJourney: true,
};

export const useTransitStore = create<TransitPrefsState>((set) => ({
  ...defaultTransitPrefs,

  setPreferredLine: (preferredLine) => set({ preferredLine }),
  setHomeStation: (homeStation) => set({ homeStation }),
  setWorkStation: (workStation) => set({ workStation }),
  setRoutePriority: (routePriority) => set({ routePriority }),
  setCoachPreference: (coachPreference) => set({ coachPreference }),
  toggleWheelchair: () => set((s) => ({ wheelchairFriendly: !s.wheelchairFriendly })),
  toggleLiftEscalator: () => set((s) => ({ liftEscalatorPreferred: !s.liftEscalatorPreferred })),
  toggleSeniorCitizen: () => set((s) => ({ seniorCitizenFriendly: !s.seniorCitizenFriendly })),
  togglePeakHourAlerts: () => set((s) => ({ peakHourAlerts: !s.peakHourAlerts })),
  toggleRememberLastJourney: () => set((s) => ({ rememberLastJourney: !s.rememberLastJourney })),
  resetTransitPrefs: () => set({ ...defaultTransitPrefs }),
}));

// ── App Language Store ────────────────────────────────────────
export type AppLanguage = 'English' | 'Tamil' | 'Malayalam' | 'Telugu' | 'Kannada';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'English',
  setLanguage: (language) => set({ language }),
}));

// ── Payment Management Store ──────────────────────────────────
export type UpiProvider = 'Google Pay' | 'PhonePe' | 'Paytm' | 'Other UPI';

export interface SavedUpiId {
  id: string;
  provider: UpiProvider;
  upiId: string;
  isDefault: boolean;
}

export interface SavedBankAccount {
  id: string;
  bankName: string;
  accountLast4: string;
  ifsc: string;
  isDefault: boolean;
}

interface PaymentState {
  savedUpiIds: SavedUpiId[];
  savedBankAccounts: SavedBankAccount[];
  defaultPaymentId: string | null;

  addUpiId: (provider: UpiProvider, upiId: string) => void;
  removeUpiId: (id: string) => void;
  setDefaultPayment: (id: string) => void;
  addBankAccount: (bankName: string, accountLast4: string, ifsc: string) => void;
  removeBankAccount: (id: string) => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  savedUpiIds: [
    { id: 'gpay_default', provider: 'Google Pay', upiId: 'user@okicici', isDefault: true },
  ],
  savedBankAccounts: [],
  defaultPaymentId: 'gpay_default',

  addUpiId: (provider, upiId) => {
    const newEntry: SavedUpiId = {
      id: `upi_${Date.now()}`,
      provider,
      upiId,
      isDefault: get().savedUpiIds.length === 0,
    };
    set((s) => ({ savedUpiIds: [...s.savedUpiIds, newEntry] }));
  },

  removeUpiId: (id) => {
    set((s) => {
      const filtered = s.savedUpiIds.filter((u) => u.id !== id);
      const newDefault = filtered.length > 0 ? filtered[0].id : null;
      return {
        savedUpiIds: filtered.map((u, i) => ({ ...u, isDefault: i === 0 && s.defaultPaymentId === id })),
        defaultPaymentId: s.defaultPaymentId === id ? newDefault : s.defaultPaymentId,
      };
    });
  },

  setDefaultPayment: (id) => {
    set((s) => ({
      defaultPaymentId: id,
      savedUpiIds: s.savedUpiIds.map((u) => ({ ...u, isDefault: u.id === id })),
      savedBankAccounts: s.savedBankAccounts.map((b) => ({ ...b, isDefault: b.id === id })),
    }));
  },

  addBankAccount: (bankName, accountLast4, ifsc) => {
    const newEntry: SavedBankAccount = {
      id: `bank_${Date.now()}`,
      bankName,
      accountLast4,
      ifsc,
      isDefault: get().savedBankAccounts.length === 0 && get().savedUpiIds.length === 0,
    };
    set((s) => ({ savedBankAccounts: [...s.savedBankAccounts, newEntry] }));
  },

  removeBankAccount: (id) => {
    set((s) => ({ savedBankAccounts: s.savedBankAccounts.filter((b) => b.id !== id) }));
  },
}));

// ── Rides History Store ───────────────────────────────────────
export type RideStatus = 'Completed' | 'Active' | 'Cancelled';
export type MetroLineColor = 'Blue Line' | 'Green Line' | 'Interchange' | 'Both Lines';

export interface RideRecord {
  id: string;
  timestamp: number;          // Unix ms
  fare: number;
  passengers: number;
  source: string;
  destination: string;
  line: MetroLineColor;
  status: RideStatus;
  durationMin: number;
  distanceKm: number;
  ticketId: string;
  paymentMethod: string;
  entryGate: string;
  exitGate: string;
  rating: number | null;      // 1-5, null = unrated
}

interface RidesState {
  rides: RideRecord[];
  setRating: (id: string, rating: number) => void;
  addRide: (ride: RideRecord) => void;
  clearRides: () => void;
}

const MOCK_RIDES: RideRecord[] = [
  {
    id: 'ride_001',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,   // Yesterday
    fare: 60,
    passengers: 1,
    source: 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro',
    destination: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro',
    line: 'Blue Line',
    status: 'Completed',
    durationMin: 28,
    distanceKm: 12.4,
    ticketId: 'MTC-BL-20240421-001',
    paymentMethod: 'Google Pay',
    entryGate: 'Gate A',
    exitGate: 'Gate C',
    rating: 5,
  },
  {
    id: 'ride_002',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    fare: 35,
    passengers: 1,
    source: 'Vadapalani',
    destination: 'Arignar Anna Alandur Metro',
    line: 'Green Line',
    status: 'Completed',
    durationMin: 18,
    distanceKm: 6.8,
    ticketId: 'MTC-GL-20240420-002',
    paymentMethod: 'PhonePe',
    entryGate: 'Gate B',
    exitGate: 'Gate A',
    rating: 4,
  },
  {
    id: 'ride_003',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    fare: 20,
    passengers: 2,
    source: 'Koyambedu',
    destination: 'Anna Nagar Tower',
    line: 'Blue Line',
    status: 'Completed',
    durationMin: 8,
    distanceKm: 2.9,
    ticketId: 'MTC-BL-20240419-003',
    paymentMethod: 'Google Pay',
    entryGate: 'Gate A',
    exitGate: 'Gate B',
    rating: null,
  },
  {
    id: 'ride_004',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    fare: 50,
    passengers: 1,
    source: 'Chennai International Airport',
    destination: 'Arignar Anna Alandur Metro',
    line: 'Green Line',
    status: 'Completed',
    durationMin: 22,
    distanceKm: 9.6,
    ticketId: 'MTC-GL-20240417-004',
    paymentMethod: 'Paytm',
    entryGate: 'Gate C',
    exitGate: 'Gate A',
    rating: 5,
  },
  {
    id: 'ride_005',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    fare: 41,
    passengers: 1,
    source: 'Washermanpet',
    destination: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro',
    line: 'Blue Line',
    status: 'Cancelled',
    durationMin: 0,
    distanceKm: 0,
    ticketId: 'MTC-BL-20240415-005',
    paymentMethod: 'Google Pay',
    entryGate: 'Gate A',
    exitGate: '—',
    rating: null,
  },
  {
    id: 'ride_006',
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    fare: 30,
    passengers: 3,
    source: 'Guindy',
    destination: 'Vadapalani',
    line: 'Green Line',
    status: 'Completed',
    durationMin: 14,
    distanceKm: 5.2,
    ticketId: 'MTC-GL-20240412-006',
    paymentMethod: 'PhonePe',
    entryGate: 'Gate B',
    exitGate: 'Gate A',
    rating: 3,
  },
  {
    id: 'ride_007',
    timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
    fare: 70,
    passengers: 1,
    source: 'Thirumangalam',
    destination: 'Chennai International Airport',
    line: 'Blue Line',
    status: 'Completed',
    durationMin: 38,
    distanceKm: 17.1,
    ticketId: 'MTC-BL-20240408-007',
    paymentMethod: 'Google Pay',
    entryGate: 'Gate A',
    exitGate: 'Gate D',
    rating: 4,
  },
];
export const useRidesStore = create<RidesState>((set) => ({
  rides: [],

  setRating: (id, rating) =>
    set((s) => ({
      rides: s.rides.map((r) => (r.id === id ? { ...r, rating } : r)),
    })),

  addRide: (ride) =>
    set((s) => ({ rides: [ride, ...s.rides] })),

  clearRides: () => set({ rides: [] }),
}));

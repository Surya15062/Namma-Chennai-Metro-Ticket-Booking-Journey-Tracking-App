
<p align="center">
  <img src="assets/Namma Chennai Metro.png" alt="Namma Chennai Metro" width="100%">
</p>

<h1 align="center">🚇 Namma Chennai Metro</h1>
<p align="center"><em>Ticket Booking & Journey Tracking — Concept App</em></p>
<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_54-20232A?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-v16+-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/Platform-Android_|_iOS-lightgrey?style=flat-square" />
</p>
 
🚇 Namma Chennai Metro is a concept-based mobile application built to enhance the metro travel experience by combining QR ticketing, route planning, nearest station assistance, metro network navigation, and journey tracking into one intuitive platform.
 
---

# ✨ Features

### 🗺️ Smart Route Planner

Calculates the **fastest route** between any two metro stations across the Green and Blue lines, including automatic **interchange detection** at key junction stations (Central Metro & Alandur Metro).

### 🎫 QR Ticket Booking

Generate **digital metro tickets** with a unique QR code for each booking. Tickets are valid for **3 hours** from the time of issue and support **multi-passenger** bookings.

### ⏱️ Live Train Timing

View **real-time train arrival schedules** at any station, with per-platform, per-direction breakdowns and live status indicators (`Arriving`, `Live`, `Delayed`, `Scheduled`).

### 📍 Nearest Station Detection

Uses GPS to detect the **nearest metro station** and surface **hotspot suggestions** for nearby landmarks and attractions.

### 🔖 Quick Routes

Save frequently used journeys as **Quick Routes** for one-tap re-booking — tracked by usage count and last used timestamp.

### 🌓 Dark & Light Mode

Fully adaptive **dual-theme UI** with a premium design system — switches automatically based on user preference.

### 📱 Modern Mobile Application

Built with **React Native (Expo)** for a fluid, native-feeling mobile experience on both Android and iOS.

---

# 🛠️ Technology Stack

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js (v5) | REST API server |
| better-sqlite3 | Embedded SQLite database |
| QRCode | QR code generation |
| UUID | Unique ticket ID generation |
| dotenv | Environment variable management |
| CORS | Cross-origin request support |

## Mobile Application

| Technology | Purpose |
|---|---|
| React Native (Expo ~54) | Cross-platform mobile framework |
| Expo Router | File-based navigation |
| Zustand | Lightweight global state management |
| Axios | HTTP client for API calls |
| Expo Location | GPS and geocoding |
| Expo Linear Gradient | Premium gradient UI |
| Expo Blur | Glassmorphism effects |
| react-native-qrcode-svg | QR code rendering |
| Poppins (Google Fonts) | Typography |

---

# 📂 Project Structure

```
Metro/
│
├── backend/
│   ├── db.js                  # SQLite database setup, schema & station seed data
│   ├── routeEngine.js         # Shortest-path route calculation with interchange logic
│   ├── server.js              # Express REST API (stations, routes, tickets, timing)
│   ├── metro.db               # SQLite database file
│   └── package.json
│
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx      # Home screen (nearest station, active ticket, quick routes)
│   │   │   ├── book.tsx       # Ticket booking screen
│   │   │   ├── map.tsx        # Metro map screen
│   │   │   └── timing.tsx     # Train timing screen
│   │   ├── account.tsx        # Account & settings screen
│   │   ├── booking/           # Booking flow screens
│   │   ├── my-rides.tsx       # Ride history screen
│   │   ├── onboarding.tsx     # App onboarding
│   │   ├── payment-management.tsx  # Payment methods
│   │   ├── profile.tsx        # User profile screen
│   │   ├── ride-details.tsx   # Trip details screen
│   │   └── transit-preferences.tsx # User transit preferences
│   │
│   ├── components/
│   │   ├── TrainTimingCard.tsx  # Live train timing display component
│   │   ├── StationPicker.tsx    # Station search & selection component
│   │   ├── RouteTrack.tsx       # Visual route path renderer
│   │   ├── Badge.tsx            # Status badge component
│   │   ├── Button.tsx           # Reusable button component
│   │   └── UI.tsx               # Core UI primitives (Card, Divider, Skeleton, etc.)
│   │
│   ├── constants/               # Theme tokens (colors, spacing, radius, shadows)
│   ├── services/
│   │   └── api.ts               # Axios API service layer
│   ├── store/
│   │   └── index.ts             # Zustand stores (app, user, booking state)
│   └── package.json
│
└── README.md
```

---

# 🚇 Metro Network Coverage

The app covers the full operational **Chennai Metro Rail Phase 1** network:

| Line | Terminals | Stations |
|---|---|---|
| 🟢 Green Line | MGR Central Metro ↔ St. Thomas Mount | 17 stations |
| 🔵 Blue Line | Wimco Nagar Depot ↔ Chennai Airport | 26 stations |

**Interchange Stations** (transfer between lines):
- 🔄 Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro
- 🔄 Arignar Anna Alandur Metro

---

# 🚀 Getting Started

## 1️⃣ Prerequisites

Make sure you have installed:

* Node.js (v16+)
* Expo CLI
* A physical device with **Expo Go** app, or an Android/iOS emulator

Install Expo CLI globally:

```bash
npm install -g expo-cli
```

---

## ⚙️ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file (optional — defaults are used if not present):

```env
PORT=3001
```

Start the backend server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

> **Note:** The SQLite database (`metro.db`) and all tables are created and seeded automatically on first run — no manual database setup is required.

---

## 📱 Mobile App Setup

Open a new terminal and navigate to the mobile folder:

```bash
cd mobile
```

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
expo start
```

Run the app using:

* **Expo Go** (Android / iOS) — scan the QR code in the terminal
* **Android Emulator** — press `a` in the Expo CLI
* **iOS Simulator** — press `i` in the Expo CLI

> **Note:** Make sure your mobile device and development machine are on the **same Wi-Fi network** for Expo Go to work correctly.

---

# 📊 Application Screens

| Screen | Description |
|---|---|
| **Home** | Live nearest station timing, active QR ticket, system status, and quick routes |
| **Book** | Route planner — select source & destination, view fare, travel time, and book tickets |
| **Map** | Interactive Chennai Metro network map |
| **Timing** | Real-time train arrivals for any station |
| **My Rides** | Full journey and ticket history |
| **Profile** | User information and avatar |
| **Account** | App settings, preferences, language |
| **Transit Preferences** | Personalized commute preferences |
| **Payment Management** | Manage payment methods |

---

# 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stations` | Fetch all stations (optionally filter by `?line=Green`) |
| `GET` | `/stations/search?q=` | Search stations by name |
| `GET` | `/route?source=A&destination=B` | Calculate optimal route between two stations |
| `POST` | `/tickets` | Book a new ticket and generate QR code |
| `GET` | `/tickets/:id` | Fetch a ticket by ID |
| `GET` | `/trains/timing?station=Guindy` | Get real-time train arrival schedule |
| `GET` | `/quick-routes` | List saved quick routes |
| `POST` | `/quick-routes` | Save a new quick route |
| `DELETE` | `/quick-routes/:id` | Delete a saved quick route |
| `GET` | `/status` | Get overall system status for all lines |

---

# 💰 Fare Structure

| Stations Travelled | Fare |
|---|---|
| 1 – 3 stations | ₹10 |
| 4 – 6 stations | ₹20 |
| 7 – 10 stations | ₹30 |
| 11 – 15 stations | ₹40 |
| 16+ stations | ₹60 |

---

# 🔒 Environment & Security

This project uses `.env` files to manage sensitive configuration. These are never committed to Git.

* **Backend:** Create `backend/.env` with your environment variables (e.g., `PORT`).
* **Mobile:** The API base URL is configured in `mobile/services/api.ts`.

Refer to `.gitignore` for files excluded from version control.

---

# 📝 Note

Some development errors were resolved and the overall code structure was improved with the assistance of **Antigravity AI**.

---

# 📬 Connect with Me

🐙 GitHub: https://github.com/Surya15062  
💼 LinkedIn: https://linkedin.com/in/s-surya-6b9b6329b

---

⭐ If you found this project useful, consider giving it a star on GitHub.

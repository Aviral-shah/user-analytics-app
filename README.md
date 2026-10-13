# 📊 Simple User Analytics Application

An end-to-end user analytics and session tracking platform built for the **Full Stack Engineer** assignment. It tracks client-side user interactions (`page_view`, `click` with coordinates), stores structured event records in **MongoDB**, and visualizes user sessions and click heatmaps through a **React** dashboard.

---

## 🛠 Tech Stack

- **Client Tracking Script (SDK):** Vanilla JavaScript (lightweight, zero-dependency, works with `sendBeacon` & `fetch` fallback).
- **Backend API:** Node.js, Express.js.
- **Database:** MongoDB & Mongoose.
- **Frontend Dashboard:** React, Vite, Lucide Icons, CSS3.

---

## 📁 Repository Structure

```text
user-analytics-app/
│
├── tracker/
│   ├── tracker.js         # Embeddable tracking script (page_view & clicks with X,Y)
│   └── demo.html          # Sample e-commerce store to test real interactions
│
├── server/
│   ├── server.js          # Express app with REST endpoints & static hosting
│   ├── models/
│   │   └── Event.js       # Mongoose Schema with indexes
│   ├── .env               # Port & MongoDB connection configuration
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.jsx        # Sessions list, Journey timeline, & Heatmap views
│   │   ├── index.css      # Modern dashboard styling
│   │   └── services/
│   │       └── api.js     # API client functions
│   └── package.json
│
└── README.md              # Setup instructions, architecture & trade-offs
```

---

## 🚀 Setup & Installation Steps

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

---

### 2. Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify or update the `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/analytics_db
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server runs on `http://localhost:5000` and also serves the demo page at `http://localhost:5000/tracker/demo.html`.*

---

### 3. Frontend Dashboard Setup
1. In a new terminal window, navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the dashboard in your browser:
   ```text
   http://localhost:5173 (or http://localhost:3000)
   ```

---

## 🧪 Testing the Event Tracking & Flow

1. Open the **Demo Webpage**: [http://localhost:5000/tracker/demo.html](http://localhost:5000/tracker/demo.html).
2. A `page_view` event is immediately recorded for your unique session.
3. Click around the page (buttons, cards, banners). Each click records:
   - `x`, `y` coordinates
   - Clicked element tag name, id, and text snippet
   - Precise ISO timestamp
4. Switch to your **Dashboard**:
   - **Sessions View**: Click any session ID to view the step-by-step chronological user journey timeline.
   - **Heatmap View**: Select the URL to view a visual overlay with radial glow markers showing where users clicked.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Ingests a new event (`page_view` or `click`) |
| `GET` | `/api/sessions` | Aggregates all sessions with total event counts and session duration |
| `GET` | `/api/sessions/:sessionId/events` | Retrieves the chronological journey for a single session |
| `GET` | `/api/heatmap?url=...` | Returns click coordinates and element metadata for a target URL |
| `GET` | `/api/health` | Server health check endpoint |

---

## 🧠 Assumptions & Trade-offs

1. **Session Persistence:**
   - **Choice:** Sessions are stored in `localStorage` with a fallback cookie.
   - **Reasoning:** Ensures continuity across tabs and page refreshes while remaining resilient even if storage permissions vary.
2. **Event Delivery Mechanism:**
   - **Choice:** `navigator.sendBeacon()` with a `fetch()` fallback.
   - **Reasoning:** `sendBeacon` ensures asynchronous, non-blocking delivery that guarantees events reach the server even if the user immediately closes or navigates away from the tab.
3. **Heatmap Coordinates:**
   - **Choice:** Coordinates are captured via `pageX` and `pageY`, and screen viewport width/height are attached to each payload.
   - **Trade-off:** In production with responsive sites, normalizing coordinates to percentages of viewport width/height or element relative offsets ensures heatmaps remain aligned across varying screen sizes.
4. **Data Aggregation:**
   - **Choice:** MongoDB aggregation pipeline on `sessionId`.
   - **Indexing:** Indexes are created on `sessionId`, `eventType`, `url`, and `timestamp` to ensure fast query responses under high event volumes.

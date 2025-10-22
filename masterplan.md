# Smart Adaptive Plant Care — Masterplan

**Project:** Smart Adaptive Plant Care

**Subtitle:** Cloud-connected Raspberry Pi + hosted YOLO detection + Next.js dashboard

**Audience:** Home hobbyists & classroom demos

**Tone:** Developer-friendly CTO guidance — practical, focused, and ready to use as a blueprint.

---

# 1 — Overview & Objectives

Build a demo-ready, cloud-hosted web application that visualizes sensor telemetry from a single Raspberry Pi plant station, performs hosted-YOLO plant detection, and adapts local automatic watering thresholds based on the identified species.

**Primary objectives**
- Quick-to-demo public web dashboard (no user login) showing live telemetry and historical charts.
- Safety-first remote control: server-side rate-limited “Water Now” control with max runtime and cooldown.
- Smart behavior: backend uses a hosted YOLO inference API to identify plant species from Pi-captured images and returns ideal thresholds.
- Local autonomy: Raspberry Pi runs automatic watering logic locally using thresholds from the backend and logs all events to the cloud for visualization.
- Single full-stack repo approach: Next.js for UI + backend API routes, PostgreSQL as the canonical data store.

---

# 2 — Target Audience

**Primary users**
- Home hobbyists / urban gardeners — single-station, simple UX.
- Educational / classroom demos — reproducible, instructive, and tactile.

**Constraints for this project**
- Single Raspberry Pi station.
- Public demo site (no user accounts).
- Demo must be robust and easy to present offline/online.

---

# 3 — Core Features & Functionality

**MVP features**
- Raspberry Pi samples sensors (soil moisture, temperature, humidity, light) every 15s and posts telemetry to backend.
- Pi captures a plant image periodically and uploads it to backend.
- Backend forwards images to a hosted YOLO inference API (Roboflow / Ultralytics).
- Backend determines dominant detection, looks up plant thresholds in DB, and returns thresholds to Pi.
- Pi applies thresholds locally for automatic watering and logs auto/manual watering events to the cloud.
- Public Next.js dashboard displays: live gauge cards, annotated image + label + confidence, history charts, alerts (toasts), and a rate-limited “Water Now” control.
- Storage & retention: raw readings for 30 days; hourly aggregated data retained for 12 months.
- Basic in-app alerts (visual toasts/badges/sounds) for threshold violations.

**Phase-2 / Nice-to-have (future)**
- Annotated images with bounding boxes on dashboard.
- Optional email or Slack alerts.
- On-device edge model fallback.
- Multi-device & role-based access.

---

# 4 — High-Level Technical Stack (recommended)

**Frontend & backend**
- **Next.js (App Router)** — single repo for UI and API routes.

**Database & storage**
- **PostgreSQL** — canonical structured store for readings, events, detections, thresholds.
- **Object storage** (S3 / DigitalOcean Spaces / Supabase Storage) — store images and serve via signed URLs.

**Realtime**
- Preferred: **managed WebSocket provider** (Pusher / Ably) or a lightweight WebSocket server if hosting persistently.
- Alternative: **Server-Sent Events (SSE)** for one-way push from backend to dashboard.

**YOLO inference**
- **Hosted YOLO API** (Roboflow, Ultralytics, etc.) — backend calls provider using API key; backend maps results to plant thresholds.

**Device-to-cloud**
- Raspberry Pi → HTTPS POST to backend endpoints for telemetry and images.
- Pi polls backend or subscribes to a command channel for control instructions.

**Deployment & hosting**
- **Vercel** for Next.js (frontend and serverless API routes).
- Managed PostgreSQL provider (Supabase / Neon / Render / ElephantSQL).
- Object storage provider (S3-compatible).

**Why this stack?**
- Single codebase with Next.js reduces cognitive load and speeds iteration.
- PostgreSQL gives structured, queryable storage for analytics and joins.
- Hosted YOLO avoids GPU management during the course demo.

---

# 5 — Backend Architecture & API Endpoints

## Conceptual flow
1. Pi → POST telemetry to `/api/telemetry`.
2. Pi → POST image to `/api/image`.
3. Backend stores image in object storage → calls YOLO provider → stores detection(s).
4. Backend determines dominant plant → looks up thresholds → returns thresholds to Pi.
5. Dashboard subscribes to realtime events to receive telemetry, detections, and control events.
6. Dashboard triggers control via `/api/control/water`. Backend enforces safety (rate limits, max duration) and either queues command for Pi or returns success/failure.

## Required HTTP endpoints (high level descriptions)
- **POST /api/telemetry**
  - Purpose: receive sensor readings from device.
  - Expected payload: device id, timestamp, sensor values (soil_pct, temperature_c, humidity_pct, lux).
  - Behavior: validate → insert into `readings` → emit realtime event.

- **POST /api/image**
  - Purpose: receive a camera image from device.
  - Expected payload: device id, timestamp, image file (multipart or base64).
  - Behavior: upload to object storage → call hosted YOLO API → receive detections → insert `images` + `detections` → determine dominant label → map to thresholds → emit realtime event → respond with `{ plant_label, confidence, thresholds }`.

- **GET /api/latest**
  - Purpose: return latest readings, last detection, and device status for initial page load.

- **GET /api/history?sensor=<>&from=<>&to=<>**
  - Purpose: return raw or aggregated historic data per sensor; supports aggregation param (raw/hourly).

- **GET /api/events?limit=&type=**
  - Purpose: retrieve watering events, detections, errors or system logs.

- **POST /api/control/water**
  - Purpose: request manual watering.
  - Expected payload: device id, optional duration.
  - Behavior: enforce server-side safety (cooldown, max_duration, rate limits) → log attempt → if allowed queue/notify Pi → return success/fail + next allowed timestamp.

- **GET /api/plant-types**
  - Purpose: return known plant types and their threshold metadata for UI display and editing.

- **GET /api/commands?device_id=...** (if Pi polls for commands)
  - Purpose: device polls for pending commands (e.g., water commands). Backend returns queued commands.

- **(Optional) /ws** or SSE stream endpoint
  - Purpose: realtime channel for telemetry, detection events, control logs to the dashboard.

## Safety & rate-limiting rules (apply to control)
- Example defaults (configurable):
  - max_duration_per_activation = 10 seconds
  - cooldown_between_activations = 15 minutes
  - max_activations_per_hour = 2
- Backend logs both successful and denied attempts (timestamp, IP, initiator).

---

# 6 — Recommended File / Repo Structure

A practical Next.js project layout (single repo):


**Notes**
- If you use Vercel serverless functions, long-lived WebSocket servers are better hosted separately or use a managed realtime provider (Pusher/Ably). SSE can work well for one-way updates on serverless.
- `services/yoloService` should encapsulate calling the YOLO provider, handling retries, and caching results to avoid quota overuse.

---

# 7 — Frontend: Page-by-Page Breakdown (with single-line prompts usable as UI generator inputs)

> Each page described with purpose, main components, required data, and a one-line prompt you can paste into an AI UI tool.

## 7.1 Dashboard (Home)
**Purpose:** Live view of station — gauges, latest photo + detection, quick manual control, and sparkline history.

**Main components**
- Header with project name and device status LED (green/orange/red).
- Animated gauge cards: soil, temperature, humidity, light.
- Camera card: latest annotated photo with plant label + confidence.
- Control panel: large glowing “Water Now” button with cooldown overlay and manual duration.
- Alerts area: toasts and banner for threshold breaches.
- Mini charts: last 1 hour sparkline for each sensor.

**Required data**
- GET /api/latest for initial load; realtime stream for updates.
- /api/plant-types for thresholds.

**AI prompt (one-liner)**
> "Design a dark-tech IoT dashboard: left column animated gauge cards (soil/temp/humidity/light), center large annotated camera image with plant label & confidence, right column glowing 'Water Now' button showing cooldown, top alerts banner — style: dark background, neon glows, clear spacing."

---

## 7.2 Plant Details / Detection History
**Purpose:** Explore annotated images and detection timeline, and view plant-specific ideal ranges.

**Main components**
- Gallery of captured images with bounding boxes (click to expand).
- Detection timeline: timestamp, label, confidence, linked sensor snapshot.
- Threshold comparison widget: ideal vs current values, color-coded.

**Required data**
- /api/events (detection type), /api/history for sensor snapshot per timestamp.

**AI prompt**
> "Design a dark panel plant-detail page with a gallery of annotated images, a timeline of detection events, and a concise 'ideal vs current' metric card for each sensor."

---

## 7.3 History & Analytics
**Purpose:** Inspect historical data and aggregated trends (hourly/day).

**Main components**
- Date-range selector and aggregation toggle (raw / hourly).
- Multi-sensor line charts with zoom, hover tooltips, and export option.
- Summary stats (min/avg/max) for selected range.

**Required data**
- GET /api/history?sensor=&from=&to=&agg=hourly

**AI prompt**
> "Design a dark analytics page with date-range selector and multi-sensor line charts for soil/temp/humidity/light; include hourly aggregation toggle and clear tooltips."

---

## 7.4 Events & Logs
**Purpose:** Browse watering events, detections, and system errors.

**Main components**
- Filterable event table (AUTO / MANUAL / DETECTION / SYSTEM).
- Click event to open detail panel showing sensor snapshot and annotated image.

**Required data**
- GET /api/events

**AI prompt**
> "Design a minimalist dark log viewer with a filterable event table and concise event cards for a plant IoT app."

---

## 7.5 Settings / Thresholds (Admin)
**Purpose:** Add/edit plant types and their ideal ranges (optional for public demo; useful to seed DB).

**Main components**
- Form to add/edit plant name, thresholds (soil_min/max, temp_min/max, etc.), sample images, and notes.
- Quick import from CSV or JSON for seed data.

**Required data**
- GET/POST /api/plant-types

**AI prompt**
> "Design a simple admin settings page to add/edit plant types and their ideal ranges; dark theme, clean form layout."

---

# 8 — Conceptual Data Model (PostgreSQL)

Core tables and key fields (descriptive; implement with Prisma or SQL)

- `devices`
  - id (uuid), name, location, last_seen, status

- `readings`
  - id, device_id, timestamp, soil_pct, temperature_c, humidity_pct, lux, raw_payload (json)

- `images`
  - id, device_id, timestamp, image_url, width, height, metadata (json)

- `detections`
  - id, image_id, label, confidence, bbox (json), dominant (bool)

- `plant_types`
  - id, name, thresholds (json: soil_min, soil_max, temp_min, temp_max, humidity_min, humidity_max, light_min, light_max), notes

- `control_logs`
  - id, device_id, timestamp, type (manual|auto), duration_seconds, status (started|stopped|denied), source_ip, initiator

- `alerts`
  - id, device_id, timestamp, type, level, message, resolved

- `aggregates_hourly`
  - id, device_id, hour_start, avg_soil, avg_temp, avg_humidity, avg_lux

**Indexes & retention**
- Index on readings(device_id, timestamp) and images(device_id, timestamp).
- Raw `readings` TTL: delete entries older than 30 days (or archive).
- Aggregates retained for 12 months.

---

# 9 — UI / UX Design Principles (Dark, Techy IoT)

**Visual guidelines**
- Palette: deep charcoal background with neon accents (teal/green for healthy, amber for warnings, red for errors).
- Use subtle glow on active indicators and animated gauge needles — avoid overusing glow to prevent clutter.
- Typography: clear hierarchy, generous spacing, and large readable numbers for key metrics.
- Microcopy: show recommended ranges alongside current values (e.g., "Soil: 28% — ideal 30–45%").
- Water Now action: visually prominent but guarded with immediate feedback (toast + cooldown message).
- Accessibility: ensure color contrast, keyboard navigability, and alt text for images.

---

# 10 — Security & Safety Considerations

Because the dashboard is public, implement minimum safeguards:

**API & control safety**
- Enforce server-side rate limits and cooldown for `/api/control/water`.
- Implement max duration per activation (e.g., 10s) and max activations per hour.
- Log all control attempts (success & denied) with timestamp and source IP.

**Input validation & storage**
- Validate and sanitize telemetry & image payloads; reject malformed submissions.
- Limit image upload size and image rate to avoid provider quota abuse.

**CORS & access**
- Restrict accepted origins to your deployed domain(s).
- Serve images via signed URLs (short expiry) to prevent direct storage exposure.

**Device security**
- Store device token securely on Pi (file permission restrictions).
- Minimize exposed services on Pi; disable unnecessary open ports for demo.
- Keep auto-updates off for demo stability.

**YOLO provider & cost**
- Cache recent classification results to reduce repeat calls and manage quotas.
- Add monitoring/alerts for YOLO API errors and quota exhaustion.

---

# 11 — Development Phases & Milestones

**Phase 0 — Preparation**
- Gather hardware: Raspberry Pi, sensors, camera, pump/relay.
- Create cloud accounts: Vercel, PostgreSQL host, S3-compatible storage, YOLO provider.
- Seed the plant threshold DB with a few common species.

**Phase 1 — Core plumbing (MVP)**
- Scaffold Next.js repo with Tailwind.
- Implement PostgreSQL schema & Prisma client.
- Implement `POST /api/telemetry` and `GET /api/latest`.
- Pi script: read sensors every 15s and POST telemetry.
- Build a simple polling dashboard to display latest values.

**Phase 2 — Realtime & control**
- Integrate a realtime channel (Pusher/Ably or SSE).
- Implement `POST /api/control/water` with server-side safety.
- Implement Pi command polling or subscription to receive control commands.
- Build control UI and cooldown indicator.

**Phase 3 — YOLO image pipeline**
- Pi uploads images to `POST /api/image`.
- Backend calls hosted YOLO API, stores detections, maps to `plant_types`.
- Return thresholds to Pi; Pi consumes and uses thresholds for local automation.

**Phase 4 — Automation & analytics**
- Implement local auto-watering logic on Pi using thresholds; log events.
- Implement hourly aggregation worker and history charts.
- Add UI polish (gauge animations, annotated image viewer).

**Phase 5 — Demo polish & documentation**
- Final safety checks; test failure modes (YOLO outage, network loss).
- Add README and demo script for classroom.
- Prepare slides and demo checklist.

---

# 12 — Common Challenges & Mitigations

**Pi reliability**
- Use high-quality SD cards and minimize writes. Consider using USB-SSD if available. Implement a watchdog or auto-reboot script.

**Network dependency for YOLO**
- Implement fallback: if YOLO provider fails, Pi uses last-known thresholds or safe conservative defaults. Cache results to reduce repeat calls.

**YOLO misclassification**
- Require a minimum confidence threshold (e.g., 0.6). If confidence is low, prompt manual selection in the dashboard or fall back to safe defaults.

**Quota & cost control for YOLO provider**
- Cache and throttle image submissions (limit to once per N minutes or on significant change). Monitor usage.

**Realtime complexity on serverless hosts**
- Use a managed realtime provider (Pusher/Ably) to avoid hosting complexity, or use SSE for one-way updates.

**Public control abuse**
- Server-side rate limits, max runtime, cooldowns, and logging. Optionally add a single secret token shared out-of-band for control.

---

# 13 — Future Expansion Ideas

- Multi-device & multi-user with role-based access control and onboarding flows.
- Hybrid architecture: Raspberry Pi as gateway to lightweight ESP32 field nodes.
- On-device edge ML with TensorFlow Lite for offline inference.
- Predictive watering and recommendation engine using historical trends.
- Mobile app with push notifications and remote quick actions.
- Classroom features: multi-station dashboards, student accounts, and lesson modules.

---

# 14 — Actionable Next Steps (checklist)

1. Create the Next.js + Tailwind + Prisma project scaffold.
2. Provision PostgreSQL, object storage, and YOLO provider account (get API key).
3. Implement `POST /api/telemetry` and a simple Pi script to POST telemetry at 15s intervals.
4. Build initial Dashboard page that consumes `/api/latest` and polls or subscribes to realtime.
5. Implement `POST /api/control/water` with server-side rate-limiting and Pi command delivery.
6. Add image upload endpoint and wire hosted YOLO API calls, map to plant thresholds.
7. Implement local auto-watering on Pi using thresholds returned from backend and log events.
8. Add hourly aggregation worker and history charts.
9. Polish UI (dark-tech theme), test edge cases, prepare demo notes.

---

# 15 — Appendix: Concise API contract (human-readable)

**POST /api/telemetry**
- Request: device_id, timestamp, sensors (soil_pct, temperature_c, humidity_pct, lux)
- Response: 200 OK
- Side-effects: stores reading and emits realtime update.

**POST /api/image**
- Request: device_id, timestamp, image file (multipart or base64)
- Response: { plant_label, confidence, thresholds }
- Side-effects: stores image, calls YOLO provider, stores detection(s).

**POST /api/control/water**
- Request: device_id, optional duration_seconds
- Response: { success: bool, reason?: string, next_allowed?: timestamp }
- Side-effects: logs attempt; if allowed, queues/returns command for device.

**GET /api/latest**
- Purpose: initial snapshot (latest reading, last detection, device status)

**GET /api/history?sensor=&from=&to=&agg=hourly**
- Purpose: historical data and aggregated series.

**GET /api/events?type=&limit=**
- Purpose: return events (detections, controls, errors)

**GET /api/plant-types**
- Purpose: return seed of plant type definitions & thresholds.

---

# 16 — Pi-side behavior (implementation-agnostic flow)

**Device startup**
- Read local config & device token.
- Connect to network; POST a heartbeat / last_seen to backend.

**Telemetry loop (every 15s)**
- Read sensors (soil, temp, humidity, light).
- POST to /api/telemetry.
- Listen for pending commands (via polling endpoint or subscribed channel).

**Image capture & identification**
- Capture image on schedule or manual trigger.
- POST image to /api/image.
- Receive back identified plant label + thresholds and save locally.

**Local auto-watering logic**
- Use thresholds to determine whether watering is needed (e.g., soil_pct < soil_min triggers).
- Before activating pump, apply safety checks (max duration, recent activations).
- If allowed, run pump for calculated duration and log the event to backend.

**Command handling**
- If backend queues a `WATER` command, execute it subject to local safety checks and report start/stop events to backend.

**Offline fallback**
- If backend unreachable, use last-known thresholds or safe conservative defaults and log locally for later upload.

---

# 17 — Final notes & next moves

This `masterplan.md` is intended to be a complete high-level blueprint you can drop into your project repository. It emphasizes a single Next.js full-stack codebase, PostgreSQL as the canonical store, hosted YOLO inference via API, and a Pi that runs local automation while pushing telemetry and images to the cloud for visualization.

# Maha FDA — Citizen Complaint Portal (Prototype)

A complete, professional, responsive citizen complaint portal for a
**Food & Drug Administration, Maharashtra** style system. Citizens can file
complaints (with photo evidence and GPS location), receive a unique Complaint
ID and a preliminary AI-assisted priority score, and track complaint status.
Authorized officers get a protected dashboard to review, sort and update
complaints.

> ⚠️ **IMPORTANT DISCLAIMER**
> This is a **student / academic prototype**. It is **NOT** an official
> Maharashtra Government or FDA website. The AI priority score is only a
> preliminary prioritization recommendation — it does not determine whether a
> complaint is genuine and does not replace official investigation or
> decisions by authorized FDA officers.

---

## 1. Technology Stack

The original PRD specified **Python Flask + SQLite** for local Windows use.
This workspace runs a fullstack **Next.js (App Router) + PostgreSQL + Drizzle
ORM** runtime, so the project implements the **entire PRD feature set** on that
stack:

| PRD requirement (Flask)        | Implemented here (Next.js)                                    |
| ------------------------------ | ------------------------------------------------------------- |
| SQLite `complaints` table      | PostgreSQL `complaints` table via Drizzle ORM                 |
| Werkzeug password hashing      | `bcryptjs` hashing (never plain text)                         |
| Flask session authentication   | Signed HttpOnly JWT session cookie (`jose`)                   |
| `uploads/` file storage        | Photo binary stored in DB, served only to officers at `/uploads/<filename>` |
| `database.db` auto-creation    | Tables created via `npx drizzle-kit push`; demo officer auto-seeded on first login |
| `app.run(host="0.0.0.0", port=5000)` | `next dev --hostname 0.0.0.0` (LAN access, see §6)     |

Everything else — routes, forms, validations, priority scoring, statuses,
officer dashboard and responsive design — matches the PRD.

## 2. Requirements

- Node.js 20+
- PostgreSQL (DATABASE_URL in `.env`)

## 3. Setup (VS Code friendly)

1. Open the project folder in VS Code.
2. Open a terminal and install dependencies:

   ```bash
   npm install
   ```

3. Apply the database schema (creates `complaints` and `officers` tables):

   ```bash
   npx drizzle-kit push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the browser:

   ```
   http://localhost:3000
   ```

The demo officer account is **created automatically** on first login (idempotent —
existing complaints are never deleted on restart).

### Officer login & Secret Passkey Gatekeeper (prototype demo)

| Field          | Value         |
| -------------- | ------------- |
| Username       | `fdaofficer`  |
| Password       | `fda@123`     |
| Secret Passkey | `Harshal@123` |

- The Officer Dashboard (`/admin`) is protected by a **Secret Key Gatekeeper** requiring the masked passkey `Harshal@123`.
- If an incorrect secret passkey is entered, access is denied with an **"Unauthorized Access"** alert message and the user is redirected back to the Home / Citizen Dashboard (`/`).
- The password is stored as a bcrypt hash in the database — never in plain text.

## 4. Local Network Mode (phones on the same Wi-Fi)

Run the dev server bound to all interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then on your laptop use `http://localhost:3000` and on other devices connected
to the same Wi-Fi/LAN use `http://<LAPTOP_IP>:3000`
(e.g. `http://192.168.1.10:3000`). The app is **never** deployed to the public
Internet by this setup.

## 5. Routes

| Route                              | Purpose                                        |
| ---------------------------------- | ---------------------------------------------- |
| `/`                                | Home page (hero, services, disclaimers)        |
| `/complaint`                       | File a Complaint form                          |
| `POST /api/complaints`             | Submit complaint (equivalent of `/submit-complaint`) |
| `/success?id=FDA-XXXXXXXX`         | Success page with Complaint ID + priority      |
| `/my-complaints`                   | Track Complaint (Complaint ID lookup + timeline) |
| `GET /api/track?id=…`              | Track lookup API                               |
| `/information`                     | FDA Contact Information page                   |
| `/officer-login`                   | Officer login form                             |
| `POST /api/auth/login`             | Officer login API                              |
| `POST /api/auth/logout`            | Logout API                                     |
| `/officer-logout`                  | Logout redirect route                          |
| `/admin`                           | Officer dashboard (auth required)              |
| `/admin/complaint/<complaint_id>`  | Complaint details + photo + status update      |
| `POST /api/admin/complaints/<id>/status` | Status update (equivalent of `/update-status/<id>`) |
| `/uploads/<filename>`              | Photo serving — **officers only**              |
| `/api/health`                      | Health check                                   |

## 6. Feature Summary

- **Complaint form**: 8 complaint types, description, photo (JPG/JPEG/PNG/WEBP,
  max 5 MB, extension + MIME validation, unique server-side filename), location
  text + **Get My Location** (Geolocation API, `enableHighAccuracy: true`,
  15 s timeout — never submitted without permission), name, 10-digit mobile
  validation, optional email, truthful-information consent notice.
- **Complaint IDs**: unique `FDA-XXXXXXXX` format, generated per complaint.
- **AI preliminary priority**: deterministic local engine scores complaints
  0–100 based on complaint type + risk keywords (spurious drugs, hospitals,
  children, poisoning, foreign matter…). Categories: 🔴 HIGH (70–100),
  🟠 MEDIUM (40–69), 🟢 LOW (0–39) with a short explanation. If analysis is
  ever unavailable, the fallback note "AI analysis unavailable." is stored and
  **submission still succeeds**. If an external AI API is used, keep its key in
  environment variables — never in source code.
- **Officer dashboard**: stats cards (Total / High / Medium / Low), sortable
  data sorted highest-priority-first then newest, photo thumbnails, priority
  and status badges, horizontal scrolling on small screens.
- **Complaint details**: description, location + Google Maps link, photo,
  citizen info, AI assessment with the required warning text, status dropdown
  (Pending / Under Review / Action Taken / Resolved).
- **Citizen tracking**: status timeline with completed/current steps
  highlighted; "Complaint ID not found." for unknown IDs.
- **Status updates** are instantly visible in `/my-complaints`.

## 7. Security (implemented)

- Session authentication with signed, HttpOnly cookies — the dashboard is
  never rendered without a valid session (server-side check on every `/admin`
  page and API).
- bcrypt password hashing (demo officer seeded on first use).
- Photo uploads: extension + MIME whitelist, 5 MB limit, random server-side
  filenames, never trust the client filename, no executable uploads.
- Photos served only to authenticated officers; citizen personal data is never
  exposed on public pages (tracking returns only public-safe fields).
- SQL parameterised queries (Drizzle), input validation, friendly error
  handling for every failure path (invalid fields, bad photo, missing
  complaint, invalid status, unauthorised access, GPS denied, DB errors).

**For production later**: HTTPS, CSRF protection, secure cookies, rate
limiting, proper government identity/authentication, audit logs, database
backups, privacy policy, data retention policy, secure file storage.

## 8. Test Checklist

1. Open Home page → 2. Click *File a Complaint* → 3. Fill the complaint →
4. Upload an image → 5. Tap *Get My Location* → 6. Submit →
7. Confirm unique `FDA-XXXXXXXX` Complaint ID → 8. Open *Track Complaint* →
9. Enter the Complaint ID → 10. Confirm status is **Pending** →
11. Open *Officer Login* → 12. Confirm unauthenticated `/admin` redirects to
login → 13. Log in as `fdaofficer` / `fda@123` → 14. Confirm the complaint
appears on the dashboard → 15. Open complaint details → 16. Confirm photo and
location → 17. Confirm AI priority + reason → 18. Change status to
**Under Review** → 19. Open *Track Complaint* again → 20. Confirm the citizen
sees **Under Review** → 21. Resize for mobile responsiveness →
22. Try an invalid photo (.exe / >5 MB) → 23. Try an invalid Complaint ID →
24. Deny GPS permission (must show the friendly error, never crash).

## 9. Environment Variables

| Variable         | Purpose                              | Default (prototype)          |
| ---------------- | ------------------------------------ | ---------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string         | configured in `.env`         |
| `SESSION_SECRET` | Session signing secret (use in prod) | prototype fallback (dev only) |

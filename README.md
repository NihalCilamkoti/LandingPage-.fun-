# EnthiosHub Playhouse 🎪
*A Friendly, Interactive Digital Playground Inspired by Google Santa Tracker*

An original, colourful, illustrated virtual playhouse where visitors can explore rooms, play mini-games, solve puzzles, earn stars, and discover real collegiate events on the official EnthiosHub platform.

---

## 🌟 The 5 Playhouse Rooms

1. **Room 1: The Game Room (Arcade)**
   - **Collect the Stars**: 30-second speed challenge. Collect glowing event stars before the countdown ends.
   - **Memory Match**: Card matching challenge with 8 event format pairs (*Hackathons, Model UN, Conferences, Workshops, Debates, Quizzes, Competitions, College Fests*).
   - **Lightning Reflex**: 20-second reaction tap challenge with shrinking energy targets.
   - **Event IQ**: Rapid-fire multiple-choice quiz with instant feedback.

2. **Room 2: The Puzzle Room (Brain Training)**
   - **Venue Blueprint**: Interactive spatial layout challenge. Arrange the 6 core event sectors (*Stage, QR Check-in, Hack Hall, Jury Suite, Networking Lounge, Certificate Desk*).
   - **Beacon Sequence**: Simon-style pattern memory. Watch the 4 event beacons pulse in rhythm and repeat the sequence.
   - **Event Detective**: Fun logic deduction riddles matching organizers, activities, and platform capabilities.

3. **Room 3: Event World (Live Platform Gateway)**
   - Real-time connection to verified public EnthiosHub backend API: `https://api.enthioshub.com/api/events`.
   - Filter by format (*Hackathons, Model UN, Conferences, Workshops, Debates, Quizzes, Competitions, College Festivals*).
   - Direct links to official event pages on `https://enthioshub.com/events/[slug]`.
   - Zero fake stats or fabricated numbers.

4. **Room 4: Rewards Room (Trophies & Badges)**
   - Total stars collected counter.
   - 7 unlockable badges (*First Adventure, Spark Collector, Memory Master, Quick Thinker, Event Architect, Lightning Reflexes, Event Explorer*).
   - Personal best score tracker stored safely in browser `localStorage`.

5. **Room 5: About EnthiosHub (Discovery Studio)**
   - Interactive tour explaining the real platform: Event Management, Organization Governance, Organizer Dashboards, Smart Registration, Activity Engines, Team Rosters, Jury & Rubrics, Certificates, Participant Experience.
   - Big direct action button: *"Explore the Real EnthiosHub Platform"* linking to `https://enthioshub.com`.

---

## 🚀 Quick Start (Development)

```bash
# Install dependencies
npm install

# Run local development server with Hot Module Replacement
npm run dev
```

---

## 📦 Production Static Build

The build produces a completely self-contained static application in `dist/` with relative asset links (`./assets/...`). **Zero persistent Node.js runtime is needed in production.**

```bash
# Generate static production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Hostinger Deployment Guide

1. Run the production build:
   ```bash
   npm run build
   ```
2. Open your **Hostinger File Manager** (or connect via SFTP).
3. Navigate to `public_html` of your target domain.
4. Upload all files and folders located inside the `dist/` folder directly to `public_html/`:
   - `index.html`
   - `.htaccess` (included for Apache URL rewrites, Gzip compression, and security headers)
   - `logo-enthioshub.png`
   - `assets/` (contains hashed `.js`, `.css`, and `.png` files)
5. **Done!** The playhouse is immediately live and fully static.

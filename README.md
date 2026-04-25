# 🌊 Urchin - Advanced Social Platform 2026

![Version](https://img.shields.io/badge/Version-2026.1.0-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tech Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-orange.svg)
![Database](https://img.shields.io/badge/Backend-Firebase-yellow.svg)

Urchin is a next-generation, real-time social networking platform engineered for 2026. Built with a pure Vanilla JavaScript frontend and a robust Firebase backend, it delivers a seamless, native-like experience with persistent authentication, real-time messaging, and advanced server management.

---

## ✨ Core Features

* **100% Real Authentication:** Powered by Firebase Auth. Accounts are permanent, and sessions persist across device reboots and app updates.
* **Advanced Profile Management:** * Upload real avatars and banners (Base64 image processing integrated directly into the database).
    * Strict username system (Max 4 characters).
    * Anti-spam 42-hour cooldown on username changes.
* **Server & Community Hubs:**
    * Create dedicated servers with custom icons, names, and bios.
    * Real-time text channels with full-screen immersive chat UI.
    * Voice lounge interface with integrated microphone toggle controls.
* **Global Feed:** Share posts with the world in real-time.
* **Owner Ecosystem (Exclusive):**
    * **Tri-Users:** Creation of elite 3-character usernames (e.g., `@abc`), restricted solely to the platform Owner.
    * **Bot Integration:** The Owner can create official bots with unique avatars, bios, and auto-generated hidden access tokens.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Advanced Glassmorphism UI), Vanilla JavaScript (ES6+ Modules).
* **Backend & Real-time DB:** Firebase Realtime Database.
* **Authentication:** Firebase Auth (Email/Password).
* **Storage:** Base64 Data URI strings handled natively in the Realtime Database for blazing-fast image rendering without external bucket latency.

---

## 🚀 Hosting Setup & Installation

Since Urchin is built using pure web technologies (HTML/CSS/JS) and a serverless Firebase backend, it can be hosted easily on any static hosting provider. 

**Recommended Setup (GitHub Pages):**
1. Create a new repository on your GitHub account (e.g., `urchin-platform`).
2. Upload the core files: `index.html`, `style.css`, and `app.js` into this repository.
3. Navigate to the repository **Settings**.
4. Click on **Pages** in the left sidebar.
5. Under "Build and deployment", set the **Source** to `Deploy from a branch`.
6. Select the `main` branch and click **Save**.
7. Wait ~2 minutes. Your live, fully functional 2026 social network is now online!

*(Note: The same files can be directly deployed to Vercel, Netlify, or Firebase Hosting using their respective CLIs).*

---

## 🤖 Bot Startup & Configuration Instructions

Urchin supports an exclusive bot API system. **Only the Platform Owner can generate bots.**

**How to create and link a bot:**
1. Log into the platform using the official Owner Email (`waylalyzydy51@gmail.com`).
2. Navigate to the **Settings** tab.
3. Scroll down to the **🤖 My Bots** section (visible only to the owner) and click **Create Bot**.
4. Upload the bot's official Avatar, set its Name, and provide a Bio.
5. Once created, the bot will appear in your Owner dashboard.
6. **The Token:** You will see a securely generated `TOKEN` (e.g., `urchin_bot_...`). Copy this token. You will use it in your external Node.js/Python server to connect the bot to the Firebase Realtime Database.
7. **The Invite Link:** Share the official invite link (`https://urchin.app/bot/add/{bot_id}`) with users so they can add your bot to their servers.

---

## 🛡️ Security & Roles

| Role | Badge | Permissions |
| :--- | :--- | :--- |
| **Owner** | `OWNER 👑` | Full access. Can create bots, view tokens, bypass username limits, and create Tri-users. |
| **Tri-User**| `TRI ⭐` | Elite status. Owns a rare 3-character username. |
| **Member** | None | Standard access. Create servers, chat, post, max 4-char username, 42h cooldowns. |

---
*Developed with extreme dedication by Wano Studio.*

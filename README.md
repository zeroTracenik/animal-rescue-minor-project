# Animal Rescue Connect (ARC) 🐾
### *A Community-Driven Emergency Animal Rescue, Spatial Dispatch & Volunteer Coordination Platform*

> **Academic College Minor Project**  
> **Student Developer:** Nikshay Ghode (2nd Year B.Tech Student)  
> **Degree & Stream:** B.Tech in Computer Science & Engineering — Specialization in Cybersecurity  
> **Institution:** G H Raisoni SkillTech University, Nagpur  
> **Domain:** Full-Stack Web Development, Spatial Algorithms, Emergency Dispatch & Web Security  
> **Tech Stack:** Node.js, Express.js, JavaScript (ES6+), Bootstrap 5.3, RESTful APIs, JWT, Bcrypt

---

## 📋 Table of Contents
1. [Project Overview & Abstract](#-project-overview--abstract)
2. [Problem Statement](#-problem-statement)
3. [Proposed Solution](#-proposed-solution)
4. [System Architecture & Core Modules](#-system-architecture--core-modules)
5. [Mathematical & Algorithmic Formulation](#-mathematical--algorithmic-formulation)
6. [Cybersecurity & Data Privacy](#-cybersecurity--data-privacy)
7. [Technology Stack](#-technology-stack)
8. [Directory Structure](#-directory-structure)
9. [Installation & Setup Guide](#-installation--setup-guide)
10. [Pre-Configured Demo Credentials (Nagpur Region)](#-pre-configured-demo-credentials-nagpur-region)
11. [RESTful API Reference](#-restful-api-reference)
12. [Future Scope & Academic Extensions](#-future-scope--academic-extensions)
13. [License & Acknowledgments](#-license--acknowledgments)

---

## 📖 Project Overview & Abstract

In urban Indian cities like Nagpur, thousands of stray dogs, cats, cattle, and birds fall victim to road accidents, trauma, dehydration, and maggot infections every year. While numerous NGOs and compassionate citizens exist, the rescue process typically breaks down because:
1. Bystanders face high friction (mandatory account sign-ups, unfamiliar rescue phone numbers).
2. Location descriptions are vague ("near the big tree"), causing ambulance units to waste critical golden-hour response time.
3. NGOs operate in silos without centralized spatial dispatching or live tracking.

**Animal Rescue Connect (ARC)** is an automated full-stack emergency response system designed to streamline animal triage from the moment a citizen spots an injured animal to on-ground rescue, clinical treatment, and safe rehabilitation.

---

## 🎯 Problem Statement

* **Information Asymmetry:** Citizens spotting an animal rarely know which NGO has the nearest operational radius or available hydraulic ambulance.
* **Lack of Visual Triage:** Rescue teams cannot determine whether to send a bike responder with a first-aid kit or a full surgical van without visual evidence.
* **Responder Burnout & Inactivity:** Field volunteers lack recognition, gamification, or a structured pipeline to accept tasks autonomously.
* **Data Privacy Concerns:** Good Samaritans hesitate to report incidents when their personal phone numbers are made public on open groups.

---

## 💡 Proposed Solution

* **Zero-Friction Citizen Reporting:** No login required to report an incident.
* **High-Accuracy Geolocation:** One-click device GPS coordinate acquisition (latitude/longitude) with reverse geocoding fallback.
* **Multi-Photo Evidence & Direct Camera Capture:** Citizens can stage multiple injury photos or activate device webcam with instant clarity verification.
* **Haversine Distance Nearest-NGO Engine:** Automatically calculates distance against verified rescue stations and assigns the optimal facility.
* **Volunteer Gamification & Rescue Credits:** Responders claim cases from a live radar and earn tiered Rescue Credits (**+50 pts** accept, **+75 pts** rescue, **+50 pts** clinic, **+150 pts** completion) across Bronze, Silver, Gold, and Platinum ranks.
* **6-Step Progress Pipeline:** Full public visibility into case progress with protected reporter identities.

---

## 🏗️ System Architecture & Core Modules

```
                    ┌─────────────────────────────────────────┐
                    │      Citizen Bystander (Web Browser)    │
                    │   - No Login Required                   │
                    │   - GPS Auto-Detection                  │
                    │   - Multi-Photo & Live Camera Capture   │
                    └────────────────────┬────────────────────┘
                                         │  POST /api/reports (Multipart Form Data)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │         Express.js API Gateway          │
                    │   - Multer Image Processing             │
                    │   - Haversine Proximity Dispatcher      │
                    │   - Privacy Masking Middleware          │
                    └──────┬─────────────┬─────────────┬──────┘
                           │             │             │
              ┌────────────┘             │             └────────────┐
              ▼                          ▼                          ▼
   ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
   │ NGO Command Center   │   │ Volunteer Radar      │   │ Public Tracking Feed │
   │ - Case Intake        │   │ - Live Alert Radar   │   │ - 6-Step Stepper     │
   │ - Volunteer Dispatch │   │ - 1-Click Accept     │   │ - GPS Landmark View  │
   │ - Clinical Status    │   │ - Gamified Credits   │   │ - Audit Timeline     │
   └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

### Module Breakdown:
1. **Public Citizen Intake (`report.html` & `report.js`):**
   - Condition-based priority suggestion algorithm (*Critical*, *Urgent*, *Moderate*, *Low / Shelter Care*).
   - Interactive live camera modal (`navigator.mediaDevices.getUserMedia`) with frame capture on `<canvas>` and retake/verify controls.
   - Dynamic staging gallery with thumbnail previews, badges, and zoom inspection.
2. **Spatial Dispatch Engine (`geoUtils.js`):**
   - Computes great-circle distances between incident coordinates and active Nagpur shelter coordinates.
3. **Volunteer Command & Gamification (`volunteer-dashboard.html` & `dashboard.js`):**
   - Real-time radar of unassigned emergency alerts.
   - 1-click case acceptance (`POST /api/reports/:id/accept`).
   - Rescue Karma / Credit Points engine updating DB records and advancing badges.
4. **NGO Operations Portal (`ngo-dashboard.html`):**
   - Queue management, triage assignment, team coordination, and status updates.
5. **System Administration (`admin-dashboard.html`):**
   - System-wide statistics, user role management, and 1-click database reset for demonstrations.

---

## 📐 Mathematical & Algorithmic Formulation

### 1. Haversine Great-Circle Distance Algorithm
To identify the nearest NGO rescue center on Earth's spherical surface, the backend calculates the geodesic distance $d$ between incident coordinates $(\phi_1, \lambda_1)$ and shelter coordinates $(\phi_2, \lambda_2)$:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

$$d = R \cdot c \quad (\text{where Earth's mean radius } R \approx 6,371 \text{ km})$$

The rescue facility with $\min(d)$ is matched and presented to the reporter.

### 2. Condition-to-Priority Scoring Matrix
$$\text{Priority} = f(\text{Reported Trauma})$$
* **Critical (🔴 Immediate):** Hit & Run, Open Trauma, Suspected Fracture, Electric Shock Burn.
* **Urgent (🟠 Hours):** Deep Wound, Severe Maggot Infection, Trapped in Drain/Hazard.
* **Moderate (🟡 Medical Aid):** Severe Mange / Skin Disease, Mild Limp, Malnourishment.
* **Low / Shelter Care (🟢 Non-Fatal):** Abandoned Kittens/Puppies, Routine Shelter Support.

### 3. Volunteer Credit Points & Gamification Thresholds
$$\text{Credits Earned} = \Delta \text{Status}$$
* **Accept Case & Dispatch:** $+50\text{ pts}$
* **On-Site Animal Rescued:** $+75\text{ pts}$
* **Clinic Hospitalization / Treatment:** $+50\text{ pts}$
* **Full Case Completion & Recovery:** $+150\text{ pts}$

**Tier Progression:**
* 🥉 **Bronze Rescuer:** $0 - 199\text{ Credits}$
* 🥈 **Silver Guardian:** $200 - 499\text{ Credits}$
* 🥇 **Gold Life Saver:** $500 - 999\text{ Credits}$
* 🏆 **Platinum Animal Champion:** $1000+\text{ Credits}$

---

## 🔒 Cybersecurity & Data Privacy

1. **Cryptographic Password Hashing:** Uses `bcryptjs` with 10 salt rounds to store one-way salted password hashes.
2. **Citizen Caller Privacy & Dynamic Number Masking:** Bystander telephone numbers are masked (`+91 98224 •••••`) on all public feeds. Full numbers are restricted to authorized NGOs and assigned field volunteers.
3. **Role-Based Access Control (RBAC):** Signed JSON Web Tokens (JWT) enforce separation between `citizen`, `volunteer`, `ngo`, and `admin` roles.
4. **Input Sanitization:** Multi-field validation on file types (JPEG, PNG, WEBP), size restrictions ($5\text{ MB}$ limit), and coordinate ranges.
5. **Zero Credential Leakage:** Outgoing API serializers strip sensitive fields (`passwordHash`) from user profiles.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons 1.11 | Responsive, modern social-impact UI with glassmorphism navbar and card layout |
| **Backend** | Node.js, Express.js | Modular REST API with MVC pattern |
| **Media Capture** | HTML5 MediaDevices API, HTML5 Canvas | Camera access, frame rasterization, multi-file staging |
| **File Uploads** | Multer | Multipart/form-data upload handling with size and MIME validation |
| **Authentication** | `jsonwebtoken` (JWT), `bcryptjs` | Stateless session management with salted password hashing |
| **Data Storage** | JSON File Database Driver (`server/data/*.json`) | Atomic read/write storage engine with zero external database dependencies |

---

## 📂 Directory Structure

```text
animal-rescue-connect/
│
├── .gitattributes                     # Cross-platform line ending normalization
├── .gitignore                          # Excludes node_modules, logs, and user uploads
├── .env.example                        # Template for environment configuration
├── package.json                        # Project metadata, dependencies, and npm scripts
├── README.md                           # Complete academic project documentation
│
├── frontend/
│   ├── index.html                      # Main portal landing page
│   ├── css/
│   │   └── style.css                   # Custom stylesheets, gamification badges & animations
│   ├── js/
│   │   ├── main.js                     # Global utilities, toast notifications & API caller
│   │   ├── auth.js                     # Authentication handler & role-based redirects
│   │   ├── report.js                   # Geolocation, camera capture & multi-photo staging
│   │   ├── cases.js                    # Public cases feed, search & filter logic
│   │   ├── track.js                    # 6-step visual case progress tracking
│   │   └── dashboard.js                # NGO, Volunteer & Admin command center logic
│   └── pages/
│       ├── report.html                 # Incident report submission page
│       ├── cases.html                  # Public animal rescue directory
│       ├── track.html                  # Case tracking page with photo gallery
│       ├── about.html                  # Mission, technical disclaimer & priorities
│       ├── login.html                  # Multi-role authentication page
│       ├── register.html               # Citizen & NGO registration page
│       ├── ngo-dashboard.html          # NGO command center
│       ├── volunteer-dashboard.html    # Volunteer emergency radar & credit points
│       └── admin-dashboard.html        # Platform administrator oversight panel
│
├── server/
│   ├── server.js                       # Express application bootstrap & route mounts
│   ├── controllers/
│   │   ├── authController.js           # Registration, login & profile retrieval
│   │   ├── reportController.js         # Report creation, nearest NGO match & credits
│   │   └── ngoController.js            # NGO & Volunteer directory endpoints
│   ├── middleware/
│   │   └── authMiddleware.js           # JWT authentication & citizen privacy masking
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth endpoints
│   │   ├── reportRoutes.js             # /api/reports endpoints
│   │   ├── ngoRoutes.js                # /api/ngos endpoints
│   │   └── statsRoutes.js              # /api/stats endpoints & demo reset
│   ├── utils/
│   │   └── geoUtils.js                 # Haversine distance calculations
│   └── data/
│       ├── db.js                       # JSON database driver with atomic read/write
│       ├── initialData.js              # Nagpur seed data (NGOs, volunteers, cases)
│       ├── users.json                  # Stored user accounts
│       ├── ngos.json                   # Stored registered NGOs
│       ├── volunteers.json             # Stored volunteers with credit points
│       └── reports.json                # Stored rescue cases
│
└── public/
    ├── images/
    │   └── cases/                      # Pre-seeded case demonstration photographs
    └── uploads/
        └── .gitkeep                    # Preserves directory structure for runtime uploads
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
* **Node.js** (v16.0.0 or higher) installed on your machine.  
  Verify using:
  ```bash
  node -v
  npm -v
  ```

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/animal-rescue-connect.git
cd animal-rescue-connect
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment (Optional)
A default `.env.example` file is included. Create a local `.env` if custom ports are needed:
```bash
cp .env.example .env
```

### Step 4: Run the Application
```bash
npm start
```

### Step 5: Open in Web Browser
Navigate to:
```text
http://localhost:3000
```

---

## 🔑 Pre-Configured Demo Credentials (Nagpur Region)

The application comes pre-loaded with verified demonstration records from Nagpur, Maharashtra:

| Role | Name / Organization | Email | Password | Access Portal |
|---|---|---|---|---|
| **System Admin** | Platform Administrator | `admin@rescue.org` | `admin123` | `/pages/admin-dashboard.html` |
| **NGO Center** | Save Speechless Animals Foundation (SSAF Nagpur) | `ssaf@nagpurrescue.org` | `ngo123` | `/pages/ngo-dashboard.html` |
| **NGO Center** | People For Animals (PFA Nagpur) | `pfa@nagpurrescue.org` | `ngo123` | `/pages/ngo-dashboard.html` |
| **NGO Center** | Nagpur Paws Animal Rescue Shelter | `paws@nagpurrescue.org` | `ngo123` | `/pages/ngo-dashboard.html` |
| **Field Volunteer**| Sagar Wankhede (Senior First Responder) | `sagar@volunteer.org` | `volunteer123` | `/pages/volunteer-dashboard.html` |
| **Field Volunteer**| Amit Meshram (Large Animal & Wildlife Handler) | `amit@volunteer.org` | `volunteer123` | `/pages/volunteer-dashboard.html` |
| **Public Citizen** | Priya Sharma | `priya@nagpur.org` | `citizen123` | `/pages/report.html` |

---

## 📡 RESTful API Reference

| HTTP Method | Endpoint | Description | Access Tier |
|---|---|---|---|
| `POST` | `/api/reports` | Submit a rescue report with multiple photos & GPS | Public (No login) |
| `GET` | `/api/reports` | List all cases (supports status, priority & search filters) | Public (masked phones) |
| `GET` | `/api/reports/:id` | Retrieve single case tracking details by Case ID | Public |
| `POST` | `/api/reports/:id/accept` | Volunteer accepts case, triggers dispatch & earns credits | Volunteer / NGO |
| `PUT` | `/api/reports/:id/status` | Advance status (`On the Way` ➔ `Rescued` ➔ `Treatment` ➔ `Completed`) | Volunteer / NGO / Admin |
| `POST` | `/api/reports/:id/assign` | NGO assigns specific volunteer to case | NGO / Admin |
| `GET` | `/api/ngos` | List registered rescue NGOs with operational zones | Public |
| `GET` | `/api/ngos/volunteers/all`| List registered field volunteers and duty statuses | Public / NGO |
| `GET` | `/api/ngos/volunteers/:id`| Fetch volunteer profile, credit score & rank | Volunteer / NGO |
| `POST` | `/api/auth/register` | Register new citizen or NGO account | Public |
| `POST` | `/api/auth/login` | Authenticate user and issue signed JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated session profile | Bearer Token |
| `GET` | `/api/stats` | Platform-wide operational counters | Public |
| `POST` | `/api/stats/reset` | Restore demo database to pristine seed state | Admin |

---

## 🔮 Future Scope & Academic Extensions

1. **AI Computer Vision Wound Triage:** Integration of a lightweight MobileNet / YOLO model to automatically classify fracture severity and wound depth directly in the browser before dispatch.
2. **Automated WhatsApp Notification Bot:** Integrating WhatsApp Business API / Twilio to send automated location dispatch cards directly to on-field ambulance drivers.
3. **Offline Progressive Web App (PWA):** Caching capabilities enabling volunteers in low-connectivity zones to record updates and synchronize when reconnected.
4. **Live GPS Ambulance Telemetry:** WebSockets-based real-time vehicle movement tracking for waiting citizens.

---

## 📄 License & Academic Declaration

### 🎓 Academic Project Declaration
This project was conceived, designed, and developed as an **Academic Minor Project** by:

* **Student Developer:** Nikshay Ghode
* **Academic Level:** 2nd Year B.Tech Student
* **Degree & Specialization:** B.Tech in Computer Science & Engineering (Cybersecurity)
* **University / Institution:** G H Raisoni SkillTech University, Nagpur, Maharashtra, India
* **Project Title:** Animal Rescue Connect (ARC) — Community Emergency Animal Rescue & Spatial Dispatch Coordination Platform
* **Academic Focus Areas:** 
  * Full-Stack Web Architecture (Express.js, RESTful Design, Clean MVC Pattern)
  * Spatial Geolocation & Triage Optimization (Haversine Great-Circle Distance Algorithm)
  * Web Application Security & Defensive Engineering (Salted Bcrypt Password Hashing, Signed JWT Authorization, Caller Contact Privacy Masking)
  * Gamified Volunteer Workflow (Rescue Credits & Tiered Responder Ranking)

### 📜 Open-Source License
Distributed under the **MIT License**. Free for educational, research, and non-profit community animal welfare deployment.  
Copyright © 2026 Nikshay Ghode. All rights reserved.

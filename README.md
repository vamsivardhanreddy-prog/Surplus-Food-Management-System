<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/heart-handshake.svg" width="100" height="100" alt="ShareBite Logo" />
  <h1>Smart Surplus Food Management System</h1>
  <p>A location-aware, full-stack application connecting food donators with verified NGOs to minimize food waste and alleviate hunger.</p>
</div>

---

## 🌟 Overview

The **Smart Surplus Food Management System (ShareBite)** acts as a geographic bridge between surplus food suppliers (event organizers, restaurants, individuals) and Non-Governmental Organizations (NGOs). 

It features an intelligent routing system that displays real-time food donations on an interactive map and ensures secure handoffs by enforcing strict device-location verification before a claim can be finalized.

## ✨ Key Features

- **🛡️ Role-Based Architecture:** Dedicated, tailor-made dashboards for Donators, NGOs, and System Administrators.
- **📍 Smart Geolocation Matching:** Live Mapbox integration visualizes donations geographically, matching local NGOs to nearby food supplies.
- **🏢 NGO Verification Pipeline:** Admin dashboard allows verification of NGO credentials before they are authorized to claim food.
- **🔒 Secure Location-Based Claiming:** NGOs must physically be within 500 meters of their registered organization address to successfully "Claim" a food drop, preventing fraudulent interference.
- **📊 Real-time Impact Analytics:** Visual metrics track meals served, donations successfully routed, and active NGOs.
- **📱 Responsive & Aesthetic UI:** A beautifully designed frontend tailored with modern gradients, micro-animations, and fully mobile-responsive layouts.

## 🛠️ Tech Stack

**Frontend:**
- React 18, Vite
- React Router (Wouter)
- Tailwind CSS & Shadcn/UI (Design System)
- React Hook Form & Zod (Validation)
- Mapbox GL JS, Lucide Icons
- React Query (Data Fetching)

**Backend:**
- Node.js & Express
- PostgreSQL (Neon Serverless)
- Drizzle ORM
- JWT Authentication & Bcryptjs
- Monolithic Deployment ready (Frontend dynamically served by Express)

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Basic local PostgreSQL database or connection string to neon.tech 
- Mapbox Access Token

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vamsivardhanreddy-prog/Surplus-Food-Management-System.git
   cd Surplus-Food-Management-System
   ```

2. **Install dependencies:**
   This project uses `pnpm` workspaces.
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgres://user:password@hostname/dbname
   SESSION_SECRET=your_super_secret_session_key
   VITE_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
   ```

4. **Push database schema:**
   ```bash
   pnpm db:push
   ```

5. **Start the Development Servers:**
   The codebase includes concurrent scripts to fire up both API and Frontend:
   ```bash
   pnpm run dev
   ```

### 🌍 Production Deployment
The application is configured to run as a single optimized web service.

```bash
# Install packages and build frontend & backend
pnpm install
pnpm run build

# Start the production server
pnpm run start
```
*Note for Render/Heroku deployments: ensure all environment variables are properly mapped in your Cloud dashboard prior to deployment.*

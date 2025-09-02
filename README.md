# 100KTracker

## Overview

**100KTracker** is a sophisticated inventory management and tracking system for luxury watches. It provides a suite of tools for dealers and enthusiasts to manage watch inventory, track leads, analyze metrics, find deals, evaluate prices, manage contacts, and handle payments—all in a modern, animated web application.

## Main Features

- **Metrics Analysis:** Visualize and analyze performance metrics for watch inventory and sales.
- **Lead Management:** Track potential deals, monitor status, and manage interactions with leads.
- **Deal Finder (LDF):** Find luxury watch deals.
- **Target Price Evaluator (TPE):** Evaluate and compare target prices for watches.
- **Contacts Management:** Store and manage contact information for buyers, sellers, and other stakeholders.
- **Inventory Tracking:** Add, edit, and track watches in inventory, including purchase/sale details and associated costs.
- **Payments:** Create and manage invoices and payment records.

## Architecture

### Frontend

- **Framework:** React (TypeScript) with Vite for fast development/build.
- **UI Libraries:** framer-motion (animations), lucide-react (icons), radix-ui (UI components), twind/tailwind (styling).
- **State Management:** Redux Toolkit, react-redux, redux-persist.
- **Data Handling:** axios (API calls), react-hook-form (forms), dayjs (date handling).

### Backend

- **Server:** Node.js/Express (located in `backend/`)
- **Automation:** Playwright for web scraping and price evaluation (e.g., chrono24).
- **Security:** helmet, dotenv, cors.

### Other Integrations

- **Payments:** Stripe integration.
- **Browser Extension Support:** webextension-polyfill.

## How It Works

1. **Login:** Users authenticate via a login page (mocked for local dev).
2. **Dashboard:** The HomePage displays a dashboard with quick access to all tools.
3. **Tool Pages:** Each tool (e.g., Leads, Inventory, Metrics) is a React page/component, often using mock API functions for local development.
4. **Data Flow:** Data is fetched from mock APIs or the backend, stored in Redux, and displayed in interactive UI components.
5. **Backend:** Provides endpoints for automation, health checks, and persistent storage.
6. **Styling:** Uses custom Tailwind colors and modern UI/UX patterns.

## Local Development & Deployment

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

To run with backend:
`npm run dev:with-backend`

Can be deployed to platforms like Render or Netlify.

---

View your app in AI Studio: https://ai.studio/apps/drive/1MRHZ-5DjxXWES4XTY4eB3AAuaOPB53Zd

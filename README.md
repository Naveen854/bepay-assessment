# BePay — B2B Payouts Console

A full-stack B2B payouts management console built with **NestJS** (backend) and **React + Vite** (frontend), integrated with **Mesta sandbox APIs** for cross-border payout processing.

## Features

- **Authentication** — JWT + magic-link login, registration, session management
- **KYC Onboarding** — 3-step wizard: business info → document upload → verification (syncs with Mesta Sender API)
- **Beneficiary Management** — CRUD with Mesta sync, searchable table, verify status
- **Payout Flow** — Quote → Order lifecycle via Mesta Quotes/Orders APIs, cancel support
- **Transaction Ledger** — Paginated, filterable transaction list with Mesta sync (Manual Refresh)
- **Reconciliation** — CSV export of transactions from Dashboard

## Tech Stack

| Layer       | Technology                                               |
| ----------- | -------------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Zustand, React Hook Form     |
| Backend     | NestJS 11, TypeORM, PostgreSQL, Passport JWT             |
| API Client  | Axios with JWT interceptor, 401 auto-redirect            |
| Styling     | Vanilla CSS design system (dark fintech theme)           |
| Validation  | Zod (frontend), class-validator (backend)                |
| Deployment  | Docker Compose (Postgres + Backend + Frontend)           |

## Project Structure

```
bepay-assessment/
├── backend/
│   ├── src/
│   │   ├── config/            # Environment configuration
│   │   ├── database/entities/ # TypeORM entities (User, Org, Beneficiary, Payout, Transaction)
│   │   ├── mesta/             # Mesta API client service
│   │   └── modules/
│   │       ├── auth/          # JWT + magic-link authentication
│   │       ├── organization/  # Organization CRUD
│   │       ├── kyc/           # KYC sender management
│   │       ├── beneficiary/   # Beneficiary CRUD + verify
│   │       ├── payout/        # Quote → Order flow
│   │       └── transaction/   # Transaction ledger + reconciliation
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI (Button, Input, Card, Badge, Stepper, Sidebar)
│   │   ├── features/          # Feature pages (auth, kyc, beneficiary, payout, transaction, reconciliation)
│   │   ├── services/          # API service layer
│   │   └── store/             # Zustand auth store
│   └── Dockerfile
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Mesta sandbox API key/secret

### 1. Environment Variables

```bash
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=bepay
DATABASE_PASSWORD=bepay_dev_pass
DATABASE_NAME=bepay
JWT_SECRET=your-jwt-secret-here
MESTA_BASE_URL=https://sandbox.api.mesta.co/v1
MESTA_API_KEY=your-api-key
MESTA_API_SECRET=your-api-secret

# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

### 2. Run with Docker Compose

```bash
docker compose up -d
```

Backend: http://localhost:3000  
Frontend: http://localhost:5173

### 3. Run Locally (without Docker)

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method   | Path                         | Description                  |
| -------- | ---------------------------- | ---------------------------- |
| POST     | `/api/auth/register`         | Register new user            |
| POST     | `/api/auth/login`            | Login (returns JWT)          |
| POST     | `/api/auth/magic-link`       | Request magic link           |
| GET      | `/api/auth/me`               | Get current user profile     |
| POST/GET | `/api/organizations`         | Manage organizations         |
| POST     | `/api/kyc/:orgId/sender`     | Create KYC sender            |
| GET      | `/api/kyc/:orgId/status`     | Get KYC status               |
| POST     | `/api/kyc/:orgId/documents`  | Upload KYC document          |
| POST     | `/api/kyc/:orgId/verify`     | Submit for verification      |
| CRUD     | `/api/beneficiaries`         | Manage beneficiaries         |
| POST     | `/api/payouts/quote`         | Get payout quote             |
| POST     | `/api/payouts/order`         | Execute payout order         |
| GET      | `/api/payouts`               | List payouts                 |
| GET      | `/api/transactions`          | List transactions (filtered) |
| GET      | `/api/transactions/summary`  | Dashboard summary            |
| GET      | `/api/transactions/export`   | Export as CSV                |

## Design Decisions

- **Mesta sync pattern**: All financial entities are created in Mesta first, then saved locally with the Mesta ID for future reference/sync.
- **Entity-first design**: TypeORM entities define the schema; `synchronize: true` for dev (migrations recommended for prod).
- **Dark fintech theme**: Premium dark-mode UI with accent color (#6366F1 indigo), glassmorphism cards, and micro-animations.
- **Feature-based structure**: Frontend organized by domain (auth, kyc, beneficiary, payout, etc.) for maintainability.

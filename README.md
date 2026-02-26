# NexusCRM: Smart Sales Automation

A real-time Sales CRM web application featuring intelligent Round-Robin lead assignment logic, role-based Caller quotas, and an innovative Dashboard integrating Native Google Sheets Sync—completely eliminating the need for Zapier or n8n.

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
Clone the repository, then navigate to the project directory:

```bash
git clone <your-repo-link>
cd project
npm install
```

### 3. Database Initialization
This project uses **SQLite** through Prisma for zero-friction setup.

```bash
npx prisma db push
```

### 4. Running the Server Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience the Dashboard.

---

## 🏗 Development Logic & Database Structure

### Database Structure (Prisma SQLite)
The application fundamentally relies on two primary models:
1. **`Caller`**: Represents a sales representative. It maintains fields for `name`, `languages` (stored as JSON array), `assignedStates` (for regional targeting), an integer for the `dailyLimit` (quota), and `lastAssignedAt` to manage perfect round-robin balancing.
2. **`Lead`**: Represents an ingested lead from the automation flow. Contains `name`, `email`, `phone`, `state`, and optionally a `callerId` representing the foreign key to the assigned salesperson.

### Smart Assignment Engine Logic (/api/sync)
When a sheet is synced natively, the engine executes the following logic synchronously for each new row:
1. **Quota Verification**: Queries Callers and filters out those who have reached their `dailyLimit` today (checked from 00:00 AM).
2. **State/Regional Routing**: Scans `assignedStates`. If a caller operates in the lead's state, they are grouped. If *no* caller operates in that state, we gracefully fallback to the global pool of eligible callers.
3. **Round-Robin Fair Distribution**: We sort the finalized candidate pool by `lastAssignedAt` in ascending order. The caller who has waited the longest receives the lead. We immediately update their timestamp.
4. **Unassigned Fallback**: Should *every single representative* be capped out, the lead is safely ingested but left `Unassigned` so admins can re-assign later.

---

## ⚡ How Automation is Triggered 

*(Zero Zapier/n8n dependencies)*

1. Navigate to the **Dashboard**.
2. Locate the **Native Google Sheets Sync** widget at the top.
3. Paste a **Publicly Viewable** Google Sheet URL. (Ensure it contains headers like `Name`, `Phone`, `Email`, and `State`).
4. Click **Sync Sheet**. 
5. The API downloads the public CSV export from Google Sheets, uses `papaparse` to format the strings, performs local SQLite query deduplication (checking existing emails/phones), and ingests all new leads through the Smart Assignment Route visually reflecting the changes via SWR auto-polling.

### 📸 Automation Screenshot
![Native Sync Dashboard](./public/screenshot.png)

---

## 🔮 What I Would Improve With More Time

1. **WebSockets for Absolute Real-time**: Swap `swr` interval polling for native WebSocket (e.g. Socket.io/Pusher) broadcasting so UI updates are 0ms instant to all active dashboard viewers when a server sync resolves.
2. **PostgreSQL Migration**: Swap out SQLite for Postgres to handle highly concurrent sync requests safely, avoiding potential SQLite write locks if massive sheets arrive within milliseconds.
3. **Admin Controls & Editing**: Provide full UI allowing managers to manually edit existing caller quotas on the fly, and a drag-and-drop kanban board to reassign `Unassigned` overflow leads to new reps the next morning.
4. **OAuth Google Integration**: Rather than using public CSV exports, implement full Google OAuth so users can sync private Google Sheets dynamically.

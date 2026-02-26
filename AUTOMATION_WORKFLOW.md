# Custom Native Webhook & Automation Design

This document explains the custom, in-house automation logic we built to avoid reliance on third-party tools like n8n or Zapier.

## 1. Native Google Sheets Fetching
Instead of waiting for an external platform to push changes, the dashboard contains a **Native Google Sheets Sync** module.
- The user inputs the URL of any public Google Sheet.
- The `api/sync/route.ts` API intercepts this URL, extracts the document ID, and calls Google Docs API for a `.csv` export.
- It leverages server-side **Papaparse** to parse the CSV string securely.

## 2. In-Memory Deduplication
Before executing assignment algorithms, the sync module queries the SQLite database for existing emails and phone numbers.
Using a memory cache `Set` of existing contacts, it filters newly fetched rows avoiding thousands of superfluous reads against the DB and ensuring we don't duplicate past ingestions.

## 3. Smart Assignment Workflow 

Once new leads are detected, the system loops through them applying precise logic:

### Step 1: Quota Verification
We query all Callers. For each Caller, we count how many leads they received *today* (from 00:00). If that count equals or exceeds their `dailyLimit`, they are **eliminated** from the candidate pool for that lead.

### Step 2: Geographic Routing (State-based)
From the eligible pool, we filter Callers whose `assignedStates` array includes the lead's state. 
- **Match Found**: If 1 or more callers match, they proceed to Step 3.
- **Match Not Found**: If no caller matches the state (e.g. Goa), we **fallback** and pass the entire eligible pool into Step 3 to ensure the lead isn't lost.

### Step 3: Round-Robin Distribution
We sort the final candidate pool by `lastAssignedAt` in ascending order (oldest first).
The caller at index `0` is mathematically guaranteed to be the one waiting the longest. The lead is assigned to them, and their `lastAssignedAt` timestamp is updated to `now()`.

### Step 4: Crisis Fallback (Global Cap Reached)
If *every single caller in the company* has hit their maximum daily quota, the lead is safely ingested but left `Unassigned` so it is not lost. The admin can manually view it in the dashboard.

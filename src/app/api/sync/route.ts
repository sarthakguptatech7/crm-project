import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(req: Request) {
    try {
        const { sheetUrl } = await req.json();

        if (!sheetUrl) {
            return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 });
        }

        // Extract Document ID
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!match || !match[1]) {
            return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 });
        }
        const sheetId = match[1];

        // Fetch public CSV export
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const response = await fetch(csvUrl);
        if (!response.ok) {
            return NextResponse.json({ error: 'Could not fetch Google Sheet. Make sure "Anyone with the link" has Viewer access.' }, { status: 400 });
        }

        const csvText = await response.text();
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

        if (parsed.errors.length && parsed.data.length === 0) {
            return NextResponse.json({ error: 'Failed to parse CSV from Sheet' }, { status: 500 });
        }

        const rows = parsed.data as any[];
        const newLeadsIngested = [];

        // Deduplication optimization
        const existingLeads = await prisma.lead.findMany({ select: { email: true, phone: true } });
        const existingEmails = new Set(existingLeads.map(l => l.email).filter(Boolean));
        const existingPhones = new Set(existingLeads.map(l => l.phone).filter(Boolean));

        for (const row of rows) {
            const getVal = (keys: string[]) => {
                const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
                return key ? row[key] : '';
            };

            const name = getVal(['name', 'fullname', 'first name']);
            const email = getVal(['email', 'email address']);
            const phone = getVal(['phone', 'phone number', 'contact']);
            const state = getVal(['state', 'region', 'location']);

            if (!name || !state) continue; // Skip rows missing critical data

            // Strict duplication check to allow safe repeat syncing
            if (email && existingEmails.has(email)) continue;
            if (phone && existingPhones.has(phone)) continue;

            // Smart Assignment Logic
            const allCallers = await prisma.caller.findMany();
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const eligibleCallers = [];
            for (const caller of allCallers) {
                const leadsToday = await prisma.lead.count({
                    where: { callerId: caller.id, createdAt: { gte: startOfToday } },
                });
                if (leadsToday < caller.dailyLimit) {
                    eligibleCallers.push(caller);
                }
            }

            const stateMatchers = eligibleCallers.filter(caller => {
                try {
                    const states = JSON.parse(caller.assignedStates);
                    if (Array.isArray(states)) {
                        return states.map((s: string) => s.toLowerCase()).includes(state.toLowerCase());
                    }
                    return false;
                } catch {
                    return caller.assignedStates.toLowerCase().includes(state.toLowerCase());
                }
            });

            let targetCallers = stateMatchers.length > 0 ? stateMatchers : eligibleCallers;

            let assignedCallerId = null;
            if (targetCallers.length > 0) {
                targetCallers.sort((a, b) => new Date(a.lastAssignedAt).getTime() - new Date(b.lastAssignedAt).getTime());
                const selectedCaller = targetCallers[0];
                assignedCallerId = selectedCaller.id;

                await prisma.caller.update({
                    where: { id: selectedCaller.id },
                    data: { lastAssignedAt: new Date() },
                });
            }

            const lead = await prisma.lead.create({
                data: { name, email, phone, state, callerId: assignedCallerId },
                include: { caller: true },
            });

            newLeadsIngested.push(lead);
            if (email) existingEmails.add(email);
            if (phone) existingPhones.add(phone);
        }

        return NextResponse.json({ ingested: newLeadsIngested.length, leads: newLeadsIngested }, { status: 200 });
    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            // Some webhooks send form data or it's just raw so attempt parse
            body = rawBody;
        }

        const { name, email, phone, state } = typeof body === 'object' ? body : {} as any;

        if (!name || !state) {
            return NextResponse.json({ error: 'Name and state are required' }, { status: 400 });
        }

        // 1. Get all callers
        const allCallers = await prisma.caller.findMany();

        // 2. Figure out start of today for cap checking
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // 3. Gather eligibility
        const eligibleCallers = [];
        for (const caller of allCallers) {
            // Check daily leads count
            const leadsToday = await prisma.lead.count({
                where: {
                    callerId: caller.id,
                    createdAt: {
                        gte: startOfToday,
                    },
                },
            });

            if (leadsToday < caller.dailyLimit) {
                eligibleCallers.push(caller);
            }
        }

        // 4. Exact State Match Matchers
        // Parse assignedStates (stored as JSON string or comma separated)
        const stateMatchers = eligibleCallers.filter(caller => {
            try {
                const states = JSON.parse(caller.assignedStates);
                if (Array.isArray(states)) {
                    return states.map(s => s.toLowerCase()).includes(state.toLowerCase());
                }
                return false;
            } catch {
                // Fallback to comma separation
                return caller.assignedStates.toLowerCase().includes(state.toLowerCase());
            }
        });

        let targetCallers = stateMatchers.length > 0 ? stateMatchers : eligibleCallers;

        // 5. Select the best caller using Round Robin logic (oldest lastAssignedAt)
        let assignedCallerId = null;
        if (targetCallers.length > 0) {
            targetCallers.sort((a, b) => new Date(a.lastAssignedAt).getTime() - new Date(b.lastAssignedAt).getTime());
            const selectedCaller = targetCallers[0];
            assignedCallerId = selectedCaller.id;

            // Update caller's lastAssignedAt
            await prisma.caller.update({
                where: { id: selectedCaller.id },
                data: { lastAssignedAt: new Date() },
            });
        }

        // 6. Create the Lead
        const lead = await prisma.lead.create({
            data: {
                name,
                email: email || '',
                phone: phone || '',
                state,
                callerId: assignedCallerId,
            },
            include: {
                caller: true,
            },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

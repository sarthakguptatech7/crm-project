import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const callers = await prisma.caller.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(callers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, role, languages, dailyLimit, assignedStates } = body;

        if (!name || !role || !languages || dailyLimit === undefined || !assignedStates) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const caller = await prisma.caller.create({
            data: {
                name,
                role,
                languages: Array.isArray(languages) ? JSON.stringify(languages) : languages,
                dailyLimit: Number(dailyLimit),
                assignedStates: Array.isArray(assignedStates) ? JSON.stringify(assignedStates) : assignedStates,
            },
        });

        return NextResponse.json(caller, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

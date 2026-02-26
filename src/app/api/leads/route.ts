import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            include: { caller: true },
        });
        return NextResponse.json(leads);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Optional: allow manual lead creation or update
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, state, callerId } = body;

        const lead = await prisma.lead.create({
            data: { name, email, phone, state, callerId },
            include: { caller: true },
        });

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

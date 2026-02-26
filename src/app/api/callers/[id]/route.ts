import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const caller = await prisma.caller.findUnique({
            where: { id },
        });
        if (!caller) return NextResponse.json({ error: 'Caller not found' }, { status: 404 });
        return NextResponse.json(caller);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, role, languages, dailyLimit, assignedStates } = body;

        const caller = await prisma.caller.update({
            where: { id },
            data: {
                name,
                role,
                languages: Array.isArray(languages) ? JSON.stringify(languages) : languages,
                dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined,
                assignedStates: Array.isArray(assignedStates) ? JSON.stringify(assignedStates) : assignedStates,
            },
        });

        return NextResponse.json(caller);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.caller.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const response = await fetch(
            `${process.env.BACKEND_URL}/api/projects/${params.projectId}/latex`,
            {
                headers: {
                    'Authorization': `Bearer ${(session.user as any).token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch LaTeX documents');
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Error fetching LaTeX documents:', error);
        return new Response(error.message, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();

        const response = await fetch(
            `${process.env.BACKEND_URL}/api/projects/${params.projectId}/latex`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${(session.user as any).token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create LaTeX document');
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Error creating LaTeX document:', error);
        return new Response(error.message, { status: 500 });
    }
} 
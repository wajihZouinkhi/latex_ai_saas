import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string; documentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const response = await fetch(
            `${process.env.BACKEND_URL}/api/projects/${params.projectId}/latex/${params.documentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${(session.user as any).token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch LaTeX document');
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Error fetching LaTeX document:', error);
        return new Response(error.message, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { projectId: string; documentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await req.json();

        const response = await fetch(
            `${process.env.BACKEND_URL}/api/projects/${params.projectId}/latex/${params.documentId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${(session.user as any).token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update LaTeX document');
        }

        const data = await response.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Error updating LaTeX document:', error);
        return new Response(error.message, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string; documentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const response = await fetch(
            `${process.env.BACKEND_URL}/api/projects/${params.projectId}/latex/${params.documentId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${(session.user as any).token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete LaTeX document');
        }

        return new Response(null, { status: 204 });
    } catch (error: any) {
        console.error('Error deleting LaTeX document:', error);
        return new Response(error.message, { status: 500 });
    }
} 
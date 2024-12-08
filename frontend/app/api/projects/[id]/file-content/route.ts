import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import axios from 'axios';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the file path from the URL parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Get the file content from the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const response = await axios.get(
      `${backendUrl}/api/projects/${params.id}/file-content`,
      {
        params: { path },
        headers: {
          Authorization: `Bearer ${(session.user as any).token}`,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch file content');
    }

    return NextResponse.json({
      content: response.data.data.content,
      path: path,
    });
  } catch (error: any) {
    console.error('Error fetching file content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch file content' },
      { status: error.response?.status || 500 }
    );
  }
} 
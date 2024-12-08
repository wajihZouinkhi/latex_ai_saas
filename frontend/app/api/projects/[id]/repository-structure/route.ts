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

    // Get the project details from the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const response = await axios.get(
      `${backendUrl}/api/projects/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${(session.user as any).token}`,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch project');
    }

    const project = response.data.data.project;
    const fileTree = project.fileTree?.main || {};

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      repositoryName: project.repositoryName,
      repositoryUrl: project.repositoryUrl,
      fileTree: fileTree,
      status: project.status,
      importStatus: project.status,
      isAccessible: project.accessible
    });
  } catch (error: any) {
    console.error('Error fetching repository structure:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repository structure' },
      { status: error.response?.status || 500 }
    );
  }
} 
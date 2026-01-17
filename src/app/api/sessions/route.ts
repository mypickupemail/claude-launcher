import { NextRequest, NextResponse } from 'next/server';
import { getRecentSessions, getProjectPaths } from '@/lib/claude-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const pathsOnly = searchParams.get('paths') === 'true';

    // Return just project paths for the filter dropdown
    if (pathsOnly) {
      const paths = await getProjectPaths();
      return NextResponse.json({ paths });
    }

    // Return sessions, optionally filtered by project
    const sessions = await getRecentSessions(limit, project || undefined);

    return NextResponse.json({
      sessions,
      count: sessions.length,
    });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

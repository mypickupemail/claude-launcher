import { NextRequest, NextResponse } from 'next/server';
import { openTerminal, resumeSession } from '@/lib/terminal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectPath, count, sessionId } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: 'projectPath is required' },
        { status: 400 }
      );
    }

    // Resume a specific session
    if (sessionId) {
      await resumeSession({
        sessionId,
        cwd: projectPath,
      });

      return NextResponse.json({
        success: true,
        message: `Resumed session ${sessionId}`,
      });
    }

    // Open new terminal(s)
    const terminalCount = Math.min(Math.max(count || 1, 1), 5); // Limit 1-5

    await openTerminal({
      cwd: projectPath,
      count: terminalCount,
    });

    return NextResponse.json({
      success: true,
      message: `Opened ${terminalCount} terminal(s) in ${projectPath}`,
    });

  } catch (error) {
    console.error('Error opening terminal:', error);
    return NextResponse.json(
      { error: 'Failed to open terminal' },
      { status: 500 }
    );
  }
}

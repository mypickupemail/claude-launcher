import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface OpenTerminalOptions {
  cwd: string;
  command?: string;
  count?: number;
}

export interface ResumeSessionOptions {
  sessionId: string;
  cwd: string;
}

// Escape single quotes for AppleScript
function escapeForAppleScript(str: string): string {
  return str.replace(/'/g, "'\"'\"'");
}

// Open Terminal.app with a command
export async function openTerminal(options: OpenTerminalOptions): Promise<void> {
  const { cwd, command = 'claude --dangerously-skip-permissions', count = 1 } = options;

  const escapedCwd = escapeForAppleScript(cwd);
  const escapedCommand = escapeForAppleScript(command);
  const cmdStr = `cd '${escapedCwd}' && ${escapedCommand}`;

  if (count === 1) {
    const script = `
      tell application "Terminal"
        activate
        do script "${cmdStr}"
      end tell
    `;
    await execAsync(`osascript -e '${script}'`);
  } else {
    // Open multiple terminals as tabs in the same window
    const scriptLines = [
      'tell application "Terminal"',
      '  activate',
      `  do script "${cmdStr}"`,
    ];

    for (let i = 1; i < count; i++) {
      scriptLines.push('  delay 0.5');
      scriptLines.push('  tell application "System Events" to keystroke "t" using command down');
      scriptLines.push('  delay 0.5');
      scriptLines.push(`  do script "${cmdStr}" in front window`);
    }

    scriptLines.push('end tell');
    const script = scriptLines.join('\n');
    await execAsync(`osascript -e '${script}'`);
  }
}

// Resume a Claude session
export async function resumeSession(options: ResumeSessionOptions): Promise<void> {
  const { sessionId, cwd } = options;

  const escapedCwd = escapeForAppleScript(cwd);
  const escapedSessionId = escapeForAppleScript(sessionId);

  const script = `
    tell application "Terminal"
      activate
      do script "cd '${escapedCwd}' && claude --dangerously-skip-permissions --resume '${escapedSessionId}'"
    end tell
  `;

  await execAsync(`osascript -e '${script}'`);
}

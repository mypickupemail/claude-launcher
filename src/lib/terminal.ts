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

  const script = `
    tell application "Terminal"
      activate
      do script "cd '${escapedCwd}' && ${escapedCommand}"
    end tell
  `;

  // Open terminals sequentially with small delay to avoid race conditions
  for (let i = 0; i < count; i++) {
    await execAsync(`osascript -e '${script}'`);
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
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

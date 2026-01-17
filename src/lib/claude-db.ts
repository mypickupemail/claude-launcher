import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import readline from 'readline';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const DB_PATH = path.join(CLAUDE_DIR, '__store.db');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

export interface Session {
  session_id: string;
  first_message: number;
  last_message: number;
  message_count: number;
  cwd: string;
  summary: string | null;
}

// Decode the encoded project path (e.g., "-Users-kenneth-Documents" -> "/Users/kenneth/Documents")
function decodeProjectPath(encoded: string): string {
  // Replace leading dash and all dashes with slashes
  return encoded.replace(/^-/, '/').replace(/-/g, '/');
}

// Read session info from a JSONL file
async function readSessionFromJsonl(filePath: string): Promise<{
  sessionId: string;
  summary: string | null;
  cwd: string;
  firstMessage: number;
  lastMessage: number;
  messageCount: number;
} | null> {
  try {
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let summary: string | null = null;
    let cwd: string = '';
    let sessionId: string = '';
    let firstTimestamp: number = 0;
    let lastTimestamp: number = 0;
    let messageCount = 0;

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const data = JSON.parse(line);

        // Get summary from summary line
        if (data.type === 'summary' && data.summary) {
          summary = data.summary;
        }

        // Get session info from message lines (only take the first one)
        if (data.sessionId && data.cwd && !cwd) {
          sessionId = data.sessionId;
          cwd = data.cwd;
        }

        // Track timestamps
        if (data.timestamp) {
          const ts = new Date(data.timestamp).getTime();
          if (!firstTimestamp || ts < firstTimestamp) {
            firstTimestamp = ts;
          }
          if (ts > lastTimestamp) {
            lastTimestamp = ts;
          }
        }

        // Count user/assistant messages
        if (data.type === 'user' || data.type === 'assistant') {
          messageCount++;
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    rl.close();
    fileStream.close();

    if (!sessionId) {
      // Extract session ID from filename
      const filename = path.basename(filePath, '.jsonl');
      if (filename.match(/^[0-9a-f-]{36}$/)) {
        sessionId = filename;
      }
    }

    if (!sessionId) return null;

    // Use file modification time as fallback
    if (!lastTimestamp) {
      lastTimestamp = stats.mtimeMs;
    }
    if (!firstTimestamp) {
      firstTimestamp = stats.birthtimeMs || lastTimestamp;
    }

    return {
      sessionId,
      summary,
      cwd,
      firstMessage: firstTimestamp,
      lastMessage: lastTimestamp,
      messageCount: messageCount || 1,
    };
  } catch (error) {
    console.error(`Error reading JSONL file ${filePath}:`, error);
    return null;
  }
}

// Get sessions from JSONL files in projects directory
async function getSessionsFromJsonl(projectPath?: string): Promise<Session[]> {
  const sessions: Session[] = [];

  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      return sessions;
    }

    const projectDirs = fs.readdirSync(PROJECTS_DIR);

    for (const projectDir of projectDirs) {
      const projectFullPath = path.join(PROJECTS_DIR, projectDir);
      const stat = fs.statSync(projectFullPath);

      if (!stat.isDirectory()) continue;

      // Read all JSONL files in this project directory
      const files = fs.readdirSync(projectFullPath);
      const jsonlFiles = files.filter(f =>
        f.endsWith('.jsonl') &&
        f.match(/^[0-9a-f-]{36}\.jsonl$/) // Only session files, not agent files
      );

      for (const jsonlFile of jsonlFiles) {
        const filePath = path.join(projectFullPath, jsonlFile);
        const sessionInfo = await readSessionFromJsonl(filePath);

        if (sessionInfo && sessionInfo.cwd) {
          // Filter by project path if specified (use actual cwd from file)
          if (projectPath && sessionInfo.cwd !== projectPath) continue;

          sessions.push({
            session_id: sessionInfo.sessionId,
            first_message: sessionInfo.firstMessage,
            last_message: sessionInfo.lastMessage,
            message_count: sessionInfo.messageCount,
            cwd: sessionInfo.cwd,
            summary: sessionInfo.summary,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading JSONL sessions:', error);
  }

  return sessions;
}

// Get sessions from SQLite database
function getSessionsFromDb(limit: number, projectPath?: string): Session[] {
  let db: Database.Database | null = null;

  try {
    if (!fs.existsSync(DB_PATH)) {
      return [];
    }

    db = new Database(DB_PATH, { readonly: true });

    let query = `
      SELECT
        bm.session_id,
        MIN(bm.timestamp) as first_message,
        MAX(bm.timestamp) as last_message,
        COUNT(*) as message_count,
        MAX(bm.cwd) as cwd,
        cs.summary
      FROM base_messages bm
      LEFT JOIN conversation_summaries cs ON cs.leaf_uuid = (
        SELECT uuid FROM base_messages sub
        WHERE sub.session_id = bm.session_id
        ORDER BY sub.timestamp DESC LIMIT 1
      )
    `;

    const params: (string | number)[] = [];

    if (projectPath) {
      query += ` WHERE bm.cwd = ?`;
      params.push(projectPath);
    }

    query += `
      GROUP BY bm.session_id
      ORDER BY last_message DESC
      LIMIT ?
    `;
    params.push(limit);

    const sessions = db.prepare(query).all(...params) as Session[];
    return sessions;
  } catch (error) {
    console.error('Error reading Claude database:', error);
    return [];
  } finally {
    if (db) {
      db.close();
    }
  }
}

// Get recent Claude sessions from both JSONL files and SQLite
export async function getRecentSessions(limit: number = 50, projectPath?: string): Promise<Session[]> {
  // Get sessions from both sources
  const [jsonlSessions, dbSessions] = await Promise.all([
    getSessionsFromJsonl(projectPath),
    Promise.resolve(getSessionsFromDb(limit * 2, projectPath)),
  ]);

  // Merge and deduplicate (prefer JSONL as it's more recent)
  const sessionMap = new Map<string, Session>();

  // Add DB sessions first (will be overwritten by JSONL if exists)
  for (const session of dbSessions) {
    sessionMap.set(session.session_id, session);
  }

  // Add JSONL sessions (overwrites DB sessions)
  for (const session of jsonlSessions) {
    const existing = sessionMap.get(session.session_id);
    if (existing) {
      // Merge: keep the better data
      sessionMap.set(session.session_id, {
        ...existing,
        ...session,
        summary: session.summary || existing.summary,
        message_count: Math.max(session.message_count, existing.message_count),
      });
    } else {
      sessionMap.set(session.session_id, session);
    }
  }

  // Sort by last_message descending and limit
  const allSessions = Array.from(sessionMap.values())
    .sort((a, b) => b.last_message - a.last_message)
    .slice(0, limit);

  return allSessions;
}

// Get unique project paths from both sources
export async function getProjectPaths(): Promise<string[]> {
  const pathSet = new Set<string>();

  // Get from JSONL files (read actual cwd from files, not decoded directory names)
  try {
    if (fs.existsSync(PROJECTS_DIR)) {
      const projectDirs = fs.readdirSync(PROJECTS_DIR);
      for (const dir of projectDirs) {
        const fullPath = path.join(PROJECTS_DIR, dir);
        if (fs.statSync(fullPath).isDirectory()) {
          // Read one JSONL file to get the actual cwd
          const files = fs.readdirSync(fullPath);
          const jsonlFile = files.find(f =>
            f.endsWith('.jsonl') &&
            f.match(/^[0-9a-f-]{36}\.jsonl$/)
          );
          if (jsonlFile) {
            const filePath = path.join(fullPath, jsonlFile);
            const sessionInfo = await readSessionFromJsonl(filePath);
            if (sessionInfo?.cwd) {
              pathSet.add(sessionInfo.cwd);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading project directories:', error);
  }

  // Get from SQLite
  let db: Database.Database | null = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      db = new Database(DB_PATH, { readonly: true });
      const result = db.prepare(`
        SELECT DISTINCT cwd
        FROM base_messages
        WHERE cwd IS NOT NULL AND cwd != ''
        ORDER BY cwd
      `).all() as { cwd: string }[];

      for (const r of result) {
        pathSet.add(r.cwd);
      }
    }
  } catch (error) {
    console.error('Error reading project paths from DB:', error);
  } finally {
    if (db) {
      db.close();
    }
  }

  return Array.from(pathSet).sort();
}

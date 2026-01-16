import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const DB_PATH = path.join(os.homedir(), '.claude', '__store.db');

export interface Session {
  session_id: string;
  first_message: number;
  last_message: number;
  message_count: number;
  cwd: string;
  summary: string | null;
}

export interface SessionWithProject extends Session {
  project_name: string;
}

// Get recent Claude sessions
export function getRecentSessions(limit: number = 50, projectPath?: string): Session[] {
  let db: Database.Database | null = null;

  try {
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

// Get unique project paths from sessions
export function getProjectPaths(): string[] {
  let db: Database.Database | null = null;

  try {
    db = new Database(DB_PATH, { readonly: true });

    const result = db.prepare(`
      SELECT DISTINCT cwd
      FROM base_messages
      WHERE cwd IS NOT NULL AND cwd != ''
      ORDER BY cwd
    `).all() as { cwd: string }[];

    return result.map(r => r.cwd);

  } catch (error) {
    console.error('Error reading project paths:', error);
    return [];
  } finally {
    if (db) {
      db.close();
    }
  }
}


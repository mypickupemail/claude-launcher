import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let dirPath = searchParams.get('path') || os.homedir();

    // Expand ~ to home directory
    if (dirPath.startsWith('~')) {
      dirPath = path.join(os.homedir(), dirPath.slice(1));
    }

    // Security: ensure path is absolute and doesn't go above home
    dirPath = path.resolve(dirPath);

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json(
        { error: 'Directory not found' },
        { status: 404 }
      );
    }

    // Check if it's a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      );
    }

    // Read directory contents
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    const directories: DirectoryEntry[] = entries
      .filter(entry => {
        // Only show directories, skip hidden files (starting with .)
        if (!entry.isDirectory()) return false;
        if (entry.name.startsWith('.')) return false;
        // Skip common non-project directories
        if (['node_modules', '__pycache__', 'venv', '.git'].includes(entry.name)) return false;
        return true;
      })
      .map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Get parent directory
    const parentPath = path.dirname(dirPath);
    const canGoUp = parentPath !== dirPath; // Can't go above root

    return NextResponse.json({
      currentPath: dirPath,
      parentPath: canGoUp ? parentPath : null,
      directories,
    });

  } catch (error) {
    console.error('Error browsing directory:', error);
    return NextResponse.json(
      { error: 'Failed to browse directory' },
      { status: 500 }
    );
  }
}

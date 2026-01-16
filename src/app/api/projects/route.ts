import { NextRequest, NextResponse } from 'next/server';
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getNextColor,
  type Project,
} from '@/lib/config';

// GET - List all projects
export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Add a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path, defaultTerminals } = body;

    if (!name || !path) {
      return NextResponse.json(
        { error: 'name and path are required' },
        { status: 400 }
      );
    }

    const existingProjects = getProjects();

    // Check for duplicate path
    if (existingProjects.some(p => p.path === path)) {
      return NextResponse.json(
        { error: 'A project with this path already exists' },
        { status: 400 }
      );
    }

    const newProject = addProject({
      name,
      path,
      color: body.color || getNextColor(existingProjects),
      defaultTerminals: defaultTerminals || 1,
    });

    return NextResponse.json({
      success: true,
      project: newProject,
    });

  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json(
      { error: 'Failed to add project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updated = updateProject(id, updates as Partial<Project>);

    if (!updated) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: updated,
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const deleted = deleteProject(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted',
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

import fs from 'fs';
import path from 'path';
import { PROJECT_COLORS } from './constants';

const CONFIG_DIR = path.join(process.cwd(), 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'projects.json');

export interface Project {
  id: string;
  name: string;
  path: string;
  color: string;
  defaultTerminals: number;
}

export interface ProjectsConfig {
  projects: Project[];
}

// Ensure config directory and file exist
function ensureConfig(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: ProjectsConfig = { projects: [] };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

// Read projects config
export function getProjects(): Project[] {
  try {
    ensureConfig();
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config: ProjectsConfig = JSON.parse(content);
    return config.projects;
  } catch (error) {
    console.error('Error reading projects config:', error);
    return [];
  }
}

// Save projects config
export function saveProjects(projects: Project[]): void {
  ensureConfig();
  const config: ProjectsConfig = { projects };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Add a new project
export function addProject(project: Omit<Project, 'id'>): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

// Update a project
export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);

  if (index === -1) return null;

  projects[index] = { ...projects[index], ...updates };
  saveProjects(projects);
  return projects[index];
}

// Delete a project
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);

  if (filtered.length === projects.length) return false;

  saveProjects(filtered);
  return true;
}

// Get next suggested color
export function getNextColor(existingProjects: Project[]): string {
  const usedColors = new Set(existingProjects.map(p => p.color));
  const available = PROJECT_COLORS.find(c => !usedColors.has(c));
  return available || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
}

import { db } from './db.js';

// Project data interface
export interface ProjectData {
  project_name: string;
  project_path?: string;
  project_number?: string;
  project_address?: string;
  client_name?: string;
  project_status?: string;
  author?: string;
  metadata?: Record<string, any>;
}

// Room data interface
export interface RoomData {
  room_id: string;
  room_name?: string;
  room_number?: string;
  department?: string;
  level?: string;
  area?: number;
  perimeter?: number;
  occupancy?: string;
  comments?: string;
  metadata?: Record<string, any>;
}

// Store or update project data
export function storeProject(data: ProjectData): number {
  const timestamp = Date.now();
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  // Check if project already exists
  const existingProject = db.prepare(
    'SELECT id FROM projects WHERE project_name = ?'
  ).get(data.project_name) as { id: number } | undefined;

  if (existingProject) {
    // Update existing project
    db.prepare(`
      UPDATE projects SET
        project_path = ?,
        project_number = ?,
        project_address = ?,
        client_name = ?,
        project_status = ?,
        author = ?,
        last_updated = ?,
        metadata = ?
      WHERE id = ?
    `).run(
      data.project_path || null,
      data.project_number || null,
      data.project_address || null,
      data.client_name || null,
      data.project_status || null,
      data.author || null,
      timestamp,
      metadata,
      existingProject.id
    );
    return existingProject.id;
  } else {
    // Insert new project
    const result = db.prepare(`
      INSERT INTO projects (
        project_name, project_path, project_number, project_address,
        client_name, project_status, author, timestamp, last_updated, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.project_name,
      data.project_path || null,
      data.project_number || null,
      data.project_address || null,
      data.client_name || null,
      data.project_status || null,
      data.author || null,
      timestamp,
      timestamp,
      metadata
    );
    return result.lastInsertRowid as number;
  }
}

// Store or update room data
export function storeRoom(projectId: number, data: RoomData): number {
  const timestamp = Date.now();
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  // Check if room already exists
  const existingRoom = db.prepare(
    'SELECT id FROM rooms WHERE project_id = ? AND room_id = ?'
  ).get(projectId, data.room_id) as { id: number } | undefined;

  if (existingRoom) {
    // Update existing room
    db.prepare(`
      UPDATE rooms SET
        room_name = ?,
        room_number = ?,
        department = ?,
        level = ?,
        area = ?,
        perimeter = ?,
        occupancy = ?,
        comments = ?,
        timestamp = ?,
        metadata = ?
      WHERE id = ?
    `).run(
      data.room_name || null,
      data.room_number || null,
      data.department || null,
      data.level || null,
      data.area || null,
      data.perimeter || null,
      data.occupancy || null,
      data.comments || null,
      timestamp,
      metadata,
      existingRoom.id
    );
    return existingRoom.id;
  } else {
    // Insert new room
    const result = db.prepare(`
      INSERT INTO rooms (
        project_id, room_id, room_name, room_number, department,
        level, area, perimeter, occupancy, comments, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      projectId,
      data.room_id,
      data.room_name || null,
      data.room_number || null,
      data.department || null,
      data.level || null,
      data.area || null,
      data.perimeter || null,
      data.occupancy || null,
      data.comments || null,
      timestamp,
      metadata
    );
    return result.lastInsertRowid as number;
  }
}

// Store multiple rooms at once
export function storeRoomsBatch(projectId: number, rooms: RoomData[]): number {
  const insertMany = db.transaction((roomsData: RoomData[]) => {
    let count = 0;
    for (const room of roomsData) {
      storeRoom(projectId, room);
      count++;
    }
    return count;
  });

  return insertMany(rooms);
}

// Get all projects
export function getAllProjects() {
  const projects = db.prepare(`
    SELECT
      id, project_name, project_path, project_number, project_address,
      client_name, project_status, author, timestamp, last_updated, metadata
    FROM projects
    ORDER BY last_updated DESC
  `).all();

  return projects.map((p: any) => ({
    ...p,
    metadata: p.metadata ? JSON.parse(p.metadata) : null,
    timestamp: new Date(p.timestamp).toISOString(),
    last_updated: new Date(p.last_updated).toISOString()
  }));
}

// Get project by ID
export function getProjectById(projectId: number) {
  const project = db.prepare(`
    SELECT
      id, project_name, project_path, project_number, project_address,
      client_name, project_status, author, timestamp, last_updated, metadata
    FROM projects
    WHERE id = ?
  `).get(projectId) as any;

  if (!project) return null;

  return {
    ...project,
    metadata: project.metadata ? JSON.parse(project.metadata) : null,
    timestamp: new Date(project.timestamp).toISOString(),
    last_updated: new Date(project.last_updated).toISOString()
  };
}

// Get project by name
export function getProjectByName(projectName: string) {
  const project = db.prepare(`
    SELECT
      id, project_name, project_path, project_number, project_address,
      client_name, project_status, author, timestamp, last_updated, metadata
    FROM projects
    WHERE project_name = ?
  `).get(projectName) as any;

  if (!project) return null;

  return {
    ...project,
    metadata: project.metadata ? JSON.parse(project.metadata) : null,
    timestamp: new Date(project.timestamp).toISOString(),
    last_updated: new Date(project.last_updated).toISOString()
  };
}

// Get rooms by project ID
export function getRoomsByProjectId(projectId: number) {
  const rooms = db.prepare(`
    SELECT
      id, project_id, room_id, room_name, room_number, department,
      level, area, perimeter, occupancy, comments, timestamp, metadata
    FROM rooms
    WHERE project_id = ?
    ORDER BY room_number
  `).all(projectId);

  return rooms.map((r: any) => ({
    ...r,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    timestamp: new Date(r.timestamp).toISOString()
  }));
}

// Get all rooms with project info
export function getAllRoomsWithProject() {
  const rooms = db.prepare(`
    SELECT
      r.id, r.project_id, r.room_id, r.room_name, r.room_number,
      r.department, r.level, r.area, r.perimeter, r.occupancy,
      r.comments, r.timestamp, r.metadata,
      p.project_name, p.project_number
    FROM rooms r
    JOIN projects p ON r.project_id = p.id
    ORDER BY p.project_name, r.room_number
  `).all();

  return rooms.map((r: any) => ({
    ...r,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
    timestamp: new Date(r.timestamp).toISOString()
  }));
}

// Delete project (and all its rooms due to CASCADE)
export function deleteProject(projectId: number): boolean {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  return result.changes > 0;
}

// Get database statistics
export function getStats() {
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };

  return {
    total_projects: projectCount.count,
    total_rooms: roomCount.count
  };
}

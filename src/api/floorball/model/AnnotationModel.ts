export interface Annotation {
  annotationId: number;
  taskId: string;
  key: string;
  frameId: number;
  trackId: number;
  tlwh: { x: number; y: number; width: number; height: number };
  framePath: string;
  targetImagePath: string;
  action: string; // e.g., "assign", "keep_new", "ignore"
  assignedTrackId?: number;
  role?: string;
}

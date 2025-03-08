export interface NeedAnnotation {
  annotationId: number;
  taskId: string;
  frameId: number;
  trackId: number;
  tlwh: { x: number; y: number; width: number; height: number };
  framePath: string;
  targetImagePath: string;
  status: string; // "pending" or "completed"
}

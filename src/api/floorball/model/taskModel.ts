export interface Task {
  taskId: string;
  videoPath: string;
  status: string; // "processing"
  progress: number;
  currentFrame: number;
  resultPath?: string | null;
}

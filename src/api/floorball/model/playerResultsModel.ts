export interface PlayerResults {
  id: number;
  playerId: number;
  taskId: string;
  trackPath: string;
  totalMovement: number;
  changeDirectionTimes: number;
  speedList: string;
  accelerationList: string;
  highIntensityRunningTime: number;
  heatMapPath: string;
  turnTime: number;
}

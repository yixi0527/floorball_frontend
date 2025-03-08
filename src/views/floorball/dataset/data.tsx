import { GetPlayerModel } from '@/api/floorball/model/playerModel';

export const fetchPlayerData = async (): Promise<any[]> => {
  const response = await fetch('/api/playerdata');
  const data: GetPlayerModel[] = await response.json();
  // 格式化数据
  const result = data.map((player) => ({
    playerId: player.playerId,
    playerName: player.playerName,
    playerPhoto: player.playerPhoto,
    playerRole: player.playerRole,
    contests: player.videoUuids ? JSON.parse(player.videoUuids).length : 0,
  }));

  console.log(result);
  return result;
};

export const cardList = await fetchPlayerData(); // 直接导出处理后的数据

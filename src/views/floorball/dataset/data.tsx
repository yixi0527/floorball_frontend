import { GetPlayerModel } from '@/api/floorball/model/playerModel';

function getUrlPath(imageUrl: string): string {
  const index = imageUrl.indexOf('/playerdatabase');
  if (index !== -1) {
    return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
  }
  return ''; // 如果没有找到 '/results'，返回空字符串
}

export const fetchPlayerData = async (): Promise<any[]> => {
  const response = await fetch('/api/playerdata');
  const data: GetPlayerModel[] = await response.json();
  // 格式化数据
  const result = data.map((player) => ({
    playerId: player.playerId,
    playerName: player.playerName,
    playerPhoto: getUrlPath(player.playerPhoto),
    playerRole: player.playerRole,
    contests: player.videoUuids ? JSON.parse(player.videoUuids).length : 0,
  }));

  console.log(result);
  return result;
};

export const cardList = await fetchPlayerData(); // 直接导出处理后的数据

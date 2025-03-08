// data.ts

type PlayerData = {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  playerRole: string;
  videoUuids: string[];
};

// 获取并格式化数据
export const fetchPlayerData = async (): Promise<any[]> => {
  try {
    const response = await fetch('http://127.0.0.1:8001/playerdata');
    console.log('Response:', response);
    const data: PlayerData[] = await response.json();

    // 格式化数据
    const result = data.map((player) => ({
      id: player.playerId,
      title: player.playerName,
      description: player.playerRole,
      datetime: player.playerRole,
      extra: '编辑',
      icon: `file:///${player.playerPhoto.replace(/\\/g, '/')}`, // 替换路径中的反斜杠
      color: '#1890ff',
      author: player.playerId,
      progress: player.videoUuids.length * 20, // 假设每个视频占 20% 进度
    }));
    console.log;

    return result;
  } catch (error) {
    console.error('Failed to fetch player data:', error);
    return [];
  }
};

export const cardList = await fetchPlayerData(); // 直接导出处理后的数据

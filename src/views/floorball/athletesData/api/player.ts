/**
 * 获取运动员的比赛数据
 * @param {number} playerId 运动员ID
 * @returns {Promise<any>} 运动员的所有比赛数据
 */
export async function getPlayerResults(playerId) {
  const response = await fetch(`/api/player/${playerId}/results`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error fetching player results: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取单场比赛数据
 * @param {number} playerId 运动员ID
 * @param {string} taskId 任务ID
 * @returns {Promise<any>} 单场比赛数据
 */
export async function getPlayerResultByTask(playerId, taskId) {
  const response = await fetch(`/api/player/${playerId}/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error fetching player result by task: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取所有运动员比赛数据
 * @returns {Promise<any>} 所有比赛数据
 */
export async function getAllPlayerResults() {
  const response = await fetch('/api/players/results', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error fetching all player results: ${response.statusText}`);
  }
  return response.json();
}

// 获取运动员本身信息数据
export async function getPlayerInfo(playerId) {
  const response = await fetch(`/api/playerdata/${playerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error fetching player info: ${response.statusText}`);
  }
  return response.json();
}

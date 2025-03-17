import { computed, Ref } from 'vue';

/**
 * 运动员数据统计计算钩子
 * @param playerResults 运动员的比赛结果数据
 * @returns 计算出的各种统计数据
 */
export function usePlayerStats(playerResults: Ref<any[]>) {
  // 总移动距离
  const totalDistance = computed(() => {
    return playerResults.value.reduce((sum, game) => sum + (game.total_movement || 0), 0);
  });

  // 平均移动距离
  const averageTotalMovement = computed(() => {
    if (playerResults.value.length === 0) return 0;
    return totalDistance.value / playerResults.value.length;
  });

  // 总转向次数
  const totalDirectionChanges = computed(() => {
    return playerResults.value.reduce((sum, game) => sum + (game.change_direction_times || 0), 0);
  });

  // 平均转向次数
  const averageDirectionChanges = computed(() => {
    if (playerResults.value.length === 0) return 0;
    return totalDirectionChanges.value / playerResults.value.length;
  });

  // 总高强度运动时间（转为分钟）
  const totalHighIntensityTime = computed(() => {
    return (
      playerResults.value.reduce((sum, game) => sum + (game.high_intensity_running_time || 0), 0) /
      60
    );
  });

  // 平均高强度运动时间（分钟）
  const averageHighIntensityTime = computed(() => {
    if (playerResults.value.length === 0) return 0;
    return totalHighIntensityTime.value / playerResults.value.length;
  });

  // 最高速度
  const maxSpeed = computed(() => {
    let max = 0;
    playerResults.value.forEach((game) => {
      if (game.parsedSpeedList && game.parsedSpeedList.length > 0) {
        const gameMax = Math.max(...game.parsedSpeedList);
        if (gameMax > max) max = gameMax;
      }
    });
    return max;
  });

  // 平均最高速度
  const averageMaxSpeed = computed(() => {
    if (playerResults.value.length === 0) return 0;
    let sum = 0;
    let count = 0;

    playerResults.value.forEach((game) => {
      if (game.parsedSpeedList && game.parsedSpeedList.length > 0) {
        sum += Math.max(...game.parsedSpeedList);
        count++;
      }
    });

    return count > 0 ? sum / count : 0;
  });

  return {
    totalDistance,
    averageTotalMovement,
    totalDirectionChanges,
    averageDirectionChanges,
    totalHighIntensityTime,
    averageHighIntensityTime,
    maxSpeed,
    averageMaxSpeed,
  };
}

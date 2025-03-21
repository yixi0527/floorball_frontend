<template>
  <div ref="chartRef" :style="{ height: '400px', width: '100%' }"></div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, watchEffect, computed } from 'vue';
  import { Card } from 'ant-design-vue';
  import { useECharts } from '@/hooks/web/useECharts';
  import type { Ref } from 'vue';
  import { max } from 'xe-utils';

  interface PlayerRadarData {
    playerId: string;
    playerName: string;
    totalDistance: number;
    directionChanges: number;
    highIntensityTime: number;
    maxSpeed: number;
    maxAcceleration: number;
  }

  interface PlayerResult {
    task_id: string;
    total_distance: number;
    change_direction_times: number;
    high_intensity_running_time: number;
    parsedSpeedList: number[];
    parsedAccelerationList: number[];
  }

  const props = defineProps<{
    playerId: string;
  }>();

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
  const loading = ref(true);
  const allPlayersData = ref<PlayerRadarData[]>([]);

  // 获取单个运动员的统计数据
  const getPlayerStats = async (playerId: string): Promise<PlayerRadarData> => {
    try {
      const [infoRes, resultsRes] = await Promise.all([
        fetch(`/api/playerdata/${playerId}`),
        fetch(`/api/player/${playerId}/results`),
      ]);

      const info = await infoRes.json();
      const results: PlayerResult[] = await resultsRes.json();

      // 计算各项指标
      return {
        playerId,
        playerName: info.playerName,
        totalDistance: results.reduce((sum, r) => sum + (r.total_distance || 0), 0),
        directionChanges: results.reduce((sum, r) => sum + (r.change_direction_times || 0), 0),
        highIntensityTime: results.reduce(
          (sum, r) => sum + (r.high_intensity_running_time || 0),
          0,
        ),
        maxSpeed: Math.max(...results.flatMap((r) => r.parsedSpeedList || [])),
        maxAcceleration: Math.max(...results.flatMap((r) => r.parsedAccelerationList || [])),
      };
    } catch (e) {
      console.error(`获取运动员${playerId}数据失败:`, e);
      return {
        playerId,
        playerName: '未知运动员',
        totalDistance: 0,
        directionChanges: 0,
        highIntensityTime: 0,
        maxSpeed: 0,
        maxAcceleration: 0,
      };
    }
  };

  // 获取所有运动员数据
  const fetchAllPlayersData = async () => {
    try {
      loading.value = true;

      // 获取所有运动员ID
      const playersRes = await fetch('/api/playerdata');
      const players = await playersRes.json();

      // 并行获取所有运动员数据
      const data = await Promise.all(players.map((p: any) => getPlayerStats(p.playerId)));

      allPlayersData.value = data.filter((d) => d !== null);
    } catch (e) {
      console.error('获取运动员数据失败:', e);
      allPlayersData.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 生成雷达图配置
  const generateRadarOptions = computed(() => {
    if (allPlayersData.value.length === 0) return null;

    // 计算各维度最大值（留出20%余量）
    const maxValues = {
      totalDistance: Math.max(...allPlayersData.value.map((d) => d.totalDistance)) * 1,
      directionChanges: Math.max(...allPlayersData.value.map((d) => d.directionChanges)) * 1,
      highIntensityTime: Math.max(...allPlayersData.value.map((d) => d.highIntensityTime)) * 1,
      maxSpeed: Math.max(...allPlayersData.value.map((d) => d.maxSpeed)) * 1,
      maxAcceleration: Math.max(...allPlayersData.value.map((d) => d.maxAcceleration)) * 1,
    };

    // 生成每个选手的数据
    const radarData = allPlayersData.value.map((player) => ({
      name: player.playerName,
      // 归一化数据，注意0值的情况
      value: [
        player.totalDistance / maxValues.totalDistance || 0,
        player.directionChanges / maxValues.directionChanges || 0,
        player.highIntensityTime / maxValues.highIntensityTime || 0,
        player.maxSpeed / maxValues.maxSpeed || 0,
        player.maxAcceleration / maxValues.maxAcceleration || 0,
      ],
      itemStyle: {
        color: player.playerId === props.playerId ? '#b6a2de' : '#5ab1ef', // 当前选手紫色，其他选手蓝色
      },
      areaStyle: {
        color:
          player.playerId === props.playerId
            ? 'rgba(182, 162, 222, 0.4)'
            : 'rgba(90, 177, 239, 0.4)', // 当前选手紫色，其他选手蓝色
      },
    }));

    return {
      legend: {
        bottom: 20,
        data: allPlayersData.value.map((d) => d.playerName),
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          return `
          ${data.name}<br/>
          总跑动：${data.value[0].toFixed(0)}米<br/>
          转向次数：${data.value[1]}次<br/>
          高强度时间：${data.value[2].toFixed(0)}秒<br/>
          最大速度：${data.value[3].toFixed(2)}m/s<br/>
          最大加速度：${data.value[4].toFixed(2)}m/s²
        `;
        },
      },
      radar: {
        center: ['50%', '45%'],
        radius: '65%',
        splitNumber: 4,
        // axisName: {
        //   color: '#666',
        // },
        indicator: [
          { name: '总跑动距离', max: maxValues.totalDistance },
          { name: '转向次数', max: maxValues.directionChanges },
          { name: '高强度时间', max: maxValues.highIntensityTime },
          { name: '最大速度', max: maxValues.maxSpeed },
          { name: '最大加速度', max: maxValues.maxAcceleration },
        ],
        splitArea: {
          areaStyle: {
            color: [
              'rgba(25,100,250,0.1)',
              'rgba(25,100,250,0.2)',
              'rgba(25,100,250,0.4)',
              'rgba(25,100,250,0.6)',
            ],
          },
        },
      },
      series: [
        {
          type: 'radar',
          areaStyle: {
            shadowBlur: 0,
            shadowColor: 'rgba(0,0,0,.2)',
            shadowOffsetX: 0,
            shadowOffsetY: 10,
            opacity: 1,
          },
          // emphasis: {
          //   lineStyle: {
          //     width: 4,
          //   },
          // },
          data: radarData,
        },
      ],
    };
  });

  // 监听数据变化
  watchEffect(() => {
    if (generateRadarOptions.value) {
      setOptions(generateRadarOptions.value);
    }
  });

  // 初始化数据
  onMounted(() => {
    fetchAllPlayersData();
  });
</script>

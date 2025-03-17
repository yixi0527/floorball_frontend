<template>
  <div class="p-4 player-dashboard">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>

    <template v-else>
      <!-- 运动员信息卡片 -->
      <a-row :gutter="16" class="mb-4">
        <a-col :span="24">
          <a-card :bordered="false" title="运动员表现仪表板">
            <Descriptions :column="{ xs: 1, sm: 2, md: 3 }" size="small">
              <Descriptions.Item label="运动员 ID">{{ playerId }}</Descriptions.Item>
              <Descriptions.Item label="运动员姓名">{{ playerName }}</Descriptions.Item>
              <Descriptions.Item label="总比赛场数">{{ playerResults.length }}</Descriptions.Item>
            </Descriptions>
          </a-card>
        </a-col>
      </a-row>

      <!-- 关键绩效指标卡片 -->
      <div class="md:flex enter-y">
        <Card
          size="small"
          title="平均移动距离"
          class="ant-card css-n9spb6 ant-card-bordered ant-card-small md:w-1/4 w-full !md:mt-0 !md:mr-4"
        >
          <template #extra>
            <Tag color="green">{{ '每场' }}</Tag>
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 米"
              :startVal="1"
              :endVal="averageTotalMovement"
              class="text-2xl"
              :decimals="2"
              :duration="500"
            />
            <Icon icon="ri:run-fill" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>总移动距离</span>
            <CountTo
              suffix=" 米"
              :startVal="1"
              :endVal="totalDistance"
              :decimals="2"
              :duration="500"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均转向次数"
          class="ant-card css-n9spb6 ant-card-bordered ant-card-small md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">{{ '每场' }}</Tag>
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 次"
              :startVal="1"
              :endVal="averageDirectionChanges"
              class="text-2xl"
              :decimals="0"
              :duration="500"
            />
            <Icon icon="ri:direction-line" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>总转向次数</span>
            <CountTo
              suffix=" 次"
              :startVal="1"
              :endVal="totalDirectionChanges"
              :decimals="2"
              :duration="500"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均高强度时长"
          class="ant-card css-n9spb6 ant-card-bordered ant-card-small md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">{{ '每场' }}</Tag>
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 分钟"
              :startVal="1"
              :endVal="averageHighIntensityTime"
              class="text-2xl"
              :decimals="2"
              :duration="500"
            />
            <Icon icon="ri:fire-line" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>总高强度时长</span>
            <CountTo
              suffix=" 分钟"
              :startVal="1"
              :endVal="totalHighIntensityTime"
              :decimals="2"
              :duration="500"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均最高速度"
          class="ant-card css-n9spb6 ant-card-bordered ant-card-small md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">{{ '每场' }}</Tag>
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" km/h"
              :startVal="1"
              :endVal="averageMaxSpeed"
              class="text-2xl"
              :decimals="2"
              :duration="500"
            />
            <Icon icon="ri:dashboard-line" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>最高速度</span>
            <CountTo
              suffix=" km/h"
              :startVal="1"
              :endVal="maxSpeed"
              :decimals="2"
              :duration="500"
            />
          </div>
        </Card>
      </div>

      <Divider />

      <SpeedsPlots :playerResults="playerResults" class="md:flex enter-y" />

      <Divider />

      <!-- 比赛列表和详细分析 -->
      <!-- <a-row :gutter="16">
        <a-col :xs="24" :md="12">
          <a-card :bordered="false" title="比赛列表">
            <a-table
              :columns="columns"
              :data-source="tableData"
              :pagination="{ pageSize: 5 }"
              @change="handleTableChange"
              :row-class-name="
                (_record, index) => (index === selectedRowIndex ? 'selected-row' : '')
              "
              @row-click="(record, index) => selectGame(record, index)"
            />
          </a-card>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-card :bordered="false" title="比赛详情">
            <template v-if="selectedGame">
              <a-tabs default-active-key="1">
                <a-tab-pane key="1" tab="运动轨迹">
                  <div v-if="selectedGame.track_path" class="image-container">
                    <img :src="selectedGame.track_path" alt="运动轨迹" class="responsive-image" />
                  </div>
                  <a-empty v-else description="暂无轨迹数据" />
                </a-tab-pane>
                <a-tab-pane key="2" tab="热力图">
                  <div v-if="selectedGame.heat_map_path" class="image-container">
                    <img :src="selectedGame.heat_map_path" alt="热力图" class="responsive-image" />
                  </div>
                  <a-empty v-else description="暂无热力图数据" />
                </a-tab-pane>
              </a-tabs>
            </template>
            <a-empty v-else description="请选择一场比赛查看详情" />
          </a-card>
        </a-col>
      </a-row> -->
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Card, Divider, Empty, Descriptions, Steps, Tabs, Tag } from 'ant-design-vue';
  import { useECharts } from '@/hooks/web/useECharts';
  import { getPlayerResults, getPlayerInfo } from '@/views/floorball/athletesData/api/player';
  import { usePlayerStats } from '@/views/floorball/athletesData/hooks/usePlayerStats';
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  import SpeedsPlots from './SpeedsPlots.vue';

  const props = defineProps({
    playerId: {
      type: Number,
      required: true,
    },
  });

  const { createMessage } = useMessage();
  const loading = ref(true);
  const playerResults = ref([]);
  const selectedGame = ref(null);
  const selectedRowIndex = ref(null);
  const playerName = ref('');

  // 图表引用
  const distanceChartRef = ref(null);
  const speedChartRef = ref(null);
  const accelerationChartRef = ref(null);
  const speedAnalysisChartRef = ref(null);

  // 从自定义钩子获取数据统计方法
  const {
    totalDistance,
    averageTotalMovement,
    totalDirectionChanges,
    averageDirectionChanges,
    totalHighIntensityTime,
    averageHighIntensityTime,
    maxSpeed,
    averageMaxSpeed,
  } = usePlayerStats(playerResults);

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
    },
    {
      title: '移动距离 (米)',
      dataIndex: 'totalMovement',
      key: 'totalMovement',
      sorter: (a, b) => a.totalMovement - b.totalMovement,
    },
    {
      title: '转向次数',
      dataIndex: 'changeDirectionTimes',
      key: 'changeDirectionTimes',
      sorter: (a, b) => a.changeDirectionTimes - b.changeDirectionTimes,
    },
    {
      title: '高强度跑动 (分钟)',
      dataIndex: 'highIntensityRunningTime',
      key: 'highIntensityRunningTime',
      sorter: (a, b) => a.highIntensityRunningTime - b.highIntensityRunningTime,
      customRender: ({ text }) => (text / 60).toFixed(2),
    },
  ];

  // 格式化后的表格数据
  const tableData = computed(() => {
    return playerResults.value.map((game) => ({
      ...game,
      key: game.taskId,
    }));
  });
  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/results');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }
  // 获取运动员比赛数据
  const fetchPlayerResults = async () => {
    loading.value = true;
    try {
      const data = await getPlayerResults(props.playerId);
      console.log('received data from getPlayerResults', data);

      if (data && Array.isArray(data)) {
        playerResults.value = data.map((result) => {
          // 解析字符串形式的列表数据
          if (result.speed_list && typeof result.speed_list === 'string') {
            result.parsedSpeedList = JSON.parse(result.speed_list);
          }
          if (result.acceleration_list && typeof result.acceleration_list === 'string') {
            result.parsedAccelerationList = JSON.parse(result.acceleration_list);
          }
          if (result.heat_map_path && typeof result.heat_map_path === 'string') {
            result.heat_map_path = getUrlPath(result.heat_map_path);
          }
          if (result.track_path && typeof result.track_path === 'string') {
            result.track_path = getUrlPath(result.track_path);
          }
          console.log('parsed result:', result);
          return result;
        });

        // 如果有结果，默认选中最后一个
        if (playerResults.value.length > 0) {
          selectGame(
            playerResults.value[playerResults.value.length - 1],
            playerResults.value.length - 1,
          );
        }
      } else {
        playerResults.value = [];
        createMessage.warning('未找到该运动员的数据');
      }
    } catch (error) {
      console.error('获取运动员数据失败:', error);
      createMessage.error('获取运动员数据失败');
      playerResults.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 选择比赛展示详细信息
  const selectGame = (game, index) => {
    selectedGame.value = game;
    selectedRowIndex.value = index;

    // 在选择比赛后渲染速度分析图表
    nextTick(() => {
      if (speedAnalysisChartRef.value && game.parsedSpeedList) {
        renderSpeedAnalysisChart(game);
      }
    });
  };

  // 处理表格变化
  const handleTableChange = () => {
    // 表格分页、排序等变化时的处理逻辑
  };

  // 格式化数字显示
  const formatNumber = (num, decimals = 2) => {
    if (num === undefined || num === null) return '0';
    return Number(num)
      .toFixed(decimals)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 渲染距离趋势图表
  const renderDistanceChart = () => {
    if (!distanceChartRef.value || playerResults.value.length === 0) return;

    const { setOptions } = useECharts(distanceChartRef.value);

    const taskIds = playerResults.value.map((game) => game.taskId);
    const distances = playerResults.value.map((game) => game.totalMovement);

    setOptions({
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 米',
      },
      xAxis: {
        type: 'category',
        data: taskIds,
        axisLabel: {
          rotate: 45,
          formatter: (value) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '距离 (米)',
      },
      series: [
        {
          data: distances,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: 'rgba(24, 144, 255, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(24, 144, 255, 0.1)',
                },
              ],
            },
          },
        },
      ],
    });
  };

  // 渲染速度分析图表
  const renderSpeedChart = () => {
    if (!speedChartRef.value || playerResults.value.length === 0) return;

    const { setOptions } = useECharts(speedChartRef.value);

    // 准备数据：每场比赛的平均速度和最高速度
    const taskIds = playerResults.value.map((game) => game.taskId);
    const avgSpeeds = playerResults.value.map((game) => {
      if (game.parsedSpeedList && game.parsedSpeedList.length > 0) {
        return (
          game.parsedSpeedList.reduce((sum, speed) => sum + speed, 0) / game.parsedSpeedList.length
        );
      }
      return 0;
    });

    const maxSpeeds = playerResults.value.map((game) => {
      if (game.parsedSpeedList && game.parsedSpeedList.length > 0) {
        return Math.max(...game.parsedSpeedList);
      }
      return 0;
    });

    setOptions({
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['平均速度', '最高速度'],
      },
      xAxis: {
        type: 'category',
        data: taskIds,
        axisLabel: {
          rotate: 45,
          formatter: (value) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '速度 (km/h)',
      },
      series: [
        {
          name: '平均速度',
          type: 'bar',
          data: avgSpeeds,
          itemStyle: {
            color: '#69c0ff',
          },
        },
        {
          name: '最高速度',
          type: 'line',
          data: maxSpeeds,
          itemStyle: {
            color: '#ff4d4f',
          },
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    });
  };

  // 渲染加速度分析图表
  const renderAccelerationChart = () => {
    if (!accelerationChartRef.value || playerResults.value.length === 0) return;

    const { setOptions } = useECharts(accelerationChartRef.value);

    // 准备数据：各场比赛加速度统计
    const taskIds = playerResults.value.map((game) => game.taskId);

    // 计算每场比赛的加速度统计
    const accStatistics = playerResults.value.map((game) => {
      if (!game.parsedAccelerationList || game.parsedAccelerationList.length === 0) {
        return { avg: 0, max: 0, min: 0 };
      }

      const accs = game.parsedAccelerationList;
      return {
        avg: accs.reduce((sum, acc) => sum + acc, 0) / accs.length,
        max: Math.max(...accs),
        min: Math.min(...accs),
      };
    });

    setOptions({
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const taskId = params[0].axisValue;
          let result = `任务ID: ${taskId}<br/>`;

          params.forEach((param) => {
            result += `${param.seriesName}: ${param.value.toFixed(2)} m/s²<br/>`;
          });

          return result;
        },
      },
      legend: {
        data: ['平均加速度', '最大加速度', '最小加速度'],
      },
      xAxis: {
        type: 'category',
        data: taskIds,
        axisLabel: {
          rotate: 45,
          formatter: (value) => {
            return value.length > 10 ? value.substring(0, 10) + '...' : value;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '加速度 (m/s²)',
      },
      series: [
        {
          name: '平均加速度',
          type: 'line',
          data: accStatistics.map((stat) => stat.avg),
          lineStyle: {
            color: '#1890ff',
          },
        },
        {
          name: '最大加速度',
          type: 'line',
          data: accStatistics.map((stat) => stat.max),
          lineStyle: {
            color: '#f5222d',
          },
        },
        {
          name: '最小加速度',
          type: 'line',
          data: accStatistics.map((stat) => stat.min),
          lineStyle: {
            color: '#52c41a',
          },
        },
      ],
    });
  };

  // 渲染速度分析详细图表
  const renderSpeedAnalysisChart = (game) => {
    if (!speedAnalysisChartRef.value || !game.parsedSpeedList) return;

    const { setOptions } = useECharts(speedAnalysisChartRef.value);

    // 创建时间点（假设样本以固定间隔采集）
    const timePoints = Array.from({ length: game.parsedSpeedList.length }, (_, i) => i);

    // 准备速度数据
    const speedData = game.parsedSpeedList;

    // 准备加速度数据（如果有）
    let accelerationData = [];
    if (game.parsedAccelerationList && game.parsedAccelerationList.length > 0) {
      // 确保加速度数据长度与速度数据一致
      const minLength = Math.min(speedData.length, game.parsedAccelerationList.length);
      accelerationData = game.parsedAccelerationList.slice(0, minLength);
    }

    const series = [
      {
        name: '速度',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: speedData,
        lineStyle: {
          width: 3,
          color: '#1890ff',
        },
      },
    ];

    if (accelerationData.length > 0) {
      series.push({
        name: '加速度',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: accelerationData,
        lineStyle: {
          width: 2,
          color: '#ff4d4f',
        },
      });
    }

    setOptions({
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          let result = `时间点: ${params[0].dataIndex}<br/>`;
          params.forEach((param) => {
            result += `${param.seriesName}: ${param.value.toFixed(2)}${param.seriesName === '速度' ? ' km/h' : ' m/s²'}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: accelerationData.length > 0 ? ['速度', '加速度'] : ['速度'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timePoints,
        name: '时间',
      },
      yAxis: [
        {
          type: 'value',
          name: '速度 (km/h)',
          position: 'left',
        },
        accelerationData.length > 0
          ? {
              type: 'value',
              name: '加速度 (m/s²)',
              position: 'right',
            }
          : null,
      ].filter(Boolean),
      series: series,
    });
  };

  // 监听数据变化，渲染图表
  watch(
    () => playerResults.value,
    () => {
      nextTick(() => {
        renderDistanceChart();
        renderSpeedChart();
        renderAccelerationChart();
      });
    },
    { deep: true },
  );

  // 初始化组件
  onMounted(() => {
    // 查询运动员数据
    getPlayerInfo(props.playerId)
      .then((data) => {
        console.log('received player info:', data);
        playerName.value = data.playerName;
      })
      .catch((error) => {
        console.error('获取运动员信息失败: ', error);
        createMessage.error('获取运动员信息失败');
      });
    fetchPlayerResults();
  });
</script>

<style scoped>
  .player-dashboard {
    padding: 16px;
  }

  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .selected-row {
    background-color: #e6f7ff;
  }

  .image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    margin: 16px 0;
  }

  .responsive-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
  }

  :deep(.ant-card-head) {
    min-height: 48px;
  }

  :deep(.ant-descriptions-item-label) {
    font-weight: bold;
  }
</style>

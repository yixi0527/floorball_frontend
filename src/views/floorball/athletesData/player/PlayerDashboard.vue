<template>
  <div class="p-4 player-dashboard">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
    </div>
    <!-- 加载完成状态 -->
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
        <Card size="small" title="平均移动距离" class="ant-card md:w-1/4 w-full !md:mt-0 !md:mr-4">
          <template #extra>
            <Tag color="green">每场</Tag>
            <BasicHelp class="ml-2" :text="movementText" />
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 米"
              :startVal="1"
              :endVal="averageTotalMovement"
              class="text-2xl"
              :decimals="2"
              :duration="1000"
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
              :duration="1000"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均转向次数"
          class="ant-card md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">每场</Tag>
            <BasicHelp class="ml-2" :text="directionChangesText" />
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 次"
              :startVal="1"
              :endVal="averageDirectionChanges"
              class="text-2xl"
              :decimals="0"
              :duration="1000"
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
              :duration="1000"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均高强度时长"
          class="ant-card md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">每场</Tag>
            <BasicHelp class="ml-2" :text="highIntensityText" />
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" 秒"
              :startVal="1"
              :endVal="averageHighIntensityTime"
              class="text-2xl"
              :decimals="2"
              :duration="1000"
            />
            <Icon icon="ri:fire-line" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>总高强度时长</span>
            <CountTo
              suffix=" 秒"
              :startVal="1"
              :endVal="totalHighIntensityTime"
              :decimals="2"
              :duration="1000"
            />
          </div>
        </Card>

        <Card
          size="small"
          title="平均最高速度"
          class="ant-card md:w-1/4 w-full !md:mt-0 !md:mr-4 !mt-4"
        >
          <template #extra>
            <Tag color="green">每场</Tag>
            <BasicHelp class="ml-2" :text="maxSpeedText" />
          </template>
          <div class="py-4 px-4 flex justify-between items-center">
            <CountTo
              suffix=" m/s"
              :startVal="1"
              :endVal="averageMaxSpeed"
              class="text-2xl"
              :decimals="2"
              :duration="1000"
            />
            <Icon icon="ri:dashboard-line" :size="40" />
          </div>
          <div class="p-2 px-4 flex justify-between">
            <span>最高速度</span>
            <CountTo
              suffix=" m/s"
              :startVal="1"
              :endVal="maxSpeed"
              :decimals="2"
              :duration="1000"
            />
          </div>
        </Card>
      </div>
      <Divider />

      <Card :tab-list="tabList" :active-tab-key="activeTab" @tab-change="onTabChange">
        <!-- 速度加速度曲线 -->
        <template v-if="activeTab === 'speed'">
          <SpeedsPlots :player-results="playerResults" />
        </template>

        <!-- 不同指标柱状图 -->
        <template v-if="activeTab === 'movement'">
          <MovementPlots :player-results="playerResults" metric="total_movement" />
        </template>

        <template v-if="activeTab === 'direction'">
          <MovementPlots :player-results="playerResults" metric="change_direction" />
        </template>

        <template v-if="activeTab === 'intensity'">
          <MovementPlots :player-results="playerResults" metric="high_intensity" />
        </template>

        <template v-if="activeTab === 'max_speed'">
          <MovementPlots :player-results="playerResults" metric="max_speed" />
        </template>

        <template v-if="activeTab === 'compare'">
          <PlayerRadarChart :player-id="playerId" />
        </template>
      </Card>

      <Divider />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useMessage } from '@/hooks/web/useMessage';
  import { Card, Divider, Descriptions, Tag } from 'ant-design-vue';
  import { getPlayerResults, getPlayerInfo } from '@/views/floorball/athletesData/api/player';
  import { usePlayerStats } from '@/views/floorball/athletesData/hooks/usePlayerStats';
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  import SpeedsPlots from './SpeedsPlots.vue';
  import MovementPlots from './MovementPlots.vue';
  import PlayerRadarChart from './PlayerRadarChart.vue';
  import BasicHelp from '@/components/Basic/src/BasicHelp.vue';

  const standardValues = {
    averageTotalMovement: 5000, // 标准移动距离（米）
    averageDirectionChanges: 300, // 标准转向次数
    averageHighIntensityTime: 20, // 标准高强度时长（分钟）
    averageMaxSpeed: 3, // 标准最高速度（m/s）
  };

  function getPerformanceText(value, standard) {
    const ratio = value.value / standard;
    if (ratio < 0.65) return `显著低于平均水平（标准值: ${standard})`;
    if (ratio < 0.85) return `略低于平均水平（标准值: ${standard})`;
    if (ratio <= 1.15) return `在平均水平（标准值: ${standard})`;
    if (ratio <= 1.35) return `略高于平均水平（标准值: ${standard})`;
    return `显著高于平均水平（标准值: ${standard})`;
  }

  const movementText = computed(() =>
    getPerformanceText(averageTotalMovement, standardValues.averageTotalMovement),
  );
  const directionChangesText = computed(() =>
    getPerformanceText(averageDirectionChanges, standardValues.averageDirectionChanges),
  );
  const highIntensityText = computed(() =>
    getPerformanceText(averageHighIntensityTime, standardValues.averageHighIntensityTime),
  );
  const maxSpeedText = computed(() =>
    getPerformanceText(averageMaxSpeed, standardValues.averageMaxSpeed),
  );

  const activeTab = ref('speed');
  const tabList = [
    { key: 'speed', tab: '速度曲线' },
    { key: 'movement', tab: '移动距离' },
    { key: 'direction', tab: '转向次数' },
    { key: 'intensity', tab: '高强度时间' },
    { key: 'max_speed', tab: '最大速度' },
    { key: 'compare', tab: '综合对比' },
  ];

  function onTabChange(key) {
    activeTab.value = key;
  }

  const props = defineProps({
    playerId: {
      type: Number,
      required: true,
    },
  });

  const { createMessage } = useMessage();
  const loading = ref(true);

  interface PlayerResult {
    speed_list?: string;
    acceleration_list?: string;
    heat_map_path?: string;
    track_path?: string;
    parsedSpeedList?: number[];
    parsedAccelerationList?: number[];
    [key: string]: any; // Add additional fields as needed
  }

  const playerResults = ref<PlayerResult[]>([]);
  const playerName = ref('');

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
          // Ensure task_id is present
          if (!result.task_id) {
            result.task_id = ''; // Provide a default value or handle appropriately
          }
          return result;
        });
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

  // 初始化组件
  onMounted(() => {
    // 查询运动员数据
    getPlayerInfo(props.playerId)
      .then((data) => {
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

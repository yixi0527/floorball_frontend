<template>
  <Select
    v-model:value="currentTaskId"
    style="width: 300px; margin-bottom: 20px"
    placeholder="请选择比赛场次"
    @change="handleTaskChange"
    :options="options"
  />
  <div ref="chartRef" :style="{ height: '400px', width: '100%' }"></div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, watchEffect } from 'vue';
  import { useECharts } from '@/hooks/web/useECharts';
  import { Select } from 'ant-design-vue';
  import type { Ref } from 'vue';

  interface PlayerResult {
    task_id: string;
    parsedSpeedList: number[];
    parsedAccelerationList: number[];
  }

  interface TaskInfo {
    task_id: string;
    contestName: string;
  }

  const props = defineProps<{
    playerResults: PlayerResult[];
  }>();

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);
  const currentTaskId = ref<string>();
  const contestOptions = ref<TaskInfo[]>([]);
  const options = ref<{ label: string; value: string }[]>([]);

  // 获取比赛信息并生成选项
  onMounted(async () => {
    console.log('props.playerResults', props.playerResults);

    const tasks = await Promise.all(
      props.playerResults.map(async (result) => {
        try {
          const response = await fetch(`/api/task/${result.task_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const res = await response.json();
          return {
            task_id: result.task_id,
            contestName: res.contestName || '未知比赛',
          };
        } catch (e) {
          return { task_id: result.task_id, contestName: '未知比赛' };
        }
      }),
    );

    contestOptions.value = tasks;
    console.log('contestOptions', contestOptions.value);

    options.value = tasks.map((item) => ({
      label: item.contestName,
      value: item.task_id,
    }));

    if (tasks.length > 0) {
      currentTaskId.value = tasks[0].task_id;
    }
  });

  // 处理比赛切换
  const handleTaskChange = (value: string) => {
    currentTaskId.value = value;
    updateChart();
  };

  // 更新图表数据
  const updateChart = () => {
    const currentResult = props.playerResults.find((r) => r.task_id === currentTaskId.value);
    if (!currentResult) return;

    const timeLabels = Array.from(
      { length: currentResult.parsedSpeedList.length },
      (_, i) => `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`,
    );

    // 计算速度和加速度的最大最小值
    const maxSpeed = Math.max(...currentResult.parsedSpeedList);
    const minSpeed = Math.min(...currentResult.parsedSpeedList);
    const maxAcceleration = Math.max(...currentResult.parsedAccelerationList);
    const minAcceleration = Math.min(...currentResult.parsedAccelerationList);

    // 确保速度和加速度在相似的数量级
    let scaleFactor = maxSpeed / maxAcceleration;
    if (scaleFactor > 10) scaleFactor = 10; // 限制比例，不让加速度缩放过大
    if (scaleFactor < 0.1) scaleFactor = 0.1; // 也不让缩放过小

    const adjustedAccelerationList = currentResult.parsedAccelerationList.map(
      (a) => a * scaleFactor,
    );

    // 重新计算加速度的范围
    const adjustedMaxAcceleration = maxAcceleration * scaleFactor;
    const adjustedMinAcceleration = minAcceleration * scaleFactor;

    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params) => {
          return params
            .map((item) => `${item.marker} ${item.seriesName}: ${Number(item.value).toFixed(2)}`)
            .join('<br/>');
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeLabels,
        name: '比赛时间（分:秒）',
        nameLocation: 'middle', // 确保标题居中
        nameGap: 20, // 增加标题和刻度之间的间距
        axisLabel: {
          formatter: (value: string) => value,
          rotate: 0, // 确保刻度标签水平显示
        },
      },

      yAxis: [
        {
          type: 'value',
          name: '速度（m/s）',
          min: Number((minSpeed * 1.2).toFixed(2)),
          max: Number((maxSpeed * 1.2).toFixed(2)),
          axisLabel: {
            formatter: (value) => Number(value).toFixed(2),
          },
        },
        {
          type: 'value',
          name: `加速度（m/s²） (x${scaleFactor.toFixed(1)})`,
          min: Number((adjustedMinAcceleration * 1.2).toFixed(2)),
          max: Number((adjustedMaxAcceleration * 1.2).toFixed(2)),
          axisLabel: {
            formatter: (value) => Number(value).toFixed(2),
          },
        },
      ],
      series: [
        {
          name: '速度',
          type: 'line',
          smooth: true,
          data: currentResult.parsedSpeedList.map((v) => Number(v).toFixed(2)),
          yAxisIndex: 0,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: '#1890ff22',
          },
        },
        {
          name: '加速度',
          type: 'line',
          smooth: true,
          data: adjustedAccelerationList.map((v) => Number(v).toFixed(2)),
          yAxisIndex: 1,
          itemStyle: {
            color: '#52c41a',
          },
          areaStyle: {
            color: '#52c41a22',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      legend: {
        data: ['速度', '加速度'],
        top: 0, // 稍微上移一些，避免贴边
        itemGap: 30, // 增大图例间距
        textStyle: {
          fontSize: 14,
        },
        orient: 'horizontal', // 确保图例是水平排列
        align: 'left', // 可以改成 'right' 让它靠右
      },
    });
  };

  // 监听数据变化更新图表
  watchEffect(() => {
    if (currentTaskId.value) {
      updateChart();
    }
  });
</script>

<!-- MovementPlots.vue -->
<template>
  <div ref="chartRef" :style="{ height: '400px', width: '100%' }"></div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, watchEffect, computed } from 'vue';
  import { useECharts } from '@/hooks/web/useECharts';
  import type { Ref } from 'vue';

  interface PlayerResult {
    task_id: string;
    total_movement?: number;
    change_direction_times?: number;
    high_intensity_running_time?: number;
    parsedSpeedList?: number[];
    parsedAccelerationList?: number[];
  }

  interface TaskInfo {
    task_id: string;
    taskTime: Date;
    contestName: string;
  }

  const props = defineProps<{
    playerResults: PlayerResult[];
    metric: 'total_movement' | 'change_direction' | 'high_intensity' | 'max_speed' | 'max_acc';
  }>();

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  // 指标配置系统
  const metricConfig = computed(() => {
    const config = {
      total_movement: {
        key: 'total_movement',
        label: '总移动距离',
        unit: '米',
        formatter: (v: number) => `${v.toFixed(0)} 米`,
        valueType: 'normal',
      },
      change_direction: {
        key: 'change_direction_times',
        label: '转向次数',
        unit: '次',
        formatter: (v: number) => `${v.toFixed(0)} 次`,
        valueType: 'normal',
      },
      high_intensity: {
        key: 'high_intensity_running_time',
        label: '高强度运动时间',
        unit: '秒',
        formatter: (v: number) => `${v.toFixed(0)} 秒`,
        valueType: 'normal',
      },
      max_speed: {
        key: 'parsedSpeedList',
        label: '最大速度',
        unit: 'm/s',
        formatter: (v: number) => `${v.toFixed(2)} m/s`,
        valueType: 'calculated',
      },
      max_acc: {
        key: 'parsedAccelerationList',
        label: '最大加速度',
        unit: 'm/s²',
        formatter: (v: number) => `${v.toFixed(2)} m/s²`,
        valueType: 'calculated',
      },
    };
    return config[props.metric];
  });

  // 计算指标值
  const calculateValue = (result: PlayerResult): number => {
    if (metricConfig.value.valueType === 'calculated') {
      const values = (result[metricConfig.value.key as keyof PlayerResult] as number[]) || [];
      return values.length > 0 ? Math.max(...values) : 0;
    }
    return (result[metricConfig.value.key as keyof PlayerResult] as number) || 0;
  };

  // 处理图表数据
  const processChartData = async () => {
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
            taskTime: new Date(res.taskTime),
            contestName: res.contestName || '未知比赛',
          };
        } catch (e) {
          return {
            task_id: result.task_id,
            taskTime: new Date(),
            contestName: '未知比赛',
          };
        }
      }),
    );

    const mergedData = props.playerResults.map((result) => {
      const taskInfo = tasks.find((t) => t.task_id === result.task_id);
      return {
        value: calculateValue(result),
        date: taskInfo?.taskTime || new Date(),
        contestName: taskInfo?.contestName || '未知比赛',
        taskId: result.task_id,
      };
    });

    mergedData.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      xLabels: mergedData.map(
        (item) =>
          `${String(item.date.getMonth() + 1).padStart(2, '0')}-${String(item.date.getDate()).padStart(2, '0')}\n` +
          `${String(item.date.getHours()).padStart(2, '0')}:${String(item.date.getMinutes()).padStart(2, '0')}`,
      ),
      values: mergedData.map((item) => item.value),
      contestNames: mergedData.map((item) => item.contestName),
    };
  };

  // 更新图表
  const updateChart = async () => {
    if (!props.playerResults.length) return;

    const { xLabels, values, contestNames } = await processChartData();

    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const data = params[0];
          return `
          ${contestNames[data.dataIndex]}<br/>
          时间：${xLabels[data.dataIndex].replace('\n', ' ')}<br/>
          ${metricConfig.value.label}：${metricConfig.value.formatter(data.value)}
        `;
        },
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLabel: {
          interval: 0,
          rotate: 45,
          formatter: (value: string) => value,
        },
        name: '比赛时间（月-日 时:分）',
        nameLocation: 'middle',
        nameGap: 35,
      },
      yAxis: {
        type: 'value',
        name: `${metricConfig.value.label}（${metricConfig.value.unit}）`,
        axisLabel: {
          formatter: (value: number) =>
            metricConfig.value.valueType === 'calculated' ? value.toFixed(2) : value.toFixed(0),
        },
      },
      series: [
        {
          data: values,
          type: 'bar',
          barMaxWidth: 40,
          itemStyle: {
            color: '#1890ff',
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        containLabel: true,
      },
    });
  };

  // 响应变化
  watchEffect(() => {
    updateChart();
  });

  onMounted(() => {
    updateChart();
  });
</script>

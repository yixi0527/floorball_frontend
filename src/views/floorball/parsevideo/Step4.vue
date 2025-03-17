<template>
  <div class="w-150 m-auto flex flex-col items-center space-y-4">
    <div v-if="percent != 100">
      <Alert message="分析报告生成中，请耐心等待，分析完成后即可下载分析报告。" show-icon />
    </div>
    <Progress
      type="circle"
      :percent="percent"
      :format="() => (percent === 100 ? '分析完成' : `${percent.toFixed(2)}%`)"
    />
    <a-button type="primary" @click="handleDownload" :disabled="percent !== 100">
      下载分析报告
    </a-button>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { Progress, Result, Alert, Divider, Descriptions, Col, Row } from 'ant-design-vue';

  const props = defineProps<{
    taskId: string;
  }>();

  const percent = ref(0);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function handleDownload() {
    console.log('Download:', props.taskId);
    const response = await fetch(`/api/download/pdf/${props.taskId}`);
    if (!response.ok) throw new Error('下载失败');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${props.taskId}_files.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  const checkTaskStatus = async () => {
    const response = await fetch(`/api/status/${props.taskId}`);
    if (!response.ok) throw new Error('查询任务状态失败');
    return response.json();
  };

  const pollTaskStatus = async () => {
    if (!props.taskId) return;

    const totalDuration = 60; // 60秒
    const updateInterval = 1000; // 每秒更新一次
    const step = 99 / totalDuration; // 每秒增加的百分比 (99% / 60秒)

    intervalId = setInterval(async () => {
      if (percent.value < 99) {
        percent.value = Math.min(percent.value + step, 99);
      }

      const response = await checkTaskStatus();
      if (response.status === 'completed') {
        percent.value = 100;
        await fetch(`/api/task/${props.taskId}/complete_association`, {
          method: 'POST',
        });
        clearInterval(intervalId!);
      }
    }, updateInterval);
  };

  onMounted(() => {
    pollTaskStatus();
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

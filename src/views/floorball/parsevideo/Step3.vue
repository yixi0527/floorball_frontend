<template>
  <div class="w-150 m-auto">
    <Result status="success" title="分析完成！" sub-title="预计三分钟内生成分析报告">
      <Progress
        type="circle"
        :strokeColor="{ '0%': '#108ee9', '100%': '#87d068' }"
        :percent="progressStatus.playerReport"
      />
      <div> 运动员报告生成中... </div>
      <Progress
        type="circle"
        :strokeColor="{ '0%': '#108ee9', '100%': '#87d068' }"
        :percent="progressStatus.processing"
      />
      <div> 球队报告生成中... </div>
      <template #extra>
        <a-button type="primary" @click="emit('redo')"> 分析下一场比赛 </a-button>
        <a-button @click="handleclick"> 下载分析报告 </a-button>
      </template>
    </Result>
  </div>
</template>

<script lang="ts" setup>
  import { Result, Progress } from 'ant-design-vue';
  import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue';

  const progressStatus = ref({
    playerReport: 0,
    teamReport: 0,
  });

  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
  });

  let interval = null;

  const checkTaskStatus = async () => {
    const response = await fetch(`/api/status/${props.taskId}`);
    return await response.json();
  };

  const pollTaskStatus = async () => {
    if (!props.taskId) return;
    interval = setInterval(async () => {
      const response = await checkTaskStatus();
      console.log('查询任务状态：', response);
      if (response.status === 'completed') {
        progressStatus.value = {
          playerReport: 100,
          teamReport: 100,
        };
        clearInterval(interval);
      } else {
        switch (response.status) {
          case 'generating Player report...':
            progressStatus.value.playerReport = response.progress;
            break;
          case 'generating Team report...':
            progressStatus.value.teamReport = response.progress;
            break;
          default:
            break;
        }
      }
    }, 1000);
  };

  onMounted(() => {
    pollTaskStatus();
  });

  onUnmounted(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  const emit = defineEmits(['redo']);
</script>

<template>
  <div>
    <div class="w-120 m-auto step2class">
      <Descriptions :column="1" class="mt-5 w-120 m-auto">
        <Descriptions.Item label="视频处理中">
          <Progress
            :percent="totalProgress"
            size="default"
            :status="totalProgress === 100 ? 'success' : 'active'"
            :format="() => `${totalProgress.toFixed(2)}%`"
            type="line"
          />
        </Descriptions.Item>
      </Descriptions>
    </div>
  </div>
</template>
<script lang="ts" setup>
  import { Progress, Descriptions } from 'ant-design-vue';
  import { ref, onMounted, computed, onUnmounted } from 'vue';

  const progressStatus = ref({
    addingBorders: 0,
    cropping: 0,
    processing: 0,
  });

  const isProcessing = ref(true);
  const showResultDialog = ref(false);

  const totalProgress = computed(() => {
    return (
      progressStatus.value.addingBorders * 0.1 +
      progressStatus.value.cropping * 0.2 +
      progressStatus.value.processing * 0.7
    );
  });

  // 添加动画ID存储对象
  const animationIds = {
    addingBorders: null as number | null,
    cropping: null as number | null,
    processing: null as number | null,
  };

  // Function to smoothly update progress bar value
  function updateProgressBar(
    progressType: 'addingBorders' | 'cropping' | 'processing',
    targetValue: number,
  ) {
    // 如果目标值相同则直接返回
    if (targetValue === progressStatus.value[progressType]) return;

    // 取消进行中的动画
    if (animationIds[progressType]) {
      cancelAnimationFrame(animationIds[progressType]);
    }

    const startValue = progressStatus.value[progressType];
    const startTime = Date.now();
    const duration = 1000; // 动画持续时间500毫秒

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = startValue + (targetValue - startValue) * progress;

      progressStatus.value[progressType] = currentValue;

      if (progress < 1) {
        animationIds[progressType] = requestAnimationFrame(animate);
      } else {
        animationIds[progressType] = null;
      }
    };

    animationIds[progressType] = requestAnimationFrame(animate);
  }

  const emit = defineEmits(['next', 'prev', 'send-team-data']);
  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
    borderWidth: {
      type: Number,
      default: 0,
    },
  });

  const checkTaskStatus = async () => {
    // 查询任务状态
    const response = await fetch(`/api/status/${props.taskId}`);
    if (!response.ok) {
      throw new Error('查询任务状态失败');
    }
    const data = await response.json();
    return data;
  };

  // 修改任务完成时的进度更新
  const pollTaskStatus = async () => {
    if (props.taskId === ' ') return;

    const interval = setInterval(async () => {
      const response = await checkTaskStatus();
      if (response.status === 'completed') {
        isProcessing.value = false;
        showResultDialog.value = true;

        // 使用平滑更新代替直接赋值
        updateProgressBar('addingBorders', 100);
        updateProgressBar('cropping', 100);
        updateProgressBar('processing', 100);

        clearInterval(interval);
        setTimeout(() => {
          'waiting timeout';
        }, 1000);
        emit('next');
      } else {
        switch (response.status) {
          case 'Adding borders to frames':
            updateProgressBar('addingBorders', response.progress);
            break;
          case 'cropping':
            updateProgressBar('addingBorders', 100);
            updateProgressBar('cropping', response.progress);
            break;
          case 'processing':
            updateProgressBar('cropping', 100);
            updateProgressBar('processing', response.progress);
            break;
        }
      }
    }, 1050);
  };
  onMounted(() => {
    pollTaskStatus();
  });
  // 组件卸载时清理动画
  onUnmounted(() => {
    Object.keys(animationIds).forEach((key) => {
      const id = animationIds[key as keyof typeof animationIds];
      if (id) {
        cancelAnimationFrame(id);
      }
    });
  });
</script>

<style scoped>
  .progress-container {
    width: 80%; /* Set to any percentage or pixel value */
    max-width: 500px; /* Optional max-width to control the maximum size */
  }

  .step2class {
    width: 80%;
    height: auto;
    text-align: center;
  }
</style>

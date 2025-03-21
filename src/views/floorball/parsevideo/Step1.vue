<template>
  <div class="step1">
    <div class="step1-form">
      <p>上传待分析的比赛视频</p>
      <BasicUpload
        :maxSize="0"
        :maxNumber="1"
        @task-id="handleTaskIdChange"
        :accept="['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv']"
        @border-width="handleBorderWidthChange"
        :emptyHidePreview="true"
        :disabled="!isButtonDisabled"
      />
      <a-button
        type="primary"
        @click="onSubmit"
        style="align-items: center; justify-content: center; margin-top: 20px"
        :disabled="isButtonDisabled"
      >
        下一步
      </a-button>
    </div>

    <Divider />

    <h3>说明</h3>
    <h4>本网站及其技术由东华大学计算机科学与技术学院开发，智能系统仅供校内软式曲棍球集训队试用</h4>
  </div>
</template>

<script lang="ts" setup>
  import { BasicUpload } from '@/components/Upload';
  import { Divider } from 'ant-design-vue';
  import { ref } from 'vue';

  const emit = defineEmits(['next', 'task-id', 'borderWidth']);

  // Button disabled state
  const isButtonDisabled = ref(true);

  // Handle task ID change
  function handleTaskIdChange(receivedTaskId: string) {
    isButtonDisabled.value = false;
    emit('task-id', receivedTaskId);
  }

  // Handle border width change
  const handleBorderWidthChange = (borderWidth: number) => {
    emit('borderWidth', borderWidth);
  };

  // Custom submit button click handler
  async function onSubmit() {
    emit('next');
  }
</script>

<style lang="less" scoped>
  .step1 {
    &-form {
      width: 450px;
      margin: 0 auto;
      text-align: center;
    }

    h3 {
      margin: 0 0 12px;
      color: @text-color-base;
      font-size: 16px;
      line-height: 32px;
    }

    h4 {
      margin: 0 0 4px;
      color: @text-color-base;
      font-size: 14px;
      line-height: 22px;
    }

    p {
      color: @text-color-base;
    }
  }
</style>

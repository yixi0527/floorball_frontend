<template>
  <div class="step1">
    <div class="step1-form">
      <p> 上传待分析的比赛视频</p>
      <BasicUpload
        :maxSize="0"
        :maxNumber="1"
        @change="handleChange"
        @task-id="handleTaskId"
        :showPreviewNumber="false"
        :accept="['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv']"
        @border-width="handleBorderWidth"
      />
      <a-button
        type="primary"
        @click="customSubmitFunc"
        style="align-items: center; justify-content: center; margin-top: 20px"
        >下一步</a-button
      >
    </div>

    <Divider />

    <h3>说明</h3>
    <h4>本网站及其技术由东华大学计算机科学与技术学院开发，智能系统仅供校内软式曲棍球集训队使用</h4>
  </div>
</template>
<script lang="ts" setup>
  import { BasicUpload } from '@/components/Upload';
  import { Divider } from 'ant-design-vue';

  const emit = defineEmits(['next', 'task-id', 'borderWidth']);

  const handleBorderWidth = (borderWidth: number) => {
    console.log('borderWidth in step 1', borderWidth);
    emit('borderWidth', borderWidth);
  };

  async function customSubmitFunc() {
    emit('next');
  }

  function handleChange(fileList: any) {
    // 处理文件列表变化
    console.log(fileList);
  }

  function handleTaskId(ReceivedtaskId) {
    console.log('taskId in step 1', ReceivedtaskId);
    emit('task-id', ReceivedtaskId);
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

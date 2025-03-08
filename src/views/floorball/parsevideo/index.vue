<template>
  <PageWrapper
    title="球场智瞳"
    contentBackground
    content=" 基于AI的软式曲棍球智能分析系统"
    contentClass="p-4"
  >
    <div class="step-form-form">
      <Steps :current="current">
        <Steps.Step title="上传视频" />
        <Steps.Step title="分析视频" />
        <Steps.Step title="查看报告" />
      </Steps>
    </div>
    <div class="mt-5">
      <Step1
        @next="handleStep1Next"
        v-show="current === 0"
        @task-id="handleTaskId"
        @border-width="handleBorderWidth"
      />
      <Step2
        @prev="handleStepPrev"
        @next="handleStep2Next"
        v-show="current === 1"
        v-if="state.initStep2"
        :task-id="taskId"
        :border-width="borderWidth"
      />
      <Step3 v-show="current === 2" @redo="handleRedo" v-if="state.initStep3" :task-id="taskId" />
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import Step1 from './Step1.vue';
  import Step2 from './Step2.vue';
  import Step3 from './Step3.vue';
  import { PageWrapper } from '@/components/Page';
  import { Steps } from 'ant-design-vue';

  defineOptions({ name: 'FormStepPage' });

  const current = ref(0);
  const taskId = ref('');
  const borderWidth = ref(0);

  const state = reactive({
    initStep2: false,
    initStep3: false,
  });

  function handleStep1Next(step1Values: any) {
    current.value++;
    state.initStep2 = true;
  }

  function handleStepPrev() {
    current.value--;
    if (current.value === 0) {
      state.initStep2 = false;
    } else if (current.value === 1) {
      state.initStep3 = false;
    }
  }

  function handleStep2Next(step2Values: any) {
    current.value++;
    state.initStep2 = false;
    state.initStep3 = true;
  }

  function handleRedo() {
    current.value = 0;
    state.initStep2 = false;
    state.initStep3 = false;
  }

  function handleTaskId(newTaskId) {
    taskId.value = newTaskId;
  }

  const handleBorderWidth = (newBorderWidth: number) => {
    borderWidth.value = newBorderWidth;
  };
</script>

<style lang="less" scoped>
  .step-form-content {
    padding: 24px;
    background-color: @component-background;
  }

  .step-form-form {
    width: 750px;
    margin: 0 auto;
  }
</style>

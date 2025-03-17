<template>
  <PageWrapper
    title="球场智瞳"
    contentBackground
    content="基于AI的软式曲棍球智能分析系统"
    contentClass="p-4"
  >
    <div class="step-form-form">
      <Steps :current="currentStep">
        <Steps.Step title="上传视频" />
        <Steps.Step title="分析视频" />
        <Steps.Step title="人工校正（可选）" />
        <Steps.Step title="下载报告" />
      </Steps>
    </div>

    <div class="step-content mt-5">
      <!-- Step 1 -->
      <Step1
        @next="onStep1Next"
        v-show="currentStep === 0"
        @task-id="onTaskIdChange"
        @border-width="onBorderWidthChange"
      />

      <!-- Step 2 -->
      <Step2
        @prev="onStepPrev"
        @next="onStep2Next"
        v-show="currentStep === 1"
        v-if="stepsState.isStep2Initialized"
        :task-id="taskId"
        :border-width="borderWidth"
        @send-team-data="onTeamDataReceived"
      />

      <!-- Step 3 -->
      <Step3
        v-show="currentStep === 2"
        @redo="onRedo"
        @next="onStep3Next"
        v-if="stepsState.isStep3Initialized"
        :task-id="taskId"
        :choosedTeamData="selectedTeamData"
      />

      <!-- Step 4 -->
      <Step4 v-show="currentStep === 3" v-if="stepsState.isStep4Initialized" :task-id="taskId" />
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import Step1 from './Step1.vue';
  import Step2 from './Step2.vue';
  import Step3 from './Step3.vue';
  import Step4 from './Step4.vue';
  import { PageWrapper } from '@/components/Page';
  import { Steps } from 'ant-design-vue';

  defineOptions({ name: 'FormStepPage' });

  // Current step index
  const currentStep = ref(0);

  // Task and team data
  const taskId = ref('');
  const selectedTeamData = ref<any[]>([]);

  // Step states for conditional rendering
  const stepsState = reactive({
    isStep2Initialized: false,
    isStep3Initialized: false,
    isStep4Initialized: false,
  });

  // Border width for styling
  const borderWidth = ref(0);

  // Step 1 next button handler
  function onStep1Next() {
    currentStep.value++;
    stepsState.isStep2Initialized = true;
  }

  // Previous step button handler
  function onStepPrev() {
    currentStep.value--;
    if (currentStep.value === 0) {
      stepsState.isStep2Initialized = false;
    } else if (currentStep.value === 1) {
      stepsState.isStep3Initialized = false;
    }
  }

  // Step 2 next button handler
  function onStep2Next() {
    currentStep.value++;
    stepsState.isStep2Initialized = false;
    stepsState.isStep3Initialized = true;
  }

  function onStep3Next() {
    currentStep.value++;
    stepsState.isStep3Initialized = false;
    stepsState.isStep4Initialized = true;
  }

  // Redo button handler
  function onRedo() {
    currentStep.value = 0;
    stepsState.isStep2Initialized = false;
    stepsState.isStep3Initialized = false;
  }

  // Task ID change handler
  function onTaskIdChange(newTaskId: string) {
    taskId.value = newTaskId;
  }

  // Border width change handler
  const onBorderWidthChange = (newBorderWidth: number) => {
    borderWidth.value = newBorderWidth;
  };

  // Team data received handler
  const onTeamDataReceived = (teamData: any) => {
    selectedTeamData.value = teamData;
    console.log('Received team data:', teamData);
  };
</script>

<style lang="less" scoped>
  .step-form-form {
    width: 750px;
    margin: 0 auto;
  }

  .step-content {
    padding: 24px;
    background-color: @component-background;
  }
</style>

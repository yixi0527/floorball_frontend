<template>
  <div>
    <div class="w-120 m-auto step2class">
      <!-- <Alert message="Step 1: 自动预处理" show-icon /> -->
      <Descriptions :column="1" class="mt-5 w-120 m-auto">
        <Descriptions.Item label="添加边框中">
          <Progress
            :percent="progressStatus.addingBorders"
            size="default"
            :status="progressStatus.addingBorders === 100 ? 'success' : 'active'"
            :format="(percent) => `${progressStatus.addingBorders.toFixed(2)}%`"
            type="line"
          />
        </Descriptions.Item>

        <Descriptions.Item label="视频剪裁中">
          <Progress
            :percent="progressStatus.cropping"
            size="default"
            :status="progressStatus.cropping === 100 ? 'success' : 'active'"
            :format="(percent) => `${progressStatus.cropping.toFixed(2)}%`"
          />
        </Descriptions.Item>

        <Descriptions.Item label="跟踪分析中">
          <Progress
            :percent="progressStatus.processing"
            size="default"
            :status="progressStatus.processing === 100 ? 'success' : 'active'"
            :format="(percent) => `${progressStatus.processing.toFixed(2)}%`"
            type="line"
          />
        </Descriptions.Item>
      </Descriptions>
    </div>
    <!-- <div v-if="progressStatus.processing === 100" class="w-120 m-auto step2class">
      <Alert message="Step 2: 半自动标注" show-icon style="width: 100%; margin-bottom: 20px" />
      <assigntask
        :info="itemInfo"
        ref="assigntaskRef"
        :borderWidth="props.borderWidth"
        :completed="chooseComplete"
      />
      <Divider />
      <Row :gutter="16" style="display: flex; flex-wrap: nowrap">
        <Col :span="20" style="flex: 0 0 90%">
          <choose
            ref="chooseRef"
            :info="itemInfo"
            @operation-completed="operationCompleted"
            style="width: 100%"
            @send-team-data="handleTeamData"
          />
        </Col>
        <Col
          :span="4"
          style="
            display: flex;
            flex: 0 0 10%;
            flex-direction: column;
            align-items: flex-end;
            justify-content: flex-start;
            gap: 10px;
          "
        >
          <a-button type="warning" @click="triggerIgnore">{{ '忽\u3000略' }}</a-button>
          <a-button type="primary" @click="processPreviousTask">上一步</a-button>
          <a-button
            type="primary"
            @click="customSubmitFunc"
            :disabled="currentTaskIndex < total_ann"
          >
            {{ currentTaskIndex === total_ann ? '下一步' : `${currentTaskIndex} / ${total_ann}` }}
          </a-button>
        </Col>
      </Row>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
  import { Alert, Divider, Progress, Descriptions, Col, Row } from 'ant-design-vue';
  import { ref, onMounted } from 'vue';
  // import Assigntask from '@/views/floorball/assign/Assigntask.vue';
  // import Choose from '@/views/floorball/assign/Choose.vue';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const chooseRef = ref(null);
  const chooseComplete = ref(false);

  // Function to smoothly update progress bar value
  function updateProgressBar(
    progressType: 'addingBorders' | 'cropping' | 'processing',
    targetValue: number,
  ) {
    const currentValue = progressStatus.value[progressType];
    progressStatus.value[progressType] = targetValue;
    // const increment = targetValue > currentValue ? 1 : -1; // Determine the direction of progress

    // const interval = setInterval(() => {
    //   progressStatus.value[progressType] += increment;

    //   if (progressStatus.value[progressType] > targetValue) {
    //     progressStatus.value[progressType] = targetValue; // Ensure we don't overshoot
    //     clearInterval(interval);
    //   }
    // }, 50); // Update progress every 50 ms for a smooth transition
  }

  async function autoUpdateAnnotation(taskId, key) {
    const url = `/api/task/${taskId}/annotations/${key}`;
    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', // 指定 JSON 类型
        },
      });
    } catch (error) {
      console.error('Error:', error);
    }
    console.log('autoUpdateAnnotation', taskId, key);
  }

  const triggerIgnore = () => {
    if (chooseRef.value) {
      chooseRef.value.handleIgnore();
    }
  };
  const assigntaskRef = ref(null);

  const isProcessing = ref(true);
  const showResultDialog = ref(false);
  const progressStatus = ref({
    addingBorders: 0,
    cropping: 0,
    processing: 0,
    coachingReport: 0,
    playerReport: 0,
    generatingReport: true,
  });

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

  const handleTeamData = (data) => {
    console.log('handleTeamData in step 2', data);
    emit('send-team-data', data);
  };

  const getOriginalVideo = async (frame_id) => {
    // 查询任务状态
    const response = await fetch(`/api/task/${props.taskId}/frame/${frame_id}`);
    const data = await response.json();
    return data.frame_path;
  };

  const lastEvent = ref([]);

  async function processPreviousTask() {
    if (lastEvent.value[lastEvent.value.length - 1] === 'keep_new') {
      chooseRef.value.handleDeleteRectangle();
    }
    lastEvent.value.pop();

    if (chooseComplete.value) {
      chooseComplete.value = false;
    }

    // 如果不是第一个任务，则将 currentTaskIndex 减少
    if (currentTaskIndex.value > 0) {
      currentTaskIndex.value -= 1;
    } else {
      currentTaskIndex.value = 0; // 防止越界，如果已经是第一个任务就停留在第一个任务
    }

    const keys = Object.keys(tasks.value); // 获取任务的keys
    const key = keys[currentTaskIndex.value]; // 使用key从tasks中获取对应的任务
    const item = tasks.value[key];

    itemInfo.value.key = currentTaskIndex.value + 1;
    itemInfo.value.track_id = item.track_id;
    itemInfo.value.tlwh = item.tlwh;
    itemInfo.value.imageUrl = getUrlPath(await getOriginalVideo(item.frame_id));
    itemInfo.value.targetUrl = getUrlPath(item.target_image_path);
    itemInfo.value.status = item.status;
    itemInfo.value.taskId = props.taskId;

    if (assigntaskRef.value) {
      assigntaskRef.value.updateMaskPosition();
    }

    await waitForUserAction();
  }

  function customSubmitFunc() {
    // fetch(`/api/task/${props.taskId}/complete_annotation`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    // });
    emit('next');
  }

  const checkTaskStatus = async () => {
    // 查询任务状态
    const response = await fetch(`/api/status/${props.taskId}`);
    if (!response.ok) {
      throw new Error('查询任务状态失败');
    }
    const data = await response.json();
    return data;
  };

  const tasks = ref([]);
  const currentTaskIndex = ref(0);
  const itemInfo = ref({
    key: 0,
    track_id: 0,
    twlh: [0, 0, 0, 0],
    imageUrl: '',
    targetUrl: '',
    status: '',
    taskId: '',
  });
  const getAllTasks = async () => {
    // 查询任务状态
    const response = await fetch(`/api/task/${props.taskId}/annotations`);
    const data = await response.json();
    return data;
  };

  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/results');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }

  const total_ann = ref(0);
  const lastFrameId = ref(0);
  const lastFrameDir = ref('');

  // 获取任务并处理
  async function afterpreprocess() {
    const data = await getAllTasks(); // 获取任务列表
    const total = data.total_annotations; // 获取任务总数
    tasks.value = data.annotations; // 将获取的数据存入任务列表
    total_ann.value = total;
    const keys = Object.keys(tasks.value); // 获取任务的keys

    // 初始化currentTaskIndex为第一个键的索引
    currentTaskIndex.value = 0;

    // 开始逐个处理任务
    while (currentTaskIndex.value < keys.length) {
      const key = keys[currentTaskIndex.value]; // 获取当前任务的key
      const item = tasks.value[key]; // 使用key从tasks中获取对应的任务
      itemInfo.value.key = currentTaskIndex.value + 1;
      itemInfo.value.track_id = item.track_id;
      itemInfo.value.tlwh = item.tlwh;
      if (item.frame_id != lastFrameId.value) {
        itemInfo.value.imageUrl = getUrlPath(await getOriginalVideo(item.frame_id));
        lastFrameId.value = item.frame_id;
        lastFrameDir.value = itemInfo.value.imageUrl;
      } else {
        itemInfo.value.imageUrl = lastFrameDir.value;
      }

      itemInfo.value.targetUrl = getUrlPath(item.target_image_path);
      itemInfo.value.status = item.status;
      itemInfo.value.taskId = props.taskId;
      if (assigntaskRef.value) {
        assigntaskRef.value.updateMaskPosition();
      }
      // 等待用户操作完成
      await waitForUserAction();
      // 操作完成后，更新任务状态
      currentTaskIndex.value += 1;
      if (currentTaskIndex.value == total_ann.value) {
        createMessage.success('标注完成!');
        chooseRef.value.sendTeamData();
        chooseComplete.value = true;
        break;
      }
    }
  }

  type Annotation = {
    track_id: number;
    role_predict: string;
  };

  const trackIdtoRole = ref({});

  async function skipAnno() {
    console.log('skipAnno');
    const data = await getAllTasks(); // 获取任务列表
    customSubmitFunc();
  }

  // 定义等待用户操作的函数，每次调用都会返回一个新的 Promise
  // 每次调用时返回一个新的 Promise，并将其 resolve 函数保存到数组中
  function waitForUserAction() {
    return new Promise((resolve) => {
      waitingResolvers.push(resolve);
    });
  }
  let waitingResolvers = [];
  // 子组件事件触发时调用的方法
  function operationCompleted(event) {
    lastEvent.value.push(event);
    waitingResolvers.forEach((resolve) => resolve());
    waitingResolvers = []; // 清空等待列表，防止重复调用
  }
  const pollTaskStatus = async () => {
    if (props.taskId === ' ') {
      return;
    }
    const interval = setInterval(async () => {
      const response = await checkTaskStatus();
      if (
        response.status === 'completed' ||
        (response.status != 'processing' &&
          response.status != 'cropping' &&
          response.status != 'Adding borders to frames')
      ) {
        isProcessing.value = false;
        showResultDialog.value = true;
        progressStatus.value.addingBorders = 100;
        progressStatus.value.cropping = 100;
        progressStatus.value.processing = 100;
        progressStatus.value.coachingReport = 100;
        progressStatus.value.playerReport = 100;
        progressStatus.value.generatingReport = false;
        clearInterval(interval);
        // afterpreprocess();
        skipAnno();
      } else {
        switch (response.status) {
          case 'Adding borders to frames':
            updateProgressBar('addingBorders', response.progress);
            break;
          case 'cropping':
            progressStatus.value.addingBorders = 100;
            // progressStatus.value.cropping = response.progress;
            updateProgressBar('cropping', response.progress);
            break;
          case 'processing':
            // progressStatus.value.cropping = 100;
            // progressStatus.value.processing = response.progress;
            updateProgressBar('processing', response.progress);
            break;
          default:
            progressStatus.value.processing = 100;
            break;
        }
      }
    }, 1000);
  };
  onMounted(() => {
    pollTaskStatus();
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

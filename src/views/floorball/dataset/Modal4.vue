<template>
  <BasicModal
    v-bind="$attrs"
    @register="register"
    title="添加球员"
    @visible-change="handleVisibleChange"
    @ok="handleOk"
  >
    <div class="pt-3px pr-3px">
      <BasicForm @register="registerForm" :model="modelRef" />
    </div>
  </BasicModal>
</template>
<script lang="ts" setup>
  import { ref, nextTick } from 'vue';
  import { BasicModal, useModalInner } from '@/components/Modal';
  import { BasicForm, FormSchema, useForm } from '@/components/Form';
  import axios from 'axios';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const emit = defineEmits(['success']);

  function handleOk() {
    handleSubmit();
  }
  const props = defineProps({
    userData: { type: Object },
    taskId: { type: String },
  });
  const receivedTrackId = ref(null);
  async function matchRelatedData(track_id, player_id) {
    console.log(
      'matchRelatedData in add player, track_id, player_id, task_id',
      track_id,
      player_id,
      props.taskId,
    );
    const formData = new FormData();
    formData.append('track_id', track_id);
    formData.append('player_id', player_id);
    await fetch(`/api/task/${props.taskId}/associate_database`, {
      method: 'POST',
      body: formData, // 使用 FormData 发送数据
    });
    return;
  }
  async function handleSubmit() {
    const formData = getFieldsValue();
    const payload = new FormData();
    payload.append('player_name', formData.playerName);
    payload.append('player_role', formData.playerRole);
    payload.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    let player_id = -1;
    if (modelRef.value.playerPhoto) {
      console.log('图片:', modelRef.value.playerPhoto);
      if (typeof modelRef.value.playerPhoto === 'string') {
        try {
          // 从后端获取图片文件
          const response = await axios.get(modelRef.value.playerPhoto, {
            responseType: 'blob',
          });
          // 创建 File 对象并添加到 FormData
          const file = new File([response.data], 'player_photo.jpg', { type: response.data.type });
          console.log('图片文件:', file);
          payload.append('player_photo', file);
        } catch (error) {
          console.error('图片获取失败:', error);
          return; // 终止提交
        }
      } else {
        payload.append('player_photo', modelRef.value.playerPhoto);
      }
    }
    console.log('提交的数据:', payload);
    payload.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    try {
      const response = await axios.post('/api/playerdata/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      player_id = response.data.player_id;
      console.log('提交成功:', response.data);
    } catch (error) {
      console.error('提交失败:', error);
    }
    emit('success');
    if (receivedTrackId.value) {
      matchRelatedData(receivedTrackId.value, player_id); // 1 为 player_id
      createMessage.success('新增并配对成功');
    }
    closeModal();
  }

  const schemas: FormSchema[] = [
    {
      field: 'playerName',
      component: 'Input',
      label: '球员名称',
      colProps: {
        span: 24,
      },
    },
    {
      field: 'playerRole',
      component: 'Select',
      label: '球员角色',
      colProps: {
        span: 24,
      },
      componentProps: {
        options: [
          { label: '球员', value: 'Player' },
          { label: '守门员', value: 'Goalkeeper' },
        ],
        defaultValue: 'Player',
      },
    },
    {
      field: 'playerPhoto',
      component: 'ImageUpload',
      label: '球员照片',
      colProps: {
        span: 24,
      },
      componentProps: {
        onChange: (file) => {
          console.log('文件列表:', file);
          if (file) {
            modelRef.value.playerPhoto = file; // 存入文件对象
          } else {
            modelRef.value.playerPhoto = null;
          }
        },
      },
    },
  ];

  const modelRef = ref({});
  const [registerForm, { getFieldsValue, setFieldsValue }] = useForm({
    labelWidth: 120,
    schemas,
    showActionButtonGroup: false,
    actionColOptions: {
      span: 24,
    },
  });

  const [register, { closeModal }] = useModalInner((data) => {
    data && onDataReceive(data);
  });
  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/results');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }
  async function onDataReceive(data) {
    console.log('Data Received', data);
    receivedTrackId.value = data.track_id;

    if (typeof data.playerPhoto === 'string') {
      // 从后端获取图片文件
      const url = getUrlPath(data.playerPhoto);
      console.log('图片地址:', url);
      const response = await axios.get(url, {
        responseType: 'blob',
      });
      // 创建 File 对象并添加到 FormData
      const file = new File([response.data], 'player_photo.jpg', { type: response.data.type });
      console.log('图片文件:', file);
      modelRef.value.playerPhoto = file;
      // 方式1;
      setFieldsValue({
        playerName: data.playerName,
        playerRole: data.playerRole,
        playerPhoto: data.playerPhoto, // 传入图片地址
      });
    } else {
      setFieldsValue({
        playerName: data.playerName,
        playerRole: data.playerRole,
        playerPhoto: data.playerPhoto, // 传入图片地址
      });
    }
  }

  function handleVisibleChange(v) {
    v && props.userData && nextTick(() => onDataReceive(props.userData));
  }
</script>

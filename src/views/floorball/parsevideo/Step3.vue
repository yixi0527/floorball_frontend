<template>
  <div class="container">
    <div class="box">
      <match :data="matchData" @image-selected="handleImageSelected" ref="matchComponent" />
      <!-- 居中 -->
      <div :style="{ display: 'flex', justifyContent: 'center', marginTop: '20px' }">
        <!-- Confirm Selection Button -->
        <a-button type="primary" @click="logSelection" :style="{ margin: '5px' }"
          >确认匹配</a-button
        >
        <!-- Complete Assignment Button -->
        <a-button @click="completeAssociate" :style="{ margin: '5px' }">完成校正</a-button>
      </div>
    </div>
    <div class="box">
      <playerTable
        :columns="customColumns"
        :matchId="matchId"
        @player-selected="handlePlayerSelected"
        ref="tableRef"
        :taskId="props.taskId"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { defineProps, defineEmits, onMounted, h, ref } from 'vue';
  import playerTable from '@/views/floorball/dataset/playerTable.vue';
  import match from '@/views/floorball/match/match.vue';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';
  import { BasicColumn } from '@/components/Table';
  import { useMessage } from '@/hooks/web/useMessage';
  import axios from 'axios';

  const { createMessage } = useMessage();
  const matchId = ref(null);
  const playerId = ref(null);
  const matchComponent = ref(null);
  const tableRef = ref(null);

  const customColumns: BasicColumn[] = [
    {
      title: '赛场照片',
      dataIndex: 'playerPhoto',
      width: 80,
      sorter: false,
      customRender: ({ record }) => {
        const imageUrl = record.playerPhoto?.trim() ? record.playerPhoto : defaultImage;
        return h('img', {
          src: imageUrl,
          alt: 'Player Photo',
          style: 'width: 50px; height: 50px; border-radius: 5px; object-fit: cover;',
        });
      },
    },
    { title: '名称', dataIndex: 'playerName', width: 150, editRow: true, sorter: true },
  ];

  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
    // choosedTeamData: {
    //   type: Array,
    //   default: () => [],
    // },
  });
  const handleImageSelected = (rectangle) => {
    console.log('父组件接收到选中的 track_id:', rectangle);
    matchId.value = rectangle;
  };

  const handlePlayerSelected = (id) => {
    console.log('父组件接收到选中的 playerId:', id);
    playerId.value = id;
  };

  async function matchRelatedData(track_id, player_id) {
    const formData = new FormData();
    formData.append('track_id', track_id);
    formData.append('player_id', player_id);

    await fetch(`/api/task/${props.taskId}/associate_database`, {
      method: 'POST',
      body: formData, // 使用 FormData 发送数据
    });
    return;
  }

  const logSelection = () => {
    playerId.value = tableRef.value.getSelectedRowsPlayerId();
    if (playerId.value == 0) {
      createMessage.error('请在数据库中选择一个球员');
      return;
    } else if (playerId.value == -1) {
      createMessage.error('数据库中最多只能选择一个球员');
      return;
    }
    matchRelatedData(matchId.value.track_id, playerId.value);

    createMessage.success('匹配成功');
    console.log('选中的 Match ID:', matchId.value, '选中的 Player ID:', playerId.value);
  };

  const emit = defineEmits(['redo', 'next']);

  async function completeAssociate() {
    createMessage.success('完成！');
    emit('next');
    return;
  }

  async function getMatchData(taskId: string): Promise<any> {
    try {
      const response = await fetch(`/api/task/${taskId}/need_association_database`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch match data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Match Data: ', data);
      return data;
    } catch (error) {
      console.error('Error fetching match data:', error);
      throw error; // 让调用方知道请求失败
    }
  }

  interface Annotation {
    track_id: number;
    role_predict: string;
  }

  async function extractTrackRoles(taskId: string): Promise<Record<number, string>> {
    try {
      const response = await fetch(`/api/task/${taskId}/annotations`);
      if (!response.ok) {
        throw new Error(`Failed to fetch annotations: ${response.status} ${response.statusText}`);
      }

      const data: { annotations?: Record<string, Annotation> } = await response.json();

      if (!data.annotations || typeof data.annotations !== 'object') {
        console.warn('Invalid response format: annotations is not an object', data);
        return {};
      }

      const result: Record<number, string> = {};
      for (const key in data.annotations) {
        const annotation = data.annotations[key];
        result[annotation.track_id] = annotation.role_predict;
      }
      return result;
    } catch (error) {
      console.error('Error fetching track roles:', error instanceof Error ? error.message : error);
      return {};
    }
  }

  function determineTeamName(role: string): string {
    if (role.includes('Red')) return 'Red Team';
    if (role.includes('Blue')) return 'Blue Team';
    return 'Others';
  }

  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/results');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }

  async function addAsNewPlayer(role, img) {
    const payload = new FormData();
    payload.append('player_name', '新运动员');
    payload.append('player_role', role);
    payload.append('player_photo', img);
    console.log('提交的数据:', payload);
    payload.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
    try {
      const response = await axios.post('/api/playerdata/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const player_id = response.data.player_id;
      console.log('提交成功:', response.data);
      return player_id;
    } catch (error) {
      console.error('提交失败:', error);
    }
  }

  async function getImageFile(filename: string): Promise<File | null> {
    console.log('Fetching image:', getUrlPath(filename));
    try {
      const response = await fetch(getUrlPath(filename));
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error fetching image: ', error);
      return null;
    }
  }

  async function transformMatchData(matchData: any, trackIdtoRole: Record<number, string>) {
    let transformedData: { name: string; rectangles: any[] }[] = [];

    for (const role of matchData.unassigned_roles) {
      const rolePredict = trackIdtoRole[role.track_id] || 'Unassigned';
      const teamName = determineTeamName(rolePredict);

      const imgPath = getUrlPath(role.target_image_path);

      // 确保图片文件在获取完成后再进行后续操作
      // const img = await getImageFile(role.target_image_path);

      // if (role.predict_player_id === null) {
      //   role.predict_player_id = await addAsNewPlayer(rolePredict, img);
      // }

      const response = await fetch(`/api/playerdata/${role.predict_player_id}`);
      const playerInfo = await response.json(); // 解析 JSON 数据

      let rectangle = {
        imgPath,
        track_id: role.track_id,
        predictPlayerId: role.predict_player_id,
        role: rolePredict,
        playerName: playerInfo.playerName,
      };

      let team = transformedData.find((team) => team.name === teamName);
      if (!team) {
        team = { name: teamName, rectangles: [] };
        transformedData.push(team);
      }
      team.rectangles.push(rectangle);
    }

    return transformedData;
  }

  const trackIdtoRole = ref<Record<number, string>>({});
  const matchData = ref<any[]>([]);

  onMounted(async () => {
    try {
      trackIdtoRole.value = await extractTrackRoles(props.taskId);
      console.log('Track ID to Role:', trackIdtoRole.value);
      const data = await getMatchData(props.taskId);
      console.log('Match Data:', data);
      matchData.value = await transformMatchData(data, trackIdtoRole.value);
      console.log('Transformed Match Data:', matchData.value);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  });
</script>

<style scoped>
  .container {
    display: flex;
    gap: 16px; /* 控制两个组件之间的间距 */
    width: 100%;
  }

  .box {
    display: flex;
    flex: 1; /* 让两个组件各占 50% */
    flex-direction: column; /* 让子元素正确填充 */
    min-width: 0; /* 防止溢出 */
    overflow: hidden; /* 避免组件过宽时超出 */
  }
</style>

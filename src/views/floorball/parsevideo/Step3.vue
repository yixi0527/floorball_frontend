<template>
  <div class="container" v-loading="loadingRef">
    <ScrollXTransition>
      <div class="box" v-show="showRect">
        <ChooseAndMatch
          :data="transformedNeedAnnotationData"
          @image-selected="handleImageSelected"
          @complete-update="updateTransformedNeedAnnotationData($event)"
          ref="matchComponent"
          :taskId="props.taskId"
          :step="step"
        />
        <div :style="{ display: 'flex', justifyContent: 'center', marginTop: '20px' }">
          <div v-if="step === 2">
            <a-button type="primary" @click="logSelection" :style="{ margin: '5px' }"
              >确认匹配</a-button
            >
          </div>
          <a-button :style="{ margin: '5px' }" @click="completeRole" type="primary"
            >完成校正</a-button
          >
        </div>
      </div>
    </ScrollXTransition>
    <ScrollXTransition>
      <div class="box" v-show="showPlayerTable">
        <playerTable
          :columns="customColumns"
          :match-id="rect"
          @player-selected="handlePlayerSelected"
          ref="tableRef"
          :taskId="props.taskId"
        />
      </div>
    </ScrollXTransition>
  </div>
</template>

<script lang="ts" setup>
  import { defineProps, defineEmits, onMounted, h, ref } from 'vue';
  import { BasicColumn } from '@/components/Table';
  import { useMessage } from '@/hooks/web/useMessage';
  import { ScrollXTransition } from '@/components/Transition/index';
  import playerTable from '@/views/floorball/dataset/playerTable.vue';
  import ChooseAndMatch from '@/views/floorball/match/ChooseAndMatch.vue';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';
  import { Loading, useLoading } from '@/components/Loading';

  const { createMessage } = useMessage();
  const trackIdtoRoleDict = ref<Record<number, string>>({});
  const showRect = ref(true);
  const showPlayerTable = ref(false);
  const rect = ref(null);
  const playerId = ref(null);
  const matchComponent = ref(null);
  const tableRef = ref(null);
  const transformedNeedAnnotationData = ref(null);
  const step = ref(1);
  const wrapEl = ref<ElRef>(null);
  const loadingRef = ref(false);

  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['redo', 'next']);

  const [openWrapLoading, closeWrapLoading] = useLoading({
    target: wrapEl,
    props: {
      tip: '加载中...',
      absolute: true,
    },
  });

  // 动画开始
  function start() {
    loadingRef.value = true;
    console.log('开始加载');
    showRect.value = false;
    showPlayerTable.value = false; // 先隐藏 playerTable
    step.value = 2;
  }

  async function completeRole() {
    if (step.value === 1) {
      start();
      fetch(`/api/task/${props.taskId}/complete_annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await fetch(`/api/task/${props.taskId}/need_association_database`, {
        method: 'GET',
      });
      const data = await response.json();
      console.log('Match Data: ', data);
      transformedNeedAnnotationData.value = await transformTrackIdToRoleToRect(
        data.unassigned_roles,
      );
      showPlayerTable.value = true;
      showRect.value = true;
      loadingRef.value = false;
    } else if (step.value === 2) {
      complete();
    }
  }

  // 球员数据库表格结构
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

  // match 组件选中事件
  const handleImageSelected = (rectangle) => {
    console.log('父组件接收到选中的 track_id:', rectangle);
    rect.value = rectangle[0];
  };

  // playerTable 组件选中事件
  const handlePlayerSelected = (id) => {
    console.log('父组件接收到选中的 playerId:', id);
    playerId.value = id;
  };

  // 提交匹配相关数据
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

  // 匹配逻辑验证
  const logSelection = () => {
    playerId.value = tableRef.value.getSelectedPlayerId();
    if (playerId.value == 0) {
      createMessage.error('请在数据库中选择一个球员');
      return;
    } else if (playerId.value == -1) {
      createMessage.error('数据库中最多只能选择一个球员');
      return;
    }
    matchRelatedData(rect.value.track_id, playerId.value);
    console.log('选中的 Match ID:', rect.value, '选中的 Player ID:', playerId.value);
    createMessage.success('匹配成功');
  };

  // 完成校正（包括anno和asso），进行下一步
  async function complete() {
    await fetch(`/api/task/${props.taskId}/complete_association`, {
      method: 'POST',
    });
    createMessage.success('校正完成！');
    emit('next');
    return;
  }

  // 获取需要关联的数据
  async function getNeedAssoData(taskId: string): Promise<any> {
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

  // 在这里获取**需要标注的所有项**，其中包括了role_predict，按照其值进行初步分类，并支持手动校正
  async function extractTrackRoles(taskId: string): Promise<Record<number, string>> {
    return data;
  }

  // 角色按队伍预分配
  function determineTeamName(role: string): string {
    if (role.includes('Red')) return 'Red Team';
    if (role.includes('Blue')) return 'Blue Team';
    if (role.includes('Referee')) return 'Referee';
    return 'Ignore';
  }

  // 工具，获取图片路径
  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/results');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }

  // 获取图片文件，用于展示
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

  async function transformTrackIdToRoleToRect(trackIdtoRole) {
    let transformedData = [];
    for (const t2rKey in trackIdtoRole) {
      const t2r = trackIdtoRole[t2rKey];
      let rolePredict = 'Unassigned';
      if (t2r.role_predict) {
        rolePredict = t2r.role_predict;
        trackIdtoRoleDict[t2r.track_id] = t2r.role_predict;
      } else {
        rolePredict = trackIdtoRoleDict[t2r.track_id] || 'Unassigned';
      }
      const teamName = determineTeamName(rolePredict);
      const imgPath = getUrlPath(t2r.target_image_path);
      let name = '未匹配';
      if (t2r.predict_player_id) {
        const response = await fetch(`/api/playerdata/${t2r.predict_player_id}`);
        const playerInfo = await response.json(); // 解析 JSON 数据
        name = playerInfo.playerName;
      } else {
        name = '未匹配';
      }
      console.log('name:', name);
      let rectangle = {
        imgPath,
        track_id: t2r.track_id,
        predictPlayerId: t2r.predict_player_id,
        role: rolePredict,
        playerName: name,
        annoKey: t2rKey,
      };
      let team = transformedData.find((team) => team.name === teamName);
      if (!team) {
        team = { name: teamName, rectangles: [] };
        transformedData.push(team);
      }
      team.rectangles.push(rectangle);
    }
    console.log('transformedData:', transformedData);
    return transformedData;
  }

  async function transformMatchData(matchData: any, trackIdtoRole: Record<number, string>) {
    let transformedData: { name: string; rectangles: any[] }[] = [];

    for (const role of matchData.unassigned_roles) {
      const rolePredict = trackIdtoRole[role.track_id] || 'Unassigned';
      const teamName = determineTeamName(rolePredict);

      const imgPath = getUrlPath(role.target_image_path);
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

  const matchData = ref<any[]>([]);

  function updateTransformedNeedAnnotationData(event) {
    console.log('event: ', event);
    updateRoleAndGroup(rect.value, event);
  }

  function updateRoleAndGroup(selectedRect, event) {
    if (!selectedRect) return;

    // 事件与新的 role 对应关系
    const roleMap = {
      '11': { role: 'Red Player', group: 'Red Team' },
      '12': { role: 'Red GoalKeeper', group: 'Red Team' },
      '13': { role: 'Referee', group: 'Referee' },
      '21': { role: 'Blue Player', group: 'Blue Team' },
      '22': { role: 'Blue GoalKeeper', group: 'Blue Team' },
      '23': { role: 'Referee', group: 'Referee' },
      ignore: { role: 'Ignore', group: 'Ignore' },
    };

    const newRoleData = roleMap[event];
    if (!newRoleData) return; // 事件无效则不修改

    const { track_id, annoKey } = selectedRect;

    let foundRect = null;
    let oldGroupIndex = -1;
    let rectIndex = -1;

    // 遍历找到当前 track_id 所在的分组
    transformedNeedAnnotationData.value.forEach((group, groupIndex) => {
      group.rectangles.forEach((rect, index) => {
        if (rect.track_id === track_id) {
          foundRect = rect;
          oldGroupIndex = groupIndex;
          rectIndex = index;
        }
      });
    });

    rect.value = null;

    if (!foundRect || oldGroupIndex === -1 || rectIndex === -1) return;

    // 更新角色信息
    foundRect.role = newRoleData.role;
    foundRect.playerName = newRoleData.role;
    trackIdtoRoleDict[track_id] = newRoleData.role;

    // 如果新分组与旧分组相同，则只修改 role
    if (transformedNeedAnnotationData.value[oldGroupIndex].name === newRoleData.group) {
      return;
    }

    // 从原分组移除
    transformedNeedAnnotationData.value[oldGroupIndex].rectangles.splice(rectIndex, 1);

    // 将其添加到新分组
    let newGroup = transformedNeedAnnotationData.value.find(
      (group) => group.name === newRoleData.group,
    );
    if (newGroup) {
      newGroup.rectangles.push(foundRect);
    } else {
      // 若新分组不存在，则创建
      transformedNeedAnnotationData.value.push({
        name: newRoleData.group,
        rectangles: [foundRect],
      });
    }
  }

  onMounted(async () => {
    const response = await fetch(`/api/task/${props.taskId}/annotations`);
    const needAnnotationData = await response.json();
    transformedNeedAnnotationData.value = await transformTrackIdToRoleToRect(
      needAnnotationData.annotations,
    );
    // const data = await getMatchData(props.taskId);
    // console.log('Match Data:', data);
    // matchData.value = await transformMatchData(data, trackIdtoRole.value);
    // console.log('Transformed Match Data:', matchData.value);
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

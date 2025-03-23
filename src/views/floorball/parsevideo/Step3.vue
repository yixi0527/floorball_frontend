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
          :selectedTeam="choosedTeam"
        />
        <div :style="{ display: 'flex', justifyContent: 'center', marginTop: '20px' }">
          <div v-if="step === 1">
            <a-button
              :style="{
                margin: '5px',
                backgroundColor: '#e57373',
                borderColor: '#e57373',
                marginBottom: '20px',
                color: '#fff',
              }"
              type="primary"
              @click="
                () => {
                  choosedTeam = 'Red';
                  complete();
                }
              "
              >提交红队为我方球队</a-button
            >
            <a-button
              :style="{
                margin: '5px',
                backgroundColor: '#64b5f6',
                borderColor: '#64b5f6',
                marginBottom: '20px',
                color: '#fff',
              }"
              type="primary"
              @click="
                () => {
                  choosedTeam = 'Blue';
                  complete();
                }
              "
              >提交蓝队为我方球队</a-button
            >
          </div>
          <div v-if="step === 2">
            <a-button type="primary" @click="logSelection" :style="{ margin: '5px' }"
              >确认匹配</a-button
            >
            <a-button type="primary" @click="complete" :style="{ margin: '5px' }"
              >完成校正</a-button
            >
          </div>
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
  const choosedTeam = ref('Red');
  const taskIdStore = ref('');

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

  async function complete() {
    console.log('step:', step.value);
    console.log('choosedTeam:', choosedTeam.value);
    if (step.value === 1) {
      await updateIgnore();
      start();
      await fetch(`/api/task/${props.taskId}/complete_annotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('complete anno', props.taskId);
      const formData = new FormData();
      formData.append('target_team', choosedTeam.value);
      const response = await fetch(`/api/task/${props.taskId}/need_association_database`, {
        method: 'POST', // 改为 POST 以支持 FormData
        body: formData,
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
      console.log('complete asso', props.taskId);
      await fetch(`/api/task/${props.taskId}/complete_association`, {
        method: 'POST',
      });
      createMessage.success('校正完成！');
      emit('next');
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
    console.log('logselection:', props.taskId);
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

  async function updateAnnotation(key, action, assigned_track_id, role) {
    const url = `/api/task/${props.taskId}/annotations/${key}`;
    const params = {
      action: action,
      assigned_track_id: assigned_track_id,
      role: role,
    };

    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', // 指定 JSON 类型
        },
        body: JSON.stringify(params), // 转换为 JSON 字符串
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function updateIgnore() {
    console.log('updateIgnore', transformedNeedAnnotationData.value);
    // 遍历transformedNeedAnnotationData.value，找到name为Ignore的group, 并将其中的rectangles，使用updateAnnotation，为里面的每一个rect发送ingore请求
    const ignoreGroup = transformedNeedAnnotationData.value.find(
      (group) => group.name === 'Ignore',
    );
    if (!ignoreGroup) return;
    console.log('ignoreGroup:', ignoreGroup);
    ignoreGroup.rectangles.forEach((rect) => {
      setTimeout(() => {
        console.log('sleep 1s', rect);
      }, 500);
      updateAnnotation(rect.annoKey, 'ignore', -1, '');
    });
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

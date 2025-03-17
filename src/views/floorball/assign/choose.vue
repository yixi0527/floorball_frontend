<template>
  <div>
    <div class="teams-container">
      <template v-for="(team, index) in teams" :key="index">
        <div class="team-wrapper">
          <Dropdown
            @menu-event="(event) => handleMenuEvent(event, index)"
            :trigger="['hover']"
            :dropMenuList="[
              { text: '球员', event: '1' },
              { text: '守门员', event: '2' },
              { text: '裁判', event: '3' },
            ]"
            :style="{
              // 置于容器最左侧
              position: 'absolute',
              left: '0',
            }"
          >
            <a-button
              :style="{
                backgroundColor: team.name === '红队' ? '#e57373' : '#64b5f6',
                borderColor: team.name === '红队' ? '#e57373' : '#64b5f6',
                marginBottom: '20px',
                color: '#fff',
              }"
            >
              添加为{{ team.name }}
            </a-button>
          </Dropdown>

          <div class="rectangles-container">
            <div
              v-for="(rectangle, rectIndex) in team.rectangles"
              :key="rectIndex"
              class="rectangle"
            >
              <div class="rectangle-wrapper">
                <img :src="rectangle.imgPath" alt="Rectangle Image" class="rectangle-img" />
              </div>
              <Dropdown
                @menu-event="(event) => handleAssign(event, rectangle)"
                :trigger="['hover']"
                :dropMenuList="[{ text: '分配并更新照片', event: 'assign_update' }]"
                @click="assign"
              >
                <a-button type="primary" style="margin-top: 5px"> 分配 </a-button>
              </Dropdown>
            </div>
          </div>
        </div>
        <div v-if="index === 0 && teams.length > 1" class="divider"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { Dropdown } from '@/components/Dropdown';
  import { useMessage } from '@/hooks/web/useMessage';

  const { createMessage } = useMessage();
  const props = defineProps({ info: Object, completed: Boolean });
  const emit = defineEmits(['operation-completed', 'send-team-data']);

  const teams = ref([
    { name: '红队', rectangles: [] },
    { name: '蓝队', rectangles: [] },
  ]);

  function handleMenuEvent(event, index) {
    addRectangle(index, event.event);
  }

  function handleAssign(event, rectangle) {
    if (event.event === 'assign_update') {
      rectangle.imgPath = props.info.targetUrl;
    }
    assign(rectangle);
  }

  async function updateAnnotation(action, assigned_track_id, role) {
    const { taskId, key } = props.info;
    const url = `/api/task/${taskId}/annotations/${key}`;
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

  const assign = (rectangle) => {
    updateAnnotation('assign', rectangle.track_id);
    createMessage.success('分配成功');
    emit('operation-completed', 'assign');
  };
  const lastAddedRect = ref([]);

  function addRectangle(index, roleindex) {
    let role = 0;
    const teamname = index === 0 ? 'Red' : 'Blue';
    switch (roleindex) {
      case '1':
        role = teamname + 'Player';
        break;
      case '2':
        role = teamname + 'Goalkeeper';
        break;
      case '3':
        role = teamname + 'Referee';
        break;
      default:
        role = 0;
    }

    const newRectangle = {
      imgPath: props.info.targetUrl,
      track_id: props.info.track_id,
      role: role,
    };
    teams.value[index].rectangles.push(newRectangle);
    updateAnnotation('keep_new', newRectangle.track_id, role);
    emit('operation-completed', 'keep_new');
    createMessage.success('添加成功');
    // 记录当前添加的矩形所属的 team 和 index
    lastAddedRect.value.push({ team: index });
  }

  function handleIgnore() {
    updateAnnotation('ignore', 0, '0');
    emit('operation-completed', 'ignore');
    createMessage.success('已跳过');
  }
  // 用来记录上一个添加的 rect 的 team 和 index

  function handleDeleteRectangle() {
    if (lastAddedRect.value.length === 0) {
      createMessage.warn('已是第一个');
      return;
    }
    const { team } = lastAddedRect.value[lastAddedRect.value.length - 1];
    // 如果有记录的矩形信息
    if (team !== null) {
      // 删除团队中对应的矩形
      teams.value[team].rectangles.pop();
      // 重新更新 lastAddedRect（删除后没有上一个矩形的信息）
      lastAddedRect.value.pop();
    }
    createMessage.success('返回上一个');
  }

  function sendTeamData() {
    emit('send-team-data', teams.value);
  }

  defineExpose({ handleIgnore, handleDeleteRectangle, sendTeamData });
</script>

<style scoped>
  .ignore-button-container {
    margin-bottom: 20px;
    text-align: center;
  }

  .teams-container {
    display: flex;
    align-items: stretch;
  }

  .team-wrapper {
    width: 48%;
  }

  .rectangles-container {
    display: flex;
    flex-wrap: wrap;
  }

  .rectangle {
    justify-content: center;
    width: 100px;
    height: 100px;
    margin: 10px;
    text-align: center;
  }

  .rectangle-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    background-color: #ccc;
  }

  .rectangle-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    background-color: gray;
  }

  .divider {
    width: 2px;
    height: 100%;
    margin: 0 20px;
    background-color: #b0b0b0;
  }

  .header {
    width: 100%;
    text-align: right;
  }
</style>

<template>
  <div class="p-4 space-y-4" v-if="dataLoaded">
    <div class="flex items-center space-x-4">
      <label for="teamSelect" class="font-bold">选择队伍:</label>
      <Dropdown
        @menu-event="(event) => selectTeam(event)"
        :trigger="['hover']"
        :dropMenuList="dropdownTeams"
      >
        <a-button class="border p-2 rounded bg-gray-100">
          {{ selectedTeamLabel }}
        </a-button>
      </Dropdown>
    </div>
    <div v-if="step === 1">
      <div class="flex space-x-4">
        <Dropdown @menu-event="handleMenuEvent" :trigger="['hover']" :dropMenuList="redTeamOptions">
          <a-button
            :style="{
              backgroundColor: '#e57373',
              borderColor: '#e57373',
              marginBottom: '20px',
              color: '#fff',
            }"
          >
            调整为红队
          </a-button>
        </Dropdown>

        <Dropdown
          @menu-event="handleMenuEvent"
          :trigger="['hover']"
          :dropMenuList="blueTeamOptions"
        >
          <a-button
            :style="{
              backgroundColor: '#64b5f6',
              borderColor: '#64b5f6',
              marginBottom: '20px',
              color: '#fff',
            }"
          >
            调整为蓝队
          </a-button>
        </Dropdown>

        <a-button type="warning" @click="handleIgnore">忽略</a-button>
        <a-button type="primary" @click="handleAssign">匹配</a-button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-3 mt-4">
      <div
        v-for="rectangle in selectedRectangles"
        :key="rectangle.annoKey"
        @click="selectImage(rectangle)"
        class="cursor-pointer p-3 border rounded-xl shadow-md bg-white transition duration-300 transform hover:scale-105 hover:shadow-xl"
        :class="{
          'border-blue-500 ring-2 ring-blue-300': rectangle.annoKey === selectedRects[0]?.annoKey,
          'border-green-500 ring-2 ring-green-300': rectangle.annoKey === selectedRects[1]?.annoKey,
        }"
      >
        <div
          class="w-full h-40 bg-gray-100 flex justify-center items-center rounded-lg overflow-hidden relative"
        >
          <!-- 轨迹ID -->
          <p
            v-if="step === 1"
            class="absolute top-2 left-2 text-xs font-semibold text-gray-800 bg-white bg-opacity-80 backdrop-blur-md px-2 py-1 rounded-md shadow"
          >
            {{ rectangle.track_id }}
          </p>
          <!-- 图片 -->
          <img :src="rectangle.imgPath" alt="Player Image" class="w-full h-full object-contain" />
          <!-- 角色或玩家名称 -->
          <p
            class="absolute bottom-2 right-2 text-xs font-semibold text-gray-800 bg-white bg-opacity-80 backdrop-blur-md px-2 py-1 rounded-md shadow"
          >
            {{ step === 1 ? rectangle.role.split(' ')[1] || rectangle.role : rectangle.playerName }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, defineProps, defineEmits, watch } from 'vue';
  import { Dropdown } from '@/components/Dropdown';
  import { useMessage } from '@/hooks/web/useMessage';
  import { message } from 'ant-design-vue';

  const { createMessage } = useMessage();
  const props = defineProps({
    data: Array,
    taskId: String,
    step: Number,
    selectedTeamProp: String,
  });
  const emit = defineEmits(['imageSelected', 'completeUpdate']);

  const dataLoaded = ref(false);
  const selectedTeam = props.selectedTeamProp ? ref(props.selectedTeamProp) : ref('');
  const selectedRects = ref([]);

  const dropdownTeams = computed(() =>
    props.data.map((team) => ({ text: team.name, event: team.name })),
  );
  const selectedTeamLabel = computed(
    () => props.data.find((t) => t.name === selectedTeam.value)?.name || '选择队伍',
  );

  watch(
    () => props.data,
    (newData) => {
      if (newData?.length) {
        selectedTeam.value = newData[0]?.name || '';
        dataLoaded.value = true;
      }
    },
    { immediate: true },
  );

  const redTeamOptions = [
    { text: '调整为球员', event: '11' },
    { text: '调整为守门员', event: '12' },
    { text: '调整为裁判', event: '13' },
  ];

  const blueTeamOptions = [
    { text: '调整为球员', event: '21' },
    { text: '调整为守门员', event: '22' },
    { text: '调整为裁判', event: '23' },
  ];

  const handleMenuEvent = (event) => {
    if (!selectedRects.value.length) {
      createMessage.error('请先选择一个角色');
      return;
    }

    const roleMap = {
      11: 'Red Player',
      12: 'Red Goalkeeper',
      13: 'Referee',
      21: 'Blue Player',
      22: 'Blue Goalkeeper',
      23: 'Referee',
    };

    updateAnnotation(
      selectedRects.value[0].annoKey,
      'keep_new',
      selectedRects.value[0].track_id,
      roleMap[event.event],
    );
    createMessage.success('调整成功');
    emit('completeUpdate', event.event);
    selectedRects.value = [];
  };

  const selectTeam = (event) => {
    selectedTeam.value = event.event;
  };

  const selectedRectangles = computed(() => {
    let rectangles =
      props.data
        .find((team) => team.name === selectedTeam.value)
        ?.rectangles?.slice()
        .sort((a, b) => a.track_id - b.track_id) || [];

    if (props.step === 2) {
      const seenTrackIds = new Set();
      rectangles = rectangles.filter((rect) => {
        if (seenTrackIds.has(rect.track_id)) {
          return false;
        }
        seenTrackIds.add(rect.track_id);
        return true;
      });
    }

    return rectangles;
  });

  const selectImage = (rectangle) => {
    const index = selectedRects.value.findIndex((item) => item.annoKey === rectangle.annoKey);
    if (index !== -1) {
      selectedRects.value.splice(index, 1);
    } else {
      if (selectedRects.value.length === 2) selectedRects.value.shift();
      selectedRects.value.push(rectangle);
    }
    emit('imageSelected', selectedRects.value);
  };

  const handleIgnore = () => {
    if (selectedRects.value.length) {
      updateAnnotation(selectedRects.value[0].annoKey, 'ignore', -1, '');
      emit('completeUpdate', 'ignore');
      selectedRects.value = [];
      message.success('已忽略');
    }
  };

  const handleAssign = () => {
    if (selectedRects.value.length < 2) {
      createMessage.error('请选择匹配对象');
      return;
    }
    updateAnnotation(selectedRects.value[1].annoKey, 'assign', selectedRects.value[0].track_id, '');
    selectedRects.value[1].track_id = selectedRects.value[0].track_id;
    emit('completeUpdate', 'assign');
    selectedRects.value.pop();
    message.success('匹配成功');
  };

  async function updateAnnotation(key, action, assigned_track_id, role) {
    console.log('update anno', key, action, assigned_track_id, role);
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
</script>

<style scoped>
  .border-blue-500 {
    border-width: 3px;
    border-color: blue;
  }
</style>

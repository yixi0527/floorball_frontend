<template>
  <div class="p-4" v-if="dataLoaded">
    <label for="teamSelect" class="font-bold">选择队伍:</label>
    <select id="teamSelect" v-model="selectedTeam" class="border p-2 ml-2 rounded">
      <option v-for="team in props.data" :key="team.name" :value="team.name">
        {{ team.name === 'Red Team' ? '红队' : team.name === 'Blue Team' ? '蓝队' : '教练' }}
      </option>
    </select>

    <div class="grid grid-cols-3 gap-4 mt-4">
      <div
        v-for="rectangle in selectedRectangles"
        :key="rectangle.track_id"
        @click="selectImage(rectangle)"
        class="cursor-pointer p-2 border rounded-lg transition duration-200 transform hover:scale-105"
        :class="{
          'border-blue-500 shadow-lg': selectedTrackId?.track_id === rectangle.track_id,
        }"
      >
        <div
          class="w-full h-36 bg-gray-200 flex justify-center items-center rounded-md overflow-hidden"
        >
          <img :src="rectangle.imgPath" alt="Player Image" class="w-full h-full object-contain" />
          <div class="absolute bottom-0 right-0 p-1 bg-black text-white text-xs rounded-bl-md">
            {{ rectangle.playerName || '其他' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, defineProps, defineEmits, watch } from 'vue';

  const props = defineProps({
    data: Array, // 由父组件传入
  });

  const emit = defineEmits(['imageSelected']);

  const dataLoaded = ref(false);
  const selectedTeam = ref('');
  const selectedTrackId = ref(null);

  // 监听 props.data 确保数据加载后再初始化组件
  watch(
    () => props.data,
    (newData) => {
      if (newData && newData.length > 0) {
        selectedTeam.value = newData[0]?.name || '';
        dataLoaded.value = true;
        console.log('match组件接收到的 data :', newData);
      }
    },
    { immediate: true }, // 确保初始值也被检测
  );

  const selectedRectangles = computed(() => {
    return props.data.find((team) => team.name === selectedTeam.value)?.rectangles || [];
  });

  const selectImage = (rectangle) => {
    selectedTrackId.value = rectangle;
    console.log('子组件选中的 rectangle:', rectangle);
    emit('imageSelected', rectangle);
  };
</script>

<style scoped>
  .border-blue-500 {
    border-width: 3px;
    border-color: blue;
  }
</style>

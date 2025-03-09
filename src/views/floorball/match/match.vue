<template>
  <div class="p-4">
    <label for="teamSelect" class="font-bold">选择队伍:</label>
    <select id="teamSelect" v-model="selectedTeam" class="border p-2 ml-2 rounded">
      <option v-for="team in choosedTeamData" :key="team.name" :value="team.name">
        {{ team.name }}
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
        </div>
        <!-- <p class="text-center mt-2 text-gray-700 font-medium">ID: {{ rectangle.track_id }}</p> -->
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, defineProps, defineEmits } from 'vue';

  const props = defineProps({
    choosedTeamData: Array, // 由父组件传入
  });

  const emit = defineEmits(['imageSelected']);

  const selectedTeam = ref(props.choosedTeamData[0]?.name || '');
  const selectedTrackId = ref(null);

  const selectedRectangles = computed(() => {
    return props.choosedTeamData.find((team) => team.name === selectedTeam.value)?.rectangles || [];
  });

  const selectImage = (rectangle) => {
    selectedTrackId.value = rectangle;
    console.log('子组件选中的 rectangle:', rectangle);
    emit('imageSelected', rectangle); // 触发事件，传递选中的 track_id 给父组件
  };
</script>

<style scoped>
  .border-blue-500 {
    border-width: 3px;
    border-color: blue;
  }
</style>

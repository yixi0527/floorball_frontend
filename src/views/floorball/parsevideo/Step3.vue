<template>
  <div class="container">
    <div class="left">
      <match :choosedTeamData="choosedTeamData" @image-selected="handleImageSelected" />
    </div>
  </div>
  <div class="right">
    <playerTable />
  </div>
</template>

<script lang="ts" setup>
  import { defineProps, defineEmits, onMounted } from 'vue';
  import playerTable from '@/views/floorball/dataset/playerTable.vue';
  import match from '@/views/floorball/match/match.vue';

  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
    choosedTeamData: {
      type: Array,
      default: () => [],
    },
  });
  const handleImageSelected = (trackId) => {
    console.log('父组件接收到选中的 track_id:', trackId);
  };
  const emit = defineEmits(['redo']);

  onMounted(() => {
    console.log('Step3 props:', props);
    console.log('Step3 mounted');
  });
</script>

<style scoped>
  .container {
    display: flex;
    width: 100%;
  }

  .left,
  .right {
    flex: 1;
    padding: 10px;
  }

  .right {
    border-left: 1px solid #ddd;
  }
</style>

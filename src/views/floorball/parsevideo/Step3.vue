<template>
  <div class="container">
    <div class="box">
      <match
        :choosedTeamData="choosedTeamData"
        @image-selected="handleImageSelected"
        ref="matchComponent"
      />
      <a-button primary @click="logSelection"> 确认选择 </a-button>
    </div>
    <div class="box">
      <playerTable
        :columns="customColumns"
        @player-selected="handlePlayerSelected"
        ref="tableRef"
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
    choosedTeamData: {
      type: Array,
      default: () => [],
    },
  });
  const handleImageSelected = (trackId) => {
    console.log('父组件接收到选中的 track_id:', trackId);
    matchId.value = trackId;
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
    matchRelatedData(matchId.value, playerId.value);

    createMessage.success('配对成功');
    console.log('选中的 Match ID:', matchId.value, '选中的 Player ID:', playerId.value);
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

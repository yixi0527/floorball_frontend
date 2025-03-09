<template>
  <div>
    <BasicTable @register="registerTable" @edit-change="handleEditChange" :showSelectionBar="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="getTableActions(record)" />
        </template>
      </template>

      <template #toolbar>
        <a-button type="primary" @click="handleCreatePlayer">新增队员</a-button>
        <a-button type="warning" @click="handleDeletePlayers">删除选中数据</a-button>
        <PlayerModal @register="registerPlayerModal" @success="handleModalSuccess" />
      </template>
    </BasicTable>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, defineProps, h, defineExpose } from 'vue';
  import { cloneDeep } from 'lodash-es';
  import {
    BasicTable,
    useTable,
    TableAction,
    BasicColumn,
    ActionItem,
    EditRecordRow,
    FormProps,
  } from '@/components/Table';
  import { useModal } from '@/components/Modal';
  import { useMessage } from '@/hooks/web/useMessage';
  import { message as antdMessage } from 'ant-design-vue';
  import PlayerModal from './Modal4.vue';
  import { cardList } from './data';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';

  // 类型声明
  type PlayerRecord = EditRecordRow & {
    playerId: string;
    playerName: string;
    playerRole: string;
    playerPhoto?: string;
    contests: number;
  };

  // 属性定义
  const props = defineProps<{
    columns?: BasicColumn[];
    matchId?: { track_id: string; role: string; imgPath: string };
    taskId?: string;
  }>();

  // 依赖注入
  const { createMessage } = useMessage();
  const [registerPlayerModal, { openModal: openPlayerModal }] = useModal();

  // 表格状态
  const playersData = ref<PlayerRecord[]>([]);
  const currentEditingKey = ref<string>('');

  // 列配置
  const getTableColumns = computed(() => props.columns || createDefaultColumns());
  // 生命周期
  onMounted(initializeTableData);

  // 暴露方法
  defineExpose({ getSelectedPlayerId });

  /* ---------- 工具函数 ---------- */
  function createDefaultColumns(): BasicColumn[] {
    return [
      { title: 'ID', dataIndex: 'playerId', width: 60, sorter: true },
      {
        title: '赛场照片',
        dataIndex: 'playerPhoto',
        width: 80,
        customRender: ({ record }) =>
          h('img', {
            src: getPlayerImageUrl(record.playerPhoto),
            style: 'width: 50px; height: 50px; border-radius: 5px; object-fit: cover;',
          }),
      },
      { title: '名称', dataIndex: 'playerName', width: 150, editRow: true, sorter: true },
      { title: '角色', dataIndex: 'playerRole', width: 150, editRow: true, sorter: true },
      { title: '参与比赛次数', dataIndex: 'contests', width: 100, sorter: true },
    ];
  }

  function createTableConfig() {
    return {
      title: '队伍管理',
      titleHelpMessage: ['队伍管理'],
      columns: getTableColumns.value,
      showIndexColumn: false,
      showTableSetting: true,
      tableSetting: { fullScreen: true },
      actionColumn: { width: 80, title: '操作', dataIndex: 'action' },
      rowSelection: { type: 'checkbox' },
      useSearchForm: true,
      formConfig: createSearchFormConfig(),
    };
  }

  const [
    registerTable,
    { reload: reloadTable, setTableData, getSelectRows, setLoading, clearSelectedRowKeys },
  ] = useTable(createTableConfig());

  /* ---------- 数据操作 ---------- */
  async function initializeTableData() {
    playersData.value = cardList;
    await reloadPlayerData();
  }

  async function reloadPlayerData() {
    setLoading(true);
    try {
      const response = await fetch('/api/playerdata');
      const remoteData = await response.json();
      setTableData(formatPlayerData(remoteData));
    } finally {
      setLoading(false);
    }
  }

  function formatPlayerData(rawData: any[]): PlayerRecord[] {
    return rawData.map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      playerPhoto: getPlayerImageUrl(player.playerPhoto),
      playerRole: player.playerRole,
      contests: player.videoUuids ? JSON.parse(player.videoUuids).length : 0,
    }));
  }

  function getPlayerImageUrl(imagePath?: string): string {
    console.log('imagePath:', imagePath);
    console.log(imagePath?.trim());
    if (!imagePath?.includes('playerdatabase')) return defaultImage;
    const apiPath = imagePath.substring(imagePath.indexOf('/playerdatabase'));
    return `http://localhost:8001${apiPath.replace(/\\/g, '/')}`;
  }

  /* ---------- 事件处理 ---------- */
  function handleCreatePlayer() {
    const modalParams = props.matchId
      ? {
          playerName: props.matchId.track_id,
          playerRole: props.matchId.role,
          playerPhoto: props.matchId.imgPath,
          track_id: props.matchId.track_id,
        }
      : {};

    openPlayerModal(true, modalParams);
  }

  async function handleDeletePlayers() {
    const selectedPlayers = getSelectRows();
    if (!selectedPlayers.length) {
      antdMessage.info('请先选择要删除的行');
      return;
    }

    try {
      await Promise.all(selectedPlayers.map(deletePlayer));
      playersData.value = playersData.value.filter((p) => !selectedPlayers.includes(p));
      clearSelectedRowKeys();
      await reloadPlayerData();
      antdMessage.success(`成功删除 ${selectedPlayers.length} 条数据`);
    } catch (error) {
      createMessage.error('删除操作失败');
    }
  }

  async function deletePlayer(player: PlayerRecord) {
    try {
      const response = await fetch(`/api/playerdata/${player.playerId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      antdMessage.success(`删除成功: ${player.playerName}`);
    } catch (error) {
      console.error('删除失败:', error);
      antdMessage.error(`删除失败: ${player.playerName}`);
    }
  }

  /* ---------- 表格行操作 ---------- */
  function getTableActions(record: PlayerRecord): ActionItem[] {
    return record.editable
      ? [
          { label: '保存', onClick: () => handleSavePlayer(record) },
          { label: '取消', onClick: () => record.onEdit?.(false) },
        ]
      : [
          {
            label: '编辑',
            disabled: !!currentEditingKey.value && currentEditingKey.value !== record.key,
            onClick: () => startEditing(record),
          },
        ];
  }

  function startEditing(record: PlayerRecord) {
    currentEditingKey.value = record.key;
    if (!record.originalData) {
      record.originalData = cloneDeep(record);
    }
    record.onEdit?.(true);
  }

  async function handleSavePlayer(record: PlayerRecord) {
    const isValid = await record.onValid?.();
    if (!isValid) {
      antdMessage.error('请填写正确的数据');
      return;
    }

    try {
      const changes = getChangedFields(record);
      if (Object.keys(changes).length === 0) {
        antdMessage.info('未检测到数据变更');
        return;
      }

      await submitPlayerChanges(record.playerId, changes);
      record.onEdit?.(false, true);
      currentEditingKey.value = '';
      antdMessage.success('保存成功');
    } catch (error) {
      antdMessage.error('保存失败');
    }
  }

  function getChangedFields(record: PlayerRecord): Record<string, any> {
    const changes: Record<string, any> = {};
    for (const key in record.editValueRefs) {
      if (record.editValueRefs[key] !== record.originalData[key] && key !== 'userID') {
        changes[key] = record.editValueRefs[key];
      }
    }
    return changes;
  }

  async function submitPlayerChanges(playerId: string, changes: Record<string, any>) {
    const formData = new FormData();
    Object.entries(changes).forEach(([key, value]) => {
      formData.append(key, value);
    });

    await fetch(`/api/playerdata/${playerId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  /* ---------- 辅助函数 ---------- */
  function createSearchFormConfig(): Partial<FormProps> {
    return {
      labelWidth: 100,
      schemas: [
        {
          field: 'playerName',
          label: '运动员姓名',
          component: 'Input',
          colProps: { xl: 12, xxl: 8 },
        },
      ],
    };
  }

  function getSelectedPlayerId(): number {
    const selected = getSelectRows();
    if (selected.length === 0) return 0;
    if (selected.length > 1) return -1;
    return selected[0].playerId;
  }

  function handleModalSuccess() {
    reloadPlayerData();
  }

  function handleEditChange({ column, value, record }) {
    console.log('Edit changed:', column, value, record);
  }

  onMounted(() => {
    console.log('PlayerTable mounted');
  });
</script>

<template>
  <div>
    <BasicTable @register="registerTable" @edit-change="onEditChange" :showSelectionBar="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="createActions(record)" />
        </template>
      </template>
      <template #toolbar>
        <a-button type="primary" @click="handleCreatePrompt"> 新增队员 </a-button>
        <Modal4 @register="register4" @success="handleSuccess" />
        <a-button type="warning" @click="deletePlayer"> 删除选中数据 </a-button>
      </template>
    </BasicTable>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed, defineProps, h, defineExpose } from 'vue';
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
  import { cardList } from './data';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';
  import { useModal } from '@/components/Modal';
  import Modal4 from './Modal4.vue';
  import { useMessage } from '@/hooks/web/useMessage';
  // 导入msg用法
  import { message as msg } from 'ant-design-vue';

  const { createMessage } = useMessage();

  function deletePlayer() {
    const selectedRows = getSelectRows();
    clearSelectedRowKeys();
    console.log('Delete Player', selectedRows);
    if (!selectedRows || selectedRows.length === 0) {
      msg.info('请先选择要删除的行');
      return;
    }
    console.log('Delete Player', selectedRows);
    // 删除选中数据
    selectedRows.forEach((row) => {
      fetch(`/api/playerdata/${row.playerId}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`删除失败: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log(`删除成功:`, data);
          msg.success(`删除成功: ${row.playerName}`);
        })
        .catch((error) => {
          console.error(`删除失败:`, error);
          msg.error(`删除失败: ${row.playerName}`);
        });
    });
    data.value = data.value.filter((item) => !selectedRows.includes(item));
    myreload();
  }
  const [register4, { openModal: openModal4 }] = useModal();

  function handleCreatePrompt() {
    openModal4(true, {
      playerName: props.matchId.track_id,
      playerRole: props.matchId.role,
      playerPhoto: props.matchId.imgPath,
      track_id: props.matchId.track_id,
    });
  }

  const props = defineProps<{ columns?: BasicColumn[]; matchId; taskId }>();

  const defaultColumns: BasicColumn[] = [
    { title: 'ID', dataIndex: 'playerId', width: 60, sorter: true },
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
    { title: '角色', dataIndex: 'playerRole', width: 150, editRow: true, sorter: true },
    { title: '参与比赛次数', dataIndex: 'contests', width: 100, sorter: true },
  ];

  const columns = computed(() => props.columns || defaultColumns);
  const data = ref<any[]>([]);
  const currentEditKeyRef = ref('');

  const [registerTable, { reload, setTableData, getSelectRows, setLoading, clearSelectedRowKeys }] =
    useTable({
      title: '队伍管理',
      titleHelpMessage: ['队伍管理'],
      columns: columns.value,
      showIndexColumn: false,
      showTableSetting: true,
      tableSetting: { fullScreen: true },
      actionColumn: { width: 80, title: '操作', dataIndex: 'action' },
      rowSelection: { type: 'checkbox' },
      showSelectionBar: true,
      useSearchForm: true,
      formConfig: getFormConfig(),
    });

  function getUrlPath(imageUrl: string): string {
    const index = imageUrl.indexOf('/playerdatabase');
    if (index !== -1) {
      return ('http://localhost:8001' + imageUrl.substring(index)).replace(/\\/g, '/'); // +8 是因为 '/results' 的长度为 8
    }
    return ''; // 如果没有找到 '/results'，返回空字符串
  }

  async function myreload() {
    console.log('myreload');
    setLoading(true);
    // 重新加载数据
    const response = await fetch('/api/playerdata');
    const data = await response.json();
    // 格式化数据
    const result = data.map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      playerPhoto: getUrlPath(player.playerPhoto),
      playerRole: player.playerRole,
      contests: player.videoUuids ? JSON.parse(player.videoUuids).length : 0,
    }));
    // 更新数据
    setLoading(false);
    setTableData(result);
  }

  async function handleSuccess() {
    myreload();
  }

  onMounted(async () => {
    data.value = cardList;
    setTableData(data.value);
  });

  function getFormConfig(): Partial<FormProps> {
    return {
      labelWidth: 100,
      schemas: [
        // { field: `playerId`, label: `运动员ID`, component: 'Input', colProps: { xl: 12, xxl: 8 } },
        {
          field: `playerName`,
          label: `运动员姓名`,
          component: 'Input',
          colProps: { xl: 12, xxl: 8 },
        },
      ],
    };
  }

  function handleEdit(record: EditRecordRow) {
    currentEditKeyRef.value = record.key;
    if (!record.originalData) {
      record.originalData = cloneDeep(record); // 保存原始数据副本
    }
    record.onEdit?.(true);
  }

  async function handleSave(record: EditRecordRow) {
    // msg.loading({ content: '正在保存...', duration: 0, key: 'saving' });
    const valid = await record.onValid?.();
    if (valid) {
      try {
        const originalData = record.originalData;
        const editedData = cloneDeep(record.editValueRefs);

        // 过滤出发生变化的字段
        const changedData: Partial<typeof editedData> = {};
        for (const key in editedData) {
          if (editedData[key] !== originalData[key] && key !== 'userID') {
            changedData[key] = editedData[key];
          }
        }

        // 如果没有变化的数据，不进行API调用
        if (Object.keys(changedData).length === 0) {
          msg.info({ content: '未检测到数据变更', key: 'saving' });
          return;
        }

        changedData.userID = record.userID; // 保留userID用于API调用
        console.log('update data', changedData);

        const formData = new FormData();
        if (changedData.playerName) {
          formData.append('player_name', changedData.playerName);
        }
        if (changedData.player_role) {
          formData.append('player_role', changedData.playerRole);
        }
        if (changedData.video_uuids) {
          formData.append('video_uuids', changedData.videoUuids);
        }
        if (changedData.player_photo) {
          formData.append('player_photo', changedData.playerPhoto);
        }

        // 修改正在编辑状态
        const pass = await record.onEdit?.(false, true);
        if (pass) {
          currentEditKeyRef.value = '';
          console.log('update data', changedData);
          await fetch(`/api/playerdata/${record.playerId}`, {
            method: 'PUT',
            body: formData,
          });
          msg.success({ content: '保存成功', key: 'saving' });
        }
      } catch (error) {
        msg.error({ content: '保存失败', key: 'saving' });
      }
    } else {
      msg.error({ content: '请填写正确的数据', key: 'saving' });
    }
  }
  function createActions(record: EditRecordRow): ActionItem[] {
    if (!record.editable) {
      return [
        {
          label: '编辑',
          disabled: currentEditKeyRef.value ? currentEditKeyRef.value !== record.key : false,
          onClick: () => handleEdit(record),
        },
      ];
    }
    return [
      { label: '保存', onClick: () => handleSave(record) },
      { label: '取消', onClick: () => record.onEdit?.(false) },
    ];
  }

  function onEditChange({ column, value, record }) {
    console.log(column, value, record);
  }

  function getSelectedRowsPlayerId() {
    const selectedRows = getSelectRows();
    if (!selectedRows || selectedRows.length === 0) {
      console.log('No rows selected');
      return 0;
    } else if (selectedRows.length > 1) {
      console.log('Multiple rows selected');
      return -1;
    }
    console.log('Selected Rows:', selectedRows);
    return selectedRows[0].playerId;
  }

  defineExpose({ getSelectedRowsPlayerId });
</script>

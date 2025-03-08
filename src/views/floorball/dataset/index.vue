<template>
  <div class="p-4">
    <BasicTable @register="registerTable" @edit-change="onEditChange" :role="'user'">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="createActions(record)" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
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
  import { defHttp } from '@/utils/http/axios'; // Assuming defHttp is your HTTP utility for making requests
  import { useMessage } from '@/hooks/web/useMessage';

  const columns: BasicColumn[] = [
    {
      title: '运动员ID',
      dataIndex: 'playerID',
      width: 60,
      sorter: true,
    },
    {
      title: '运动员名',
      dataIndex: 'playername',
      width: 150,
      editRow: true,
      sorter: true,
    },
    {
      title: '参与比赛数量',
      dataIndex: 'contests',
      width: 100,
      sorter: true,
    },
  ];

  type PlayerData = {
    playerId: number;
    playerName: string;
    playerPhoto: string;
    playerRole: string;
    videoUuids: string[];
  };

  const getPlayerList = async (): Promise<any[]> => {
    try {
      const response = await fetch('/api/playerdata', { method: 'GET' });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: PlayerData[] = await response.json();

      const result = data.map((player) => ({
        playerID: player.playerId, // Ensure this matches the column dataIndex
        playername: player.playerName, // Ensure this matches the column dataIndex
        contests: player.videoUuids.length, // Or any other property you want to display
      }));

      return result;
    } catch (error) {
      console.error('Error fetching player data:', error);
      return [];
    }
  };

  const data = ref<any[]>([]);

  // Fetch the player list when the component is mounted
  onMounted(async () => {
    const fetchedData = await getPlayerList();
    data.value = fetchedData;

    // Set the table data after fetching
    methods.setTableData(data.value);
  });

  const { createMessage: msg } = useMessage();
  const currentEditKeyRef = ref('');

  const [registerTable, methods] = useTable({
    title: '队伍管理',
    titleHelpMessage: ['队伍管理'],
    columns: columns,
    showIndexColumn: false,
    showTableSetting: true,
    tableSetting: { fullScreen: true },
    actionColumn: {
      width: 80,
      title: '操作',
      dataIndex: 'action',
    },
    rowSelection: {
      type: 'checkbox',
    },
    showSelectionBar: true,
    useSearchForm: true,
    formConfig: getFormConfig(), // Assuming getFormConfig() is defined elsewhere
  });
  function getFormConfig(): Partial<FormProps> {
    return {
      labelWidth: 100,
      schemas: [
        {
          field: `playerID`,
          label: `运动员ID`,
          component: 'Input',
          colProps: {
            xl: 12,
            xxl: 8,
          },
        },
        {
          field: `playerName`,
          label: `运动员名`,
          component: 'Input',
          colProps: {
            xl: 12,
            xxl: 8,
          },
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

  function handleCancel(record: EditRecordRow) {
    currentEditKeyRef.value = '';
    record.onEdit?.(false, false);
  }

  const Updateplayer = async (changedData: any) => {
    const playerId = changedData.playerId; // Assuming the changedData contains the playerId
    delete changedData.playerId; // Remove playerId from changedData if not needed
    // Construct the API URL using the playerId
    const url = `/api/playerdata/${playerId}`;

    try {
      // Send the PUT or PATCH request to update the player data
      // const response = await defHttp.put(url, changedData);
      const response = await fetch(`/api/playerdata/update/${playerId}`, { method: 'PUT' });
      // Check if the response is successful
      if (response && response.status === 200) {
        msg.success({ content: '数据已保存', key: 'saving' }); // Show success message
      } else {
        console.error('Error updating data:', response);
        msg.error({ content: '保存数据失败', key: 'saving' }); // Show error message
      }
    } catch (error) {
      console.error('Error during update request:', error);
      msg.error({ content: '保存数据失败', key: 'saving' }); // Show error message
    }
  };

  async function handleSave(record: EditRecordRow) {
    msg.loading({ content: '正在保存...', duration: 0, key: 'saving' });
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

        changedData.playerId = originalData.playerID; // 保留userID用于API调用
        changedData.player_name = record.playername; // 保留userID用于API调用
        // 删除原来的playername字段
        delete changedData.playername;

        // 修改正在编辑状态
        const pass = await record.onEdit?.(false, true);
        if (pass) {
          currentEditKeyRef.value = '';

          await Updateplayer(changedData).then((res) => {
            msg.success({ content: '数据已保存', key: 'saving' });
          });
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
          onClick: handleEdit.bind(null, record),
        },
      ];
    }
    return [
      {
        label: '保存',
        onClick: handleSave.bind(null, record),
      },
      {
        label: '取消',
        popConfirm: {
          title: '是否取消编辑',
          confirm: handleCancel.bind(null, record),
        },
      },
    ];
  }

  function onEditChange({ column, value, record }) {
    // 处理编辑更改逻辑
    console.log(column, value, record);
  }
</script>

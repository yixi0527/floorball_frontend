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
  import { ref, onMounted, h } from 'vue';
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
  import { useMessage } from '@/hooks/web/useMessage';
  import { cardList } from './data';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';

  const columns: BasicColumn[] = [
    {
      title: 'ID',
      dataIndex: 'playerId',
      width: 60,
      sorter: true,
    },
    {
      title: '赛场照片',
      dataIndex: 'playerPhoto',
      width: 80,
      sorter: false,
      customRender: ({ record }) => {
        const imageUrl =
          record.playerPhoto && record.playerPhoto.trim() ? record.playerPhoto : defaultImage;
        return h('img', {
          src: imageUrl,
          alt: 'Player Photo',
          style: 'width: 50px; height: 50px; border-radius: 5px; object-fit: cover;',
        });
      },
    },
    {
      title: '名称',
      dataIndex: 'playerName',
      width: 150,
      editRow: true,
      sorter: true,
    },
    {
      title: '角色',
      dataIndex: 'playerRole',
      width: 150,
      editRow: true,
      sorter: true,
    },
    {
      title: '参与比赛次数',
      dataIndex: 'contests',
      width: 100,
      sorter: true,
    },
  ];

  const data = ref<any[]>([]);

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
    formConfig: getFormConfig(),
  });

  // 组件挂载时获取数据
  onMounted(async () => {
    data.value = cardList;
    methods.setTableData(data.value);
  });

  function getFormConfig(): Partial<FormProps> {
    return {
      labelWidth: 100,
      schemas: [
        {
          field: `playerId`,
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
      record.originalData = cloneDeep(record);
    }
    record.onEdit?.(true);
  }

  function handleCancel(record: EditRecordRow) {
    currentEditKeyRef.value = '';
    record.onEdit?.(false, false);
  }

  async function updatePlayer(changedData: any) {
    const playerId = changedData.playerId;
    const url = `/api/playerdata/update/${playerId}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changedData),
      });

      if (response.ok) {
        msg.success({ content: '数据已保存', key: 'saving' });
      } else {
        console.error('Error updating data:', response);
        msg.error({ content: '保存数据失败', key: 'saving' });
      }
    } catch (error) {
      console.error('Error during update request:', error);
      msg.error({ content: '保存数据失败', key: 'saving' });
    }
  }

  async function handleSave(record: EditRecordRow) {
    msg.loading({ content: '正在保存...', duration: 0, key: 'saving' });

    const valid = await record.onValid?.();
    if (valid) {
      try {
        const originalData = record.originalData;
        const editedData = cloneDeep(record.editValueRefs?.value || {});

        // 过滤出发生变化的字段
        const changedData: Partial<typeof editedData> = {};
        for (const key in editedData) {
          if (editedData[key] !== originalData[key] && key !== 'playerId') {
            changedData[key] = editedData[key];
          }
        }

        if (Object.keys(changedData).length === 0) {
          msg.info({ content: '未检测到数据变更', key: 'saving' });
          return;
        }

        changedData.playerId = originalData.playerId; // 确保包含playerId
        delete changedData.playerName; // 避免多余数据

        const pass = await record.onEdit?.(false, true);
        if (pass) {
          currentEditKeyRef.value = '';
          await updatePlayer(changedData);
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
      {
        label: '保存',
        onClick: () => handleSave(record),
      },
      {
        label: '取消',
      },
    ];
  }

  function onEditChange({ column, value, record }) {
    console.log(column, value, record);
  }
</script>

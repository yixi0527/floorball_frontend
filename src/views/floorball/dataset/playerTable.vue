<template>
  <div>
    <BasicTable @register="registerTable" @edit-change="onEditChange" :showSelectionBar="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="createActions(record)" />
        </template>
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
  import { useMessage } from '@/hooks/web/useMessage';
  import { cardList } from './data';
  import defaultImage from '@/assets/images/defaultPlayerPhoto.jpg';

  const props = defineProps<{ columns?: BasicColumn[] }>();

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
  const { createMessage: msg } = useMessage();
  const currentEditKeyRef = ref('');

  const [registerTable, methods] = useTable({
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

  onMounted(async () => {
    data.value = cardList;
    methods.setTableData(data.value);
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

        changedData.userID = record.userID; // 保留userID用于API调用

        // 修改正在编辑状态
        const pass = await record.onEdit?.(false, true);
        if (pass) {
          currentEditKeyRef.value = '';
          console.log('update data', changedData);
          // 提交服务器保存
          await AdminUpdateUserInfoApi(changedData).then((res) => {
            console.log(res);
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
          onClick: () => handleEdit(record),
        },
      ];
    }
    return [{ label: '保存', onClick: () => handleSave(record) }, { label: '取消' }];
  }

  function onEditChange({ column, value, record }) {
    console.log(column, value, record);
  }

  function getSelectedRowsPlayerId() {
    const selectedRows = methods.getSelectRows();
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

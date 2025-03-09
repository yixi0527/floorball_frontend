<template>
  <div>
    <BasicTable @register="registerTable" @edit-change="handleEditChange" :showSelectionBar="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="getTableActions(record)" />
        </template>
      </template>

      <template #toolbar>
        <a-button type="warning" @click="handleDeleteTasks">删除选中数据</a-button>
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
  import { useMessage } from '@/hooks/web/useMessage';
  import { message as antdMessage } from 'ant-design-vue';

  // 类型声明
  type TaskRecord = EditRecordRow & {
    taskId: string;
    contestName: string;
    status: string;
  };

  // 属性定义
  const props = defineProps<{
    columns?: BasicColumn[];
  }>();

  // 依赖注入
  const { createMessage } = useMessage();

  // 表格状态
  const tasksData = ref<TaskRecord[]>([]);
  const currentEditingKey = ref<string>('');

  // 列配置
  const getTableColumns = computed(() => props.columns || createDefaultColumns());

  // 生命周期
  onMounted(initializeTableData);

  // 暴露方法
  defineExpose({ getSelectedTaskId });

  /* ---------- 工具函数 ---------- */
  function createDefaultColumns(): BasicColumn[] {
    return [
      { title: '比赛名称', dataIndex: 'contestName', width: 200, editRow: true, sorter: true },
    ];
  }

  function createTableConfig() {
    return {
      title: '任务管理',
      titleHelpMessage: ['任务管理'],
      columns: getTableColumns.value,
      showIndexColumn: false,
      showTableSetting: true,
      tableSetting: { fullScreen: true },
      actionColumn: { width: 150, title: '操作', dataIndex: 'action' },
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
    await reloadTaskData();
  }

  async function reloadTaskData() {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      const remoteData = await response.json();
      setTableData(formatTaskData(remoteData));
    } finally {
      setLoading(false);
    }
  }

  function formatTaskData(rawData: any[]): TaskRecord[] {
    return rawData
      .filter((task) => task.status === 'completed')
      .map((task) => ({
        taskId: task.taskId,
        contestName: task.contestName,
        status: task.status,
      }));
  }

  /* ---------- 事件处理 ---------- */
  async function handleDeleteTasks() {
    const selectedTasks = getSelectRows();
    if (!selectedTasks.length) {
      antdMessage.info('请先选择要删除的行');
      return;
    }

    try {
      await Promise.all(selectedTasks.map(deleteTask));
      tasksData.value = tasksData.value.filter((t) => !selectedTasks.includes(t));
      clearSelectedRowKeys();
      await reloadTaskData();
      antdMessage.success(`成功删除 ${selectedTasks.length} 条数据`);
    } catch (error) {
      createMessage.error('删除操作失败');
    }
  }

  async function deleteTask(task: TaskRecord) {
    try {
      const response = await fetch(`/api/task/${task.taskId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      antdMessage.success(`删除成功: ${task.contestName}`);
    } catch (error) {
      console.error('删除失败:', error);
      antdMessage.error(`删除失败: ${task.contestName}`);
    }
  }

  /* ---------- 表格行操作 ---------- */
  function getTableActions(record: TaskRecord): ActionItem[] {
    return record.editable
      ? [
          { label: '保存', onClick: () => handleSaveTask(record) },
          { label: '取消', onClick: () => record.onEdit?.(false) },
        ]
      : [
          {
            label: '编辑',
            disabled: !!currentEditingKey.value && currentEditingKey.value !== record.key,
            onClick: () => startEditing(record),
          },
          {
            label: '下载',
            onClick: () => handleDownload(record),
          },
        ];
  }

  function startEditing(record: TaskRecord) {
    currentEditingKey.value = record.key;
    if (!record.originalData) {
      record.originalData = cloneDeep(record);
    }
    record.onEdit?.(true);
  }

  async function handleSaveTask(record: TaskRecord) {
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

      await submitTaskChanges(record.taskId, changes);
      record.onEdit?.(false, true);
      currentEditingKey.value = '';
      antdMessage.success('保存成功');
    } catch (error) {
      antdMessage.error('保存失败');
    }
  }

  async function handleDownload(record: TaskRecord) {
    try {
      console.log('Download:', record.taskId);
      const response = await fetch(`/api/download/pdf/${record.taskId}`);
      if (!response.ok) throw new Error('下载失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.taskId}_files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      createMessage.error('文件下载失败');
    }
  }

  function getChangedFields(record: TaskRecord): Record<string, any> {
    const changes: Record<string, any> = {};
    for (const key in record.editValueRefs) {
      if (record.editValueRefs[key] !== record.originalData[key] && key !== 'taskId') {
        changes[key] = record.editValueRefs[key];
      }
    }
    return changes;
  }

  async function submitTaskChanges(taskId: string, changes: Record<string, any>) {
    const formData = new FormData();
    Object.entries(changes).forEach(([key, value]) => {
      formData.append(key, value);
    });

    await fetch(`/api/task/${taskId}`, {
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
          field: 'contestName',
          label: '比赛名称',
          component: 'Input',
          colProps: { xl: 12, xxl: 8 },
        },
      ],
    };
  }

  function getSelectedTaskId(): number {
    const selected = getSelectRows();
    if (selected.length === 0) return 0;
    if (selected.length > 1) return -1;
    return selected[0].taskId;
  }

  function handleEditChange({ column, value, record }) {
    console.log('Edit changed:', column, value, record);
  }

  onMounted(() => {
    console.log('TaskTable mounted');
  });
</script>

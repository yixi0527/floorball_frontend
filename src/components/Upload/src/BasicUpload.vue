<template>
  <div>
    <Space>
      <!-- 上传按钮 -->
      <a-button
        type="primary"
        @click="openUploadModal"
        preIcon="carbon:cloud-upload"
        :disabled="disabled"
        :style="buttonStyle"
      >
        {{ buttonText }}
      </a-button>
      <!-- 预览按钮 -->
      <Tooltip placement="bottom" v-if="showPreview">
        <template #title>
          {{ t('component.upload.uploaded') }}
          <template v-if="fileList.length">
            {{ fileList.length }}
          </template>
        </template>
        <a-button @click="openPreviewModal">
          <Icon icon="bi:eye" />
          <template v-if="fileList.length && showPreviewNumber">
            {{ fileList.length }}
          </template>
        </a-button>
      </Tooltip>
    </Space>
    <!-- 上传Modal -->
    <UploadModal
      v-bind="bindValue"
      :previewFileList="fileList"
      :fileListOpenDrag="fileListOpenDrag"
      :fileListDragOptions="fileListDragOptions"
      @register="registerUploadModal"
      @change="handleChange"
      @delete="handleDelete"
      @task-id="handleTaskId"
      @border-width="handleBorderWidth"
    />
    <!-- 预览Modal -->
    <UploadPreviewModal
      :value="fileList"
      :max-number="bindValue.maxNumber"
      @register="registerPreviewModal"
      @list-change="handlePreviewChange"
      @delete="handlePreviewDelete"
      :preview-columns="props.previewColumns"
      :before-preview-data="props.beforePreviewData"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, unref, computed, useAttrs } from 'vue';
  import { Recordable } from '@vben/types';
  import Icon from '@/components/Icon/Icon.vue';
  import { Tooltip, Space } from 'ant-design-vue';
  import { useModal } from '@/components/Modal';
  import { uploadContainerProps } from './props';
  import { omit } from 'lodash-es';
  import { useI18n } from '@/hooks/web/useI18n';
  import { isArray, isObject, isString } from '@/utils/is';
  import UploadModal from './components/UploadModal.vue';
  import UploadPreviewModal from './components/UploadPreviewModal.vue';
  import { BaseFileItem } from './types/typing';
  import { buildUUID } from '@/utils/uuid';

  defineOptions({ name: 'BasicUpload' });

  const isUploaded = ref(false);
  const buttonText = computed(() => (isUploaded.value ? '已上传' : '上传'));
  const buttonStyle = computed(() =>
    isUploaded.value ? { color: 'green', borderColor: 'green' } : {},
  );

  const props = defineProps(uploadContainerProps);
  const emit = defineEmits([
    'change',
    'delete',
    'preview-delete',
    'update:value',
    'taskId',
    'borderWidth',
  ]);

  const attrs = useAttrs();
  const { t } = useI18n();
  // 上传modal注册和打开方法
  const [registerUploadModal, { openModal: openUploadModal }] = useModal();
  // 预览modal注册和打开方法
  const [registerPreviewModal, { openModal: openPreviewModal }] = useModal();

  const handleTaskId = (taskId: string) => {
    isUploaded.value = true;
    emit('taskId', taskId);
  };

  const handleBorderWidth = (borderWidth: number) => {
    emit('borderWidth', borderWidth);
  };

  const fileList = ref<BaseFileItem[]>([]);

  // 控制预览按钮显示
  const showPreview = computed(() => {
    const { emptyHidePreview } = props;
    return emptyHidePreview ? fileList.value.length > 0 : true;
  });

  const bindValue = computed(() => {
    const value = { ...attrs, ...props };
    return omit(value, 'onChange');
  });

  const isFirstRender = ref(true);

  // 提取文件的指定字段（默认为url）
  function getValue(valueKey = 'url') {
    return (fileList.value || []).map((item: any) => item[valueKey]);
  }

  // 根据URL列表生成文件列表
  function genFileListByUrls(urls: string[]) {
    return urls.map((e) => ({
      uid: buildUUID(),
      url: e,
    }));
  }

  // 监听外部传入的value并更新fileList
  watch(
    () => props.value,
    (v = []) => {
      let values: string[] = [];
      if (v) {
        if (isArray(v)) {
          values = v;
        } else if (typeof v == 'string') {
          values.push(v);
        }

        fileList.value = values
          .map((item) => {
            // Check if the item is a string and convert it to the expected object shape
            if (isString(item)) {
              return {
                uid: buildUUID(),
                url: item,
              };
            }

            // Ensure that the item is of the correct shape or return undefined
            else if (isObject(item) && 'url' in item && 'uid' in item) {
              return item as { uid: string | number; url: string };
            } else {
              return undefined; // In case the item is neither a string nor the expected object
            }
          })
          .filter((item): item is { uid: string | number; url: string } => item !== undefined); // Filter out undefined values
      }

      emit('update:value', values);
      if (!isFirstRender.value) {
        emit('change', values);
        isFirstRender.value = false;
      }
    },
    {
      immediate: true,
      deep: true,
    },
  );

  // 上传Modal的文件变化处理
  function handleChange(urls: string[], valueKey: string) {
    fileList.value = [...unref(fileList), ...(genFileListByUrls(urls) || [])];
    const values = getValue(valueKey);
    emit('update:value', values);
    emit('change', values);
  }

  // 预览Modal的文件变化处理
  function handlePreviewChange(fileItems: string[], valueKey: string) {
    fileList.value = [...(fileItems || [])];
    const values = getValue(valueKey);
    emit('update:value', values);
    emit('change', values);
  }

  // 删除文件的处理
  function handleDelete(record: Recordable<any>) {
    emit('delete', record);
  }

  // 删除预览文件的处理
  function handlePreviewDelete(url: string) {
    emit('preview-delete', url);
  }
</script>

<template>
  <div class="w-150 m-auto">
    <Result status="success" title="分析完成！" sub-title="预计三分钟内生成分析报告">
      <template #extra>
        <a-button type="primary" @click="emit('redo')"> 分析下一场比赛 </a-button>
        <a-button @click="handleclick"> 下载分析报告 </a-button>
      </template>
    </Result>
  </div>
</template>

<script lang="ts" setup>
  import { Result } from 'ant-design-vue';
  import { defineProps, defineEmits } from 'vue';

  const props = defineProps({
    taskId: {
      type: String,
      default: '',
    },
  });

  const emit = defineEmits(['redo']);
</script>

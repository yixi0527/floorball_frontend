<template>
  <div class="image-container" :style="{ position: 'relative', display: 'inline-block' }">
    <img ref="image" :src="info.imageUrl" alt="Image" @load="onImageLoad" class="image" />
    <div
      v-if="!completed"
      class="mask"
      :style="{
        top: maskPosition.top + 'px',
        left: maskPosition.left + 'px',
        width: maskPosition.width + 'px',
        height: maskPosition.height + 'px',
      }"
    ></div>
  </div>
</template>

<script setup>
  import { defineProps, ref, reactive } from 'vue';

  // 组件的 props 定义
  const props = defineProps({
    info: {
      type: Object,
      required: true,
    },
    borderWidth: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  });

  const maskPosition = reactive({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const imageWidth = ref(null);
  const imageHeight = ref(null);
  const imageOriginalWidth = ref(null);
  const imageOriginalHeight = ref(null);
  const onImageLoad = (event) => {
    const img = event.target;
    imageWidth.value = img.width;
    imageHeight.value = img.height;
    imageOriginalWidth.value = img.naturalWidth;
    imageOriginalHeight.value = img.naturalHeight;
    updateMaskPosition();
  };

  const updateMaskPosition = () => {
    const scaleX = imageWidth.value / imageOriginalWidth.value;
    const scaleY = imageHeight.value / imageOriginalHeight.value;
    maskPosition.top = (props.info.tlwh[1] - props.borderWidth) * scaleY;
    maskPosition.left = (props.info.tlwh[0] - props.borderWidth) * scaleX;
    maskPosition.width = props.info.tlwh[2] * scaleX;
    maskPosition.height = props.info.tlwh[3] * scaleY;
  };

  defineExpose({
    updateMaskPosition,
  });
</script>

<style scoped>
  .image-container {
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    overflow: hidden; /* 防止图片溢出 */
  }

  .image {
    width: auto; /* 自动调整宽度，保持纵横比 */
    height: auto; /* 高度自适应 */
    max-height: 50vh; /* 最大高度为屏幕的 1/2 */
    pointer-events: none;
    user-select: none;
    object-fit: contain; /* 保持纵横比 */
  }

  .mask {
    position: absolute;
    background-color: rgb(255 255 0 / 50%); /* 半透明掩膜 */
    pointer-events: none; /* 确保掩膜不会拦截鼠标事件 */
  }
</style>

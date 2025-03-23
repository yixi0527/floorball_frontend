<template>
  <div class="frame-selector">
    <div class="image-container" :style="imageWrapperStyle">
      <img :src="thumbUrl" class="image" @load="onImageLoad" ref="image" />
      <div class="annotation-box" :style="annotationBoxStyle">
        <div
          v-for="(point, index) in points"
          :key="index"
          class="control-point"
          :style="pointStyle(point)"
          @mousedown="startDrag(index, $event)"
        ></div>
      </div>
    </div>
    <div class="control-panel">
      <label>边框宽度 (px): </label>
      <input type="number" v-model.number="borderWidth" min="0" @input="updateWrapperStyle" />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue';

  const emit = defineEmits(['update:borderWidth', 'update:points']);

  const props = defineProps({
    thumbUrl: {
      type: String,
      required: true,
    },
  });
  const image = ref(null);
  const borderWidth = ref(10);
  const imageSize = ref({ width: 0, height: 0 });
  const points = ref([
    { x: 20, y: 20 },
    { x: 80, y: 20 },
    { x: 80, y: 80 },
    { x: 20, y: 80 },
  ]);
  const isDragging = ref(false);
  const dragIndex = ref(-1);
  const offsetX = ref(0);
  const offsetY = ref(0);
  const scale = ref(1);
  const displayedImgRect = ref({ width: 0, height: 0, left: 0, top: 0 });

  const updateScale = (img) => {
    const containerWidth = img.parentElement.clientWidth - 2 * borderWidth.value * scale.value;
    scale.value = containerWidth / imageWidth.value;
    console.log('containerWidth:', containerWidth);
    console.log('imageSize:', imageSize.value.width);
    console.log('scale:', scale.value);
  };

  // 计算属性
  const imageWrapperStyle = computed(() => ({
    position: 'relative',
    padding: `${borderWidth.value * scale.value}px`,
    border: '2px solid #808080', // Border color
    display: 'inline-block',
  }));

  const annotationBoxStyle = computed(() => ({
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    clipPath: `polygon(
    ${points.value[0].x}% ${points.value[0].y}%,
    ${points.value[1].x}% ${points.value[1].y}%,
    ${points.value[2].x}% ${points.value[2].y}%,
    ${points.value[3].x}% ${points.value[3].y}%)`,
    border: '2px solid #2196F3',
  }));

  const pointStyle = (point) => ({
    position: 'absolute',
    left: `${point.x}%`,
    top: `${point.y}%`,
    width: '20px',
    height: '20px',
    backgroundColor: '#2196F3',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
  });

  // 方法
  const imageWidth = ref(null);
  const imageHeight = ref(null);
  const onImageLoad = (event) => {
    const img = event.target;
    imageWidth.value = img.naturalWidth;
    imageHeight.value = img.naturalHeight;
    updateScale(img);
    console.log(`Image width: ${imageWidth.value}, Image height: ${imageHeight.value}`);
  };

  const startDrag = (index, event) => {
    isDragging.value = true;
    dragIndex.value = index;
    const wrapper = document.querySelector('.image-container');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const point = points.value[index];
    offsetX.value = event.clientX - rect.left - (point.x / 100) * rect.width;
    offsetY.value = event.clientY - rect.top - (point.y / 100) * rect.height;
  };

  const handleDrag = (event) => {
    if (!isDragging.value) return;

    const wrapper = document.querySelector('.image-container');
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();

    const x = ((event.clientX - rect.left - offsetX.value) / rect.width) * 100;
    const y = ((event.clientY - rect.top - offsetY.value) / rect.height) * 100;

    points.value[dragIndex.value] = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const stopDrag = () => {
    isDragging.value = false;
    dragIndex.value = -1;
    emit('update:points', getActualCoordinates());
  };

  const updateWrapperStyle = () => {
    emit('update:borderWidth', borderWidth.value);
  };

  // 计算实际坐标
  const getActualCoordinates = () => {
    const wrapper = document.querySelector('.image-container');
    if (!wrapper) return [];
    const rect = wrapper.getBoundingClientRect();
    const scaleX = rect.width / imageSize.value.width;
    const scaleY = rect.height / imageSize.value.height;
    return points.value.map((point) => ({
      x: Math.round((point.x / 100) * (imageWidth.value + 2 * borderWidth.value)),
      y: Math.round((point.y / 100) * (imageHeight.value + 2 * borderWidth.value)),
    }));
  };

  // 监听 props 的变化
  watch(
    () => props.thumbUrl,
    () => {
      points.value = [
        { x: 20, y: 20 },
        { x: 80, y: 20 },
        { x: 80, y: 80 },
        { x: 20, y: 80 },
      ]; // Reset points when thumbUrl changes
    },
  );

  // 生命周期钩子
  onMounted(() => {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  });

  // onBeforeUnmount(() => {
  //   document.removeEventListener('mousemove', handleDrag);
  //   document.removeEventListener('mouseup', stopDrag);
  // });
</script>

<style scoped>
  .frame-selector {
    max-width: 100%;
    margin: 0 auto;
    padding: 20px;
    padding: calc(20px + var(--border-width)); /* Adjusting for borderWidth */
    border-radius: 8px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    font-family: Arial, sans-serif;
  }

  .frame-selector {
    display: inline-block;
    position: relative;
    max-width: 100%;
    padding: 20px;
  }

  .image-container {
    display: flex;
    position: relative;
    justify-content: center;
    width: 100%; /* 容器宽度为100% */
    overflow: hidden; /* 隐藏容器外的多余部分 */
  }

  .image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .annotation-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(255 0 0 / 30%);
  }

  /* 控制点样式 */
  .control-point {
    position: absolute;
    z-index: 10;
    width: 60px;
    height: 60px;
    transform: translate(-50%, -50%);
    border: 2px solid #2196f3;
    border-radius: 50%;
    background: #fff;
    cursor: move;
  }

  .control-panel {
    margin-top: 10px;
  }

  .control-panel label {
    font-size: 16px;
  }

  .control-panel input {
    width: 60px;
    padding: 4px;
  }
</style>

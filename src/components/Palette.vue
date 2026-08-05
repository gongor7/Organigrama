<script setup lang="ts">
import { ref } from 'vue'
import type { NodeType } from '../types/org'
import { NODE_TYPES, NODE_TYPE_META } from '../types/org'

const draggingType = ref<NodeType | null>(null)

function onDragStart(event: DragEvent, type: NodeType) {
  draggingType.value = type
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('application/org-node-type', type)
  event.dataTransfer!.setData('text/plain', NODE_TYPE_META[type].label)
}

function onDragEnd() {
  draggingType.value = null
}
</script>

<template>
  <aside class="palette">
    <div class="palette__header">
      <i class="pi pi-share-alt" />
      <span>Crear nodos</span>
    </div>

    <p class="palette__hint">
      Arrastra un tipo al lienzo para crear un nodo. Suéltalo sobre otro nodo para convertirlo en su hijo.
    </p>

    <div
      v-for="type in NODE_TYPES"
      :key="type"
      class="palette__item"
      :class="{ 'palette__item--dragging': draggingType === type }"
      :draggable="true"
      @dragstart="onDragStart($event, type)"
      @dragend="onDragEnd"
    >
      <div class="palette__icon" :style="{ backgroundColor: NODE_TYPE_META[type].soft, color: NODE_TYPE_META[type].color }">
        <i :class="NODE_TYPE_META[type].icon" />
      </div>
      <div class="palette__info">
        <div class="palette__name">{{ NODE_TYPE_META[type].short }}</div>
        <div class="palette__desc">{{ NODE_TYPE_META[type].label }}</div>
      </div>
      <i class="pi pi-arrows-alt palette__grip" />
    </div>
  </aside>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 210px;
  padding: 14px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.palette__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.palette__hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.palette__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fbfcfe;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.palette__item:hover {
  border-color: #a5b4fc;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.palette__item:active {
  cursor: grabbing;
}

.palette__item--dragging {
  opacity: 0.5;
}

.palette__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  font-size: 15px;
  flex-shrink: 0;
}

.palette__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.palette__name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.palette__desc {
  font-size: 11px;
  color: #64748b;
}

.palette__grip {
  font-size: 12px;
  color: #94a3b8;
}
</style>

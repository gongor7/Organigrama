<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useOrgChartStore } from '../../store/orgChart'
import { NODE_TYPE_META, NODE_WIDTH } from '../../types/org'

const props = defineProps<{
  id: string
  data: { orgId: string }
}>()

const store = useOrgChartStore()

const node = computed(() => store.getNode(props.data.orgId))
const meta = computed(() => NODE_TYPE_META[node.value?.type ?? 'puesto'])
const selected = computed(() => store.selectedId === props.data.orgId)
const isDropTarget = computed(() => store.highlightId === props.data.orgId)
const childrenCount = computed(() => (node.value ? store.childrenOf(node.value.id).length : 0))
const isRoot = computed(() => node.value?.parentId == null)

const cardStyle = computed(() => ({
  width: `${NODE_WIDTH}px`,
  borderLeftColor: meta.value.color,
}))

const typeLabel = computed(() => meta.value.short)
const icon = computed(() => meta.value.icon)
</script>

<template>
  <div
    class="org-node"
    :class="{
      'org-node--selected': selected,
      'org-node--drop-target': isDropTarget,
      'org-node--root': isRoot,
    }"
    :style="cardStyle"
  >
    <Handle type="target" :position="Position.Top" class="org-node__handle org-node__handle--target" />
    <Handle type="source" :position="Position.Bottom" class="org-node__handle org-node__handle--source" />

    <div class="org-node__icon" :style="{ backgroundColor: meta.soft, color: meta.color }">
      <i :class="icon" />
    </div>

    <div class="org-node__body">
      <div class="org-node__label">{{ node?.label || 'Sin nombre' }}</div>
      <div class="org-node__meta">
        <span class="org-node__badge" :style="{ color: meta.color, backgroundColor: meta.soft }">{{ typeLabel }}</span>
        <span v-if="childrenCount > 0" class="org-node__count" :title="`${childrenCount} hijos`">
          <i class="pi pi-sitemap" /> {{ childrenCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.org-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 78px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #94a3b8;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  box-sizing: border-box;
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  cursor: grab;
  font-family: inherit;
}

.org-node:hover {
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14);
}

.org-node:active {
  cursor: grabbing;
}

.org-node--selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25), 0 6px 18px rgba(15, 23, 42, 0.16);
}

.org-node--drop-target {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4), 0 6px 18px rgba(16, 185, 129, 0.18);
  transform: scale(1.02);
}

.org-node__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  font-size: 18px;
}

.org-node__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.org-node__label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.org-node__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.org-node__badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.org-node__count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
}

.org-node__handle {
  width: 9px;
  height: 9px;
  background: #cbd5e1;
  border: 2px solid #ffffff;
  transition: background 0.15s ease, transform 0.15s ease;
}

.org-node:hover .org-node__handle {
  background: #94a3b8;
}

.org-node--selected .org-node__handle {
  background: #6366f1;
}

.org-node__handle--source:hover {
  transform: scale(1.4);
}
</style>

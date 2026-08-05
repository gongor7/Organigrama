<script setup lang="ts">
import { computed } from 'vue'
import type { TreeNode } from 'primevue/treenode'
import { useOrgChartStore } from '../store/orgChart'
import { NODE_TYPE_META } from '../types/org'

const store = useOrgChartStore()

interface RawNode {
  id: string
  type: string
  label: string
  children: RawNode[]
}

function buildTree(parentId: string | null): RawNode[] {
  return store
    .childrenOf(parentId)
    .map((node) => ({ id: node.id, type: node.type, label: node.label, children: buildTree(node.id) }))
}

function toPrimeNode(raw: RawNode): TreeNode {
  return {
    key: raw.id,
    label: raw.label,
    icon: NODE_TYPE_META[raw.type as keyof typeof NODE_TYPE_META].icon,
    children: raw.children.map(toPrimeNode),
  }
}

const treeData = computed<TreeNode[]>(() => buildTree(null).map(toPrimeNode))

function onNodeSelect(node: TreeNode) {
  store.selectNode(node.key as string)
}
</script>

<template>
  <div class="tree-outline">
    <Tree :value="treeData" selection-mode="single" class="tree-outline__tree" @node-select="onNodeSelect" />
  </div>
</template>

<style scoped>
.tree-outline {
  width: 320px;
}

.tree-outline__tree {
  border: none;
  background: transparent;
}
</style>

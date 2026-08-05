<script setup lang="ts">
import { nextTick, onMounted, shallowRef, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Connection, Edge as FlowEdge, Node as FlowNode, NodeDragEvent, NodeMouseEvent } from '@vue-flow/core'
import { useToast } from 'primevue/usetoast'
import OrgNode from './nodes/OrgNode.vue'
import { useOrgChartStore } from '../store/orgChart'
import { computeTreeLayout } from '../layout/treeLayout'
import { computeGraphBounds, exportFlowToPdf, viewportForBounds } from '../utils/exportPdf'
import type { NodeType } from '../types/org'

const store = useOrgChartStore()
const toast = useToast()

const vfNodes = shallowRef<FlowNode[]>([])
const vfEdges = shallowRef<FlowEdge[]>([])

const { screenToFlowCoordinate, fitView, updateNodeInternals, getIntersectingNodes, getViewport, setViewport, vueFlowRef } =
  useVueFlow()

function rebuildGraph() {
  const layout = computeTreeLayout(store.nodes)
  store.applyLayout(layout)

  vfNodes.value = store.nodes.map((n) => ({
    id: n.id,
    type: 'org',
    position: { x: n.position.x, y: n.position.y },
    data: { orgId: n.id },
    draggable: true,
    selectable: true,
  }))

  vfEdges.value = store.nodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: 'default',
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    }))
}

function layoutGraph() {
  rebuildGraph()
  nextTick(() => {
    fitView({ padding: 0.2, duration: 300 })
    updateNodeInternals()
  })
}

watch(
  () => store.structureVersion,
  () => layoutGraph(),
)

onMounted(() => {
  nextTick(() => layoutGraph())
})

function onNodeClick({ node }: NodeMouseEvent) {
  store.selectNode(node.id)
}

function onPaneClick() {
  store.selectNode(null)
}

function onNodeDrag({ node }: NodeDragEvent) {
  const targets = getIntersectingNodes(node).filter(
    (n) => n.id !== node.id && store.canReparent(node.id, n.id) === null,
  )
  store.highlightId = targets.length ? targets[0].id : null
}

function onNodeDragStop({ node }: NodeDragEvent) {
  store.setPosition(node.id, { x: node.computedPosition.x, y: node.computedPosition.y })
  const targets = getIntersectingNodes(node).filter(
    (n) => n.id !== node.id && store.canReparent(node.id, n.id) === null,
  )
  store.highlightId = null
  const target = targets[0]
  if (target) {
    const error = store.reparent(node.id, target.id)
    if (error) {
      toast.add({ severity: 'warn', summary: 'Movimiento no permitido', detail: error, life: 3500 })
    } else {
      const label = store.getNode(target.id)?.label ?? 'otro nodo'
      toast.add({ severity: 'success', summary: 'Movido', detail: `Ahora depende de «${label}».`, life: 2500 })
    }
  }
}

function onConnect(connection: Connection) {
  if (!connection.source || !connection.target || connection.source === connection.target) return
  const error = store.reparent(connection.target, connection.source)
  if (error) {
    toast.add({ severity: 'warn', summary: 'Conexión no permitida', detail: error, life: 3500 })
  } else {
    const label = store.getNode(connection.source)?.label ?? 'otro nodo'
    toast.add({ severity: 'success', summary: 'Conectado', detail: `Ahora depende de «${label}».`, life: 2500 })
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/org-node-type') as NodeType | undefined
  if (!type) return
  event.preventDefault()

  const targetElement = (event.target as HTMLElement).closest('.vue-flow__node')
  const targetId = targetElement?.getAttribute('data-id') ?? null

  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  const created = store.addNode(type, targetId, position)
  if (!created) {
    const parent = targetId ? store.getNode(targetId) : undefined
    const parentType = parent ? `un ${parent.type}` : 'la raíz'
    toast.add({
      severity: 'warn',
      summary: 'No se puede crear aquí',
      detail: `Un «${type}» no puede estar bajo ${parentType}.`,
      life: 3500,
    })
  }
}

function miniMapNodeColor(node: FlowNode) {
  const orgNode = store.getNode(node.id)
  if (!orgNode) return '#94a3b8'
  const colors: Record<string, string> = { direccion: '#10b981', jefatura: '#3b82f6', puesto: '#f59e0b' }
  return colors[orgNode.type] ?? '#94a3b8'
}

async function exportToPdf() {
  if (!store.totalNodes) {
    toast.add({ severity: 'warn', summary: 'Nada que exportar', detail: 'El lienzo está vacío.', life: 2500 })
    return
  }
  const flowEl = vueFlowRef.value
  if (!flowEl) {
    toast.add({ severity: 'error', summary: 'Error al exportar', detail: 'No se encontró el lienzo.', life: 4000 })
    return
  }

  const overlays = Array.from(flowEl.querySelectorAll<HTMLElement>('.vue-flow__minimap, .vue-flow__controls, .vue-flow__panel'))
  const previousDisplay = overlays.map((el) => el.style.display)
  overlays.forEach((el) => (el.style.display = 'none'))

  const bounds = computeGraphBounds(store.nodes)
  const containerWidth = flowEl.clientWidth
  const containerHeight = flowEl.clientHeight
  const previousViewport = getViewport()
  setViewport(viewportForBounds(bounds, containerWidth, containerHeight), { duration: 0 })

  await new Promise<void>((resolve) => setTimeout(resolve, 80))

  try {
    await exportFlowToPdf(flowEl)
    toast.add({ severity: 'success', summary: 'PDF exportado', detail: 'Se descargó el organigrama en PDF.', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error al exportar', detail: 'No se pudo generar el PDF.', life: 4000 })
    console.error(error)
  } finally {
    setViewport(previousViewport, { duration: 0 })
    overlays.forEach((el, index) => (el.style.display = previousDisplay[index]))
  }
}

defineExpose({ layoutGraph, fitView: () => fitView({ padding: 0.2, duration: 300 }), exportToPdf })
</script>

<template>
  <div class="org-canvas">
    <VueFlow
      :nodes="vfNodes"
      :edges="vfEdges"
      :fit-view-on-init="true"
      :min-zoom="0.2"
      :max-zoom="2"
      :zoom-on-scroll="true"
      :zoom-on-double-click="false"
      :delete-key-code="null"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @node-drag="onNodeDrag"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @dragover="onDragOver"
      @drop="onDrop"
      class="org-canvas__flow"
    >
      <template #node-org="nodeProps">
        <OrgNode v-bind="nodeProps" />
      </template>

      <Background variant="dots" :gap="18" :size="1.5" color="#cbd5e1" />
      <Controls position="bottom-left" :show-interactive="false" />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        :node-color="miniMapNodeColor"
        :node-stroke-color="'#e2e8f0'"
        mask-color="rgba(99, 102, 241, 0.08)"
      />
    </VueFlow>
  </div>
</template>

<style scoped>
.org-canvas {
  position: relative;
  width: 100%;
  height: 100%;
}

.org-canvas__flow {
  width: 100%;
  height: 100%;
  background: #f8fafc;
}
</style>

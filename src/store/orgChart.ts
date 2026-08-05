import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { NodeType, OrgNode, Position } from '../types/org'
import { NODE_TYPE_META, ORG_JSON_VERSION } from '../types/org'
import { computeTreeLayout } from '../layout/treeLayout'

interface OrgJSON {
  version: number
  nodes: OrgNode[]
}

function cloneNodes(list: OrgNode[]): OrgNode[] {
  return JSON.parse(JSON.stringify(list))
}

export const useOrgChartStore = defineStore('orgChart', () => {
  const nodes = ref<OrgNode[]>([])
  const selectedId = ref<string | null>(null)
  const highlightId = ref<string | null>(null)
  const structureVersion = ref(0)
  const dataVersion = ref(0)

  const undoStack = ref<OrgNode[][]>([])
  const redoStack = ref<OrgNode[][]>([])
  const MAX_HISTORY = 100

  const undoStackSize = computed(() => undoStack.value.length)
  const redoStackSize = computed(() => redoStack.value.length)

  const nodeMap = computed(() => new Map(nodes.value.map((n) => [n.id, n])))
  const selectedNode = computed(() => (selectedId.value ? nodeMap.value.get(selectedId.value) ?? null : null))
  const totalNodes = computed(() => nodes.value.length)

  function getNode(id: string): OrgNode | undefined {
    return nodeMap.value.get(id)
  }

  function childrenOf(id: string | null): OrgNode[] {
    return nodes.value.filter((n) => n.parentId === id)
  }

  function isDescendant(ancestorId: string, nodeId: string): boolean {
    let current = getNode(nodeId)
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true
      current = getNode(current.parentId)
    }
    return false
  }

  function allowedChildTypes(parent: OrgNode | null | undefined): NodeType[] {
    if (!parent) return ['direccion']
    if (parent.type === 'puesto') return []
    if (parent.type === 'jefatura') return ['jefatura', 'puesto']
    return ['direccion', 'jefatura', 'puesto']
  }

  function canReparent(nodeId: string, newParentId: string | null): string | null {
    const node = getNode(nodeId)
    if (!node) return 'El nodo no existe.'
    if (nodeId === newParentId) return 'Un nodo no puede ser hijo de sí mismo.'
    if (newParentId !== null && !getNode(newParentId)) return 'El nodo padre no existe.'
    if (newParentId !== null && isDescendant(nodeId, newParentId)) {
      return 'No se puede mover un nodo dentro de su propio subárbol (evitar ciclos).'
    }
    const parent = newParentId ? getNode(newParentId) : undefined
    const allowed = allowedChildTypes(parent)
    if (!allowed.includes(node.type)) {
      return parent
        ? `Un ${NODE_TYPE_META[node.type].label.toLowerCase()} no puede estar bajo un ${NODE_TYPE_META[parent.type].label.toLowerCase()}.`
        : 'Solo las Direcciones pueden ser nodos raíz.'
    }
    return null
  }

  function commit() {
    undoStack.value.push(cloneNodes(nodes.value))
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function selectNode(id: string | null) {
    selectedId.value = id
  }

  function updateNode(id: string, patch: Partial<Pick<OrgNode, 'label' | 'description'>>) {
    const node = getNode(id)
    if (!node) return
    if (patch.label !== undefined && patch.label === node.label) patch.label = undefined
    if (patch.description !== undefined && patch.description === node.description) patch.description = undefined
    if (patch.label === undefined && patch.description === undefined) return
    commit()
    if (patch.label !== undefined) node.label = patch.label
    if (patch.description !== undefined) node.description = patch.description
    dataVersion.value++
  }

  function changeType(id: string, type: NodeType) {
    const node = getNode(id)
    if (!node || node.type === type) return
    if (type === 'puesto' && childrenOf(id).length > 0) return
    const parent = node.parentId ? getNode(node.parentId) : undefined
    const allowed = allowedChildTypes(parent)
    if (!allowed.includes(type)) return
    commit()
    node.type = type
    dataVersion.value++
  }

  function addNode(type: NodeType, parentId: string | null, position: Position): string | null {
    const parent = parentId ? getNode(parentId) : undefined
    const allowed = allowedChildTypes(parent)
    if (!allowed.includes(type)) return null
    commit()
    const id = crypto.randomUUID()
    nodes.value.push({ id, type, label: `Nuevo ${NODE_TYPE_META[type].label}`, description: '', parentId, position })
    structureVersion.value++
    return id
  }

  function removeNode(id: string) {
    const node = getNode(id)
    if (!node) return
    commit()
    const toRemove = new Set<string>()
    const collect = (nodeId: string) => {
      toRemove.add(nodeId)
      for (const child of childrenOf(nodeId)) collect(child.id)
    }
    collect(id)
    nodes.value = nodes.value.filter((n) => !toRemove.has(n.id))
    if (selectedId.value && toRemove.has(selectedId.value)) selectedId.value = null
    structureVersion.value++
  }

  function reparent(nodeId: string, newParentId: string | null): string | null {
    const error = canReparent(nodeId, newParentId)
    if (error) return error
    const node = getNode(nodeId)!
    if (node.parentId === newParentId) return null
    commit()
    node.parentId = newParentId
    structureVersion.value++
    return null
  }

  function setPosition(id: string, position: Position) {
    const node = getNode(id)
    if (node) node.position = position
  }

  function applyLayout(positions: Map<string, Position>) {
    for (const node of nodes.value) {
      const pos = positions.get(node.id)
      if (pos) node.position = pos
    }
  }

  function autoLayout() {
    applyLayout(computeTreeLayout(nodes.value))
  }

  function undo() {
    const previous = undoStack.value.pop()
    if (!previous) return
    redoStack.value.push(cloneNodes(nodes.value))
    nodes.value = previous
    if (selectedId.value && !nodeMap.value.has(selectedId.value)) selectedId.value = null
    structureVersion.value++
    dataVersion.value++
  }

  function redo() {
    const next = redoStack.value.pop()
    if (!next) return
    undoStack.value.push(cloneNodes(nodes.value))
    nodes.value = next
    if (selectedId.value && !nodeMap.value.has(selectedId.value)) selectedId.value = null
    structureVersion.value++
    dataVersion.value++
  }

  function reset() {
    if (!nodes.value.length) return
    commit()
    nodes.value = []
    selectedId.value = null
    structureVersion.value++
    dataVersion.value++
  }

  function exportJSON(): string {
    const payload: OrgJSON = { version: ORG_JSON_VERSION, nodes: cloneNodes(nodes.value) }
    return JSON.stringify(payload, null, 2)
  }

  function importJSON(raw: string): string | null {
    let payload: OrgJSON
    try {
      payload = JSON.parse(raw) as OrgJSON
    } catch {
      return 'El archivo no es un JSON válido.'
    }
    if (!payload || payload.version !== ORG_JSON_VERSION || !Array.isArray(payload.nodes)) {
      return 'El archivo no tiene el formato de organigrama esperado.'
    }
    const ids = new Set<string>()
    for (const n of payload.nodes) {
      if (typeof n?.id !== 'string' || !['direccion', 'jefatura', 'puesto'].includes(n.type)) {
        return 'El archivo contiene nodos inválidos.'
      }
      if (ids.has(n.id)) return 'El archivo contiene identificadores duplicados.'
      ids.add(n.id)
    }
    for (const n of payload.nodes) {
      if (n.parentId !== null && !ids.has(n.parentId)) {
        return 'El archivo contiene nodos con padre inexistente.'
      }
      n.label = typeof n.label === 'string' ? n.label : 'Sin nombre'
      n.description = typeof n.description === 'string' ? n.description : ''
      if (!n.position || typeof n.position.x !== 'number') n.position = { x: 0, y: 0 }
    }
    commit()
    nodes.value = cloneNodes(payload.nodes)
    selectedId.value = null
    structureVersion.value++
    dataVersion.value++
    return null
  }

  function loadSample() {
    commit()
    nodes.value = []
    const make = (type: NodeType, label: string, description: string, parentId: string | null): string => {
      const id = crypto.randomUUID()
      nodes.value.push({ id, type, label, description, parentId, position: { x: 0, y: 0 } })
      return id
    }
    const dg = make('direccion', 'Dirección General', 'Máximo órgano de dirección de la institución.', null)
    const da = make('direccion', 'Dirección Administrativa', 'Gestión de recursos humanos y finanzas.', dg)
    const dt = make('direccion', 'Dirección de Tecnología', 'Sistemas, infraestructura y desarrollo.', dg)
    make('jefatura', 'Jefatura de Recursos Humanos', 'Administración del talento institucional.', da)
    const jc = make('jefatura', 'Jefatura de Contabilidad', 'Registro y control financiero.', da)
    make('puesto', 'Contador General', 'Manejo de libros contables.', jc)
    make('puesto', 'Auxiliar Contable', 'Apoyo en conciliaciones.', jc)
    const jd = make('jefatura', 'Jefatura de Desarrollo', 'Construcción de software institucional.', dt)
    make('puesto', 'Desarrollador Frontend', 'Interfaces de usuario.', jd)
    make('puesto', 'Desarrollador Backend', 'Servicios y datos.', jd)
    const ji = make('jefatura', 'Jefatura de Infraestructura', 'Redes, servidores y seguridad.', dt)
    make('puesto', 'Administrador de Redes', 'Mantenimiento de la red.', ji)
    structureVersion.value++
    dataVersion.value++
  }

  return {
    nodes,
    selectedId,
    highlightId,
    structureVersion,
    dataVersion,
    selectedNode,
    totalNodes,
    undoStackSize,
    redoStackSize,
    getNode,
    childrenOf,
    isDescendant,
    allowedChildTypes,
    canReparent,
    selectNode,
    updateNode,
    changeType,
    addNode,
    removeNode,
    reparent,
    setPosition,
    applyLayout,
    autoLayout,
    undo,
    redo,
    reset,
    exportJSON,
    importJSON,
    loadSample,
  }
})

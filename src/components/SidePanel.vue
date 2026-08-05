<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useOrgChartStore } from '../store/orgChart'
import type { NodeType } from '../types/org'
import { NODE_TYPES, NODE_TYPE_META } from '../types/org'

const store = useOrgChartStore()
const toast = useToast()

const confirmDelete = ref(false)
const pendingLabel = ref('')
const pendingDescription = ref('')

const selected = computed(() => store.selectedNode)
const children = computed(() => (selected.value ? store.childrenOf(selected.value.id) : []))
const parent = computed(() => (selected.value?.parentId ? store.getNode(selected.value.parentId) : undefined))
const meta = computed(() => (selected.value ? NODE_TYPE_META[selected.value.type] : undefined))
const allowedChildTypes = computed<NodeType[]>(() => (selected.value ? store.allowedChildTypes(selected.value) : []))
const canChangeTypeTo = computed(() => {
  const node = selected.value
  if (!node) return NODE_TYPES
  const parentNode = node.parentId ? store.getNode(node.parentId) : undefined
  return store.allowedChildTypes(parentNode)
})

function syncFromStore() {
  const node = selected.value
  if (node) {
    pendingLabel.value = node.label
    pendingDescription.value = node.description
    confirmDelete.value = false
  }
}

watch([() => store.selectedId, () => store.dataVersion], syncFromStore, { immediate: true })

function onLabelInput() {
  const node = selected.value
  if (!node) return
  store.updateNode(node.id, { label: pendingLabel.value })
}

function onDescriptionInput() {
  const node = selected.value
  if (!node) return
  store.updateNode(node.id, { description: pendingDescription.value })
}

function onTypeChange(type: NodeType) {
  const node = selected.value
  if (!node) return
  if (!canChangeTypeTo.value.includes(type)) {
    toast.add({ severity: 'warn', summary: 'Tipo no permitido', detail: 'Este nodo no puede ser de ese tipo en su posición actual.', life: 3500 })
    return
  }
  store.changeType(node.id, type)
}

function addChild(type: NodeType) {
  const node = selected.value
  if (!node) return
  const id = store.addNode(type, node.id, { x: 0, y: 0 })
  if (id) {
    toast.add({ severity: 'success', summary: 'Nodo creado', detail: `Se añadió un «${NODE_TYPE_META[type].short}» bajo «${node.label}».`, life: 2500 })
  }
}

function remove() {
  const node = selected.value
  if (!node) return
  const count = store.childrenOf(node.id).length
  store.removeNode(node.id)
  toast.add({
    severity: count > 0 ? 'warn' : 'info',
    summary: 'Nodo eliminado',
    detail: count > 0 ? `Se eliminó «${node.label}» y sus ${count} subniveles.` : `Se eliminó «${node.label}».`,
    life: 3000,
  })
  confirmDelete.value = false
}

function makeRoot() {
  const node = selected.value
  if (!node) return
  const error = store.reparent(node.id, null)
  if (error) toast.add({ severity: 'warn', summary: 'No permitido', detail: error, life: 3500 })
}
</script>

<template>
  <aside class="side-panel">
    <template v-if="selected && meta">
      <div class="side-panel__header">
        <div class="side-panel__icon" :style="{ backgroundColor: meta.soft, color: meta.color }">
          <i :class="meta.icon" />
        </div>
        <div class="side-panel__title">
          <div class="side-panel__subtitle">Nodo seleccionado</div>
          <div class="side-panel__badge" :style="{ color: meta.color, backgroundColor: meta.soft }">{{ meta.short }}</div>
        </div>
        <div v-if="!confirmDelete" class="side-panel__actions">
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            tooltip="Eliminar nodo"
            tooltipOptions="{ position: 'left' }"
            @click="confirmDelete = true"
          />
        </div>
        <div v-else class="side-panel__actions side-panel__actions--confirm">
          <span class="side-panel__confirm-label">¿Eliminar?</span>
          <Button label="Sí" severity="danger" size="small" @click="remove" />
          <Button label="No" text size="small" @click="confirmDelete = false" />
        </div>
      </div>

      <div class="side-panel__section">
        <label class="side-panel__label" for="node-label">Nombre del nodo</label>
        <InputText id="node-label" v-model="pendingLabel" class="side-panel__input" @input="onLabelInput" />
      </div>

      <div class="side-panel__section">
        <label class="side-panel__label" for="node-desc">Descripción</label>
        <Textarea id="node-desc" v-model="pendingDescription" rows="3" class="side-panel__input" autoResize @input="onDescriptionInput" />
      </div>

      <div class="side-panel__section">
        <span class="side-panel__label">Tipo de nodo</span>
        <div class="side-panel__types">
          <Button
            v-for="type in NODE_TYPES"
            :key="type"
            :label="NODE_TYPE_META[type].short"
            size="small"
            :severity="selected.type === type ? 'primary' : 'secondary'"
            :outlined="selected.type !== type"
            :disabled="!canChangeTypeTo.includes(type)"
            @click="onTypeChange(type)"
          />
        </div>
      </div>

      <div class="side-panel__section">
        <span class="side-panel__label">Añadir hijo</span>
        <div v-if="allowedChildTypes.length" class="side-panel__types">
          <Button
            v-for="type in allowedChildTypes"
            :key="type"
            :label="`+ ${NODE_TYPE_META[type].short}`"
            size="small"
            :style="{ backgroundColor: NODE_TYPE_META[type].color, borderColor: NODE_TYPE_META[type].color }"
            @click="addChild(type)"
          />
        </div>
        <div v-else class="side-panel__empty">Los puestos de trabajo son nodos hoja, no pueden tener hijos.</div>
      </div>

      <div class="side-panel__section">
        <span class="side-panel__label">Jerarquía</span>
        <div class="side-panel__hierarchy">
          <div v-if="parent" class="side-panel__parent" @click="store.selectNode(parent.id)">
            <i class="pi pi-arrow-up" />
            <span>Padre: <strong>{{ parent.label }}</strong></span>
          </div>
          <Button
            v-if="selected.parentId && selected.type === 'direccion'"
            label="Hacer raíz"
            icon="pi pi-level-up"
            size="small"
            text
            outlined
            class="side-panel__root-btn"
            @click="makeRoot"
          />
          <div class="side-panel__children">
            <div v-if="children.length" v-for="child in children" :key="child.id" class="side-panel__child" @click="store.selectNode(child.id)">
              <i :class="NODE_TYPE_META[child.type].icon" :style="{ color: NODE_TYPE_META[child.type].color }" />
              <span>{{ child.label }}</span>
            </div>
            <div v-else class="side-panel__empty">Sin hijos.</div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="side-panel__placeholder">
        <i class="pi pi-objects-column" />
        <h3>Selecciona un nodo</h3>
        <p>
          Haz clic en un nodo del lienzo para ver y editar sus datos, añadir hijos o eliminarlo. También puedes arrastrar
          un tipo desde la paleta para crear nuevos nodos.
        </p>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
  max-width: 340px;
  padding: 16px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
}

.side-panel__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.side-panel__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  font-size: 20px;
  flex-shrink: 0;
}

.side-panel__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.side-panel__subtitle {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.side-panel__badge {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
}

.side-panel__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.side-panel__actions--confirm {
  gap: 8px;
}

.side-panel__confirm-label {
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
}

.side-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-panel__label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.side-panel__input {
  width: 100%;
}

.side-panel__types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.side-panel__hierarchy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-panel__parent {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  padding: 8px 10px;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.side-panel__parent:hover {
  background: #e2e8f0;
}

.side-panel__root-btn {
  align-self: flex-start;
}

.side-panel__children {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.side-panel__child {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.side-panel__child:hover {
  background: #f1f5f9;
}

.side-panel__empty {
  font-size: 12px;
  color: #94a3b8;
  padding: 6px 0;
}

.side-panel__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 40px 12px;
  color: #64748b;
}

.side-panel__placeholder i {
  font-size: 40px;
  color: #cbd5e1;
}

.side-panel__placeholder h3 {
  margin: 0;
  font-size: 16px;
  color: #334155;
}

.side-panel__placeholder p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}
</style>

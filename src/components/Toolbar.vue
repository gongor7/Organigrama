<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useOrgChartStore } from '../store/orgChart'

const emit = defineEmits<{
  layout: []
  fit: []
  toggleTree: []
  pdf: []
}>()

const store = useOrgChartStore()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)

const canUndo = computed(() => store.undoStackSize > 0)
const canRedo = computed(() => store.redoStackSize > 0)

function onExport() {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `organigrama-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  toast.add({ severity: 'info', summary: 'Exportado', detail: 'El organigrama se descargó como JSON.', life: 2500 })
}

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const error = store.importJSON(String(reader.result ?? ''))
    if (error) {
      toast.add({ severity: 'error', summary: 'Importación fallida', detail: error, life: 4000 })
    } else {
      toast.add({ severity: 'success', summary: 'Importado', detail: 'El organigrama se cargó correctamente.', life: 2500 })
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function onClear() {
  store.reset()
  toast.add({ severity: 'info', summary: 'Lienzo limpio', detail: 'Todos los nodos se eliminaron. Puedes deshacer.', life: 2500 })
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__group">
      <Button icon="pi pi-sitemap" label="Reordenar" size="small" text outlined tooltip="Orden automático del árbol" @click="emit('layout')" />
      <Button icon="pi pi-eye" label="Ajustar" size="small" text outlined tooltip="Encajar el organigrama en la vista" @click="emit('fit')" />
      <Button icon="pi pi-list" label="Árbol" size="small" text outlined tooltip="Ver la estructura como árbol" @click="emit('toggleTree')" />
    </div>

    <div class="toolbar__group">
      <Button icon="pi pi-undo" severity="secondary" text rounded size="small" :disabled="!canUndo" tooltip="Deshacer" @click="store.undo()" />
      <Button icon="pi pi-refresh" severity="secondary" text rounded size="small" :disabled="!canRedo" tooltip="Rehacer" @click="store.redo()" />
    </div>

    <div class="toolbar__group toolbar__group--grow">
      <span class="toolbar__count">
        <i class="pi pi-share-alt" /> {{ store.totalNodes }} nodo{{ store.totalNodes === 1 ? '' : 's' }}
      </span>
    </div>

    <div class="toolbar__group">
      <Button icon="pi pi-book" label="Ejemplo" size="small" severity="secondary" text outlined tooltip="Cargar un organigrama de ejemplo" @click="store.loadSample()" />
      <Button icon="pi pi-file-import" label="Importar" size="small" severity="secondary" text outlined tooltip="Importar organigrama desde JSON" @click="fileInput?.click()" />
      <Button icon="pi pi-file-export" label="Exportar" size="small" severity="secondary" text outlined tooltip="Descargar organigrama como JSON" @click="onExport" />
      <Button icon="pi pi-file-pdf" label="PDF" severity="danger" size="small" text outlined tooltip="Descargar el organigrama como PDF" @click="emit('pdf')" />
      <Button icon="pi pi-eraser" severity="danger" size="small" text outlined tooltip="Vaciar el lienzo" @click="onClear" />
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" class="toolbar__file" @change="onImportFile" />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar__group--grow {
  flex: 1;
}

.toolbar__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 999px;
}

.toolbar__file {
  display: none;
}
</style>

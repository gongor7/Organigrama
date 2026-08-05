<script setup lang="ts">
import { ref } from 'vue'
import Toolbar from './components/Toolbar.vue'
import Palette from './components/Palette.vue'
import OrgCanvas from './components/OrgCanvas.vue'
import SidePanel from './components/SidePanel.vue'
import TreeOutline from './components/TreeOutline.vue'

const canvasRef = ref<InstanceType<typeof OrgCanvas> | null>(null)
const treeVisible = ref(false)
</script>

<template>
  <div class="app">
    <header class="app__header">
      <div class="app__brand">
        <div class="app__logo">
          <i class="pi pi-building" />
        </div>
        <div class="app__titles">
          <h1 class="app__title">Organigrama Institucional</h1>
          <span class="app__subtitle">Constructor visual de direcciones, jefaturas y puestos de trabajo</span>
        </div>
      </div>
    </header>

    <Toolbar
      @layout="canvasRef?.layoutGraph()"
      @fit="canvasRef?.fitView()"
      @toggle-tree="treeVisible = !treeVisible"
      @pdf="canvasRef?.exportToPdf()"
    />

    <main class="app__main">
      <Palette />
      <section class="app__canvas">
        <OrgCanvas ref="canvasRef" />
      </section>
      <SidePanel />
    </main>

    <Drawer v-model:visible="treeVisible" header="Estructura del organigrama" position="right" class="app__drawer">
      <TreeOutline />
    </Drawer>

    <Toast position="bottom-center" />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app__header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

.app__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #a5b4fc;
  font-size: 20px;
}

.app__titles {
  display: flex;
  flex-direction: column;
}

.app__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.app__subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.app__main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.app__canvas {
  flex: 1;
  min-width: 0;
  position: relative;
}

:deep(.app__drawer) {
  background: #f8fafc;
}
</style>

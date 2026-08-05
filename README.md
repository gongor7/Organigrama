# Organigrama Institucional

Constructor visual e interactivo de organigramas institucionales construido con **Vue 3 + TypeScript + Vite**. Permite armar árboles jerárquicos de **Direcciones**, **Jefaturas** y **Puestos de trabajo** con drag & drop, CRUD completo en memoria y exportación a PDF — todo sin backend.

## ✨ Características

- 🖱️ **Creación por arrastre**: arrastra un tipo desde la paleta (Dirección, Jefatura, Puesto) al lienzo para crear un nodo.
- 🔀 **Re-parentado por drag & drop**: suelta un nodo sobre otro para convertirlo en su hijo (con validación anti-ciclos).
- 🔗 **Conexiones por manejadores**: arrastra desde el borde inferior de un nodo hasta la parte superior de otro para vincularlos.
- 📐 **Auto-layout jerárquico** (de arriba hacia abajo) cada vez que cambia la estructura; pan/zoom con minimapa y controles.
- ✏️ **CRUD completo** (panel lateral): crear, editar nombre/descripción/tipo, añadir hijos, eliminar con confirmación y mover a raíz.
- ↩️ **Deshacer / Rehacer** con historial.
- 📦 **Exportar / Importar** organigrama en JSON.
- 🖨️ **Exportar a PDF** (A4 horizontal) con encuadre automático del grafo completo.
- 🌳 **Vista de árbol** colapsable para inspeccionar la estructura.
- ⚡ Todo el estado vive en memoria (Pinia), sin backend ni persistencia.

## 🛠️ Reglas de jerarquía

| Nodo | Puede ser raíz | Puede ser hijo de | Puede tener hijos |
|---|---|---|---|
| Dirección | ✅ | Dirección | ✅ |
| Jefatura | ❌ | Dirección, Jefatura | ✅ |
| Puesto de trabajo | ❌ | Dirección, Jefatura | ❌ |

## 🚀 Empezar

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview
```

Abre http://localhost:5173 y pulsa el botón **Ejemplo** del toolbar para ver un organigrama de muestra.

## 🗂️ Estructura del proyecto

```
src/
├─ components/          # Lienzo, paleta, panel lateral, toolbar, vista de árbol
│  └─ nodes/OrgNode.vue # Nodo personalizado (tarjeta con color/icono por tipo)
├─ layout/treeLayout.ts # Auto-layout jerárquico con d3-hierarchy
├─ store/orgChart.ts    # Estado Pinia: CRUD, undo/redo, export/import
├─ types/org.ts         # Modelo de datos y metadatos de tipos de nodo
├─ utils/exportPdf.ts   # Captura del lienzo y generación de PDF (html-to-image + jsPDF)
├─ App.vue
└─ main.ts
```

## 🧱 Stack

- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Vue Flow](https://vueflow.dev/) — lienzo de nodos con drag & drop
- [Pinia](https://pinia.vuejs.org/) — estado
- [PrimeVue](https://primevue.org/) — componentes de UI
- [d3-hierarchy](https://d3js.org/) — layout de árbol
- [jsPDF](https://github.com/parallax/jsPDF) + [html-to-image](https://github.com/bubkoo/html-to-image) — exportación a PDF

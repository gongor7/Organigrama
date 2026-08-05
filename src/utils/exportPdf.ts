import { getFontEmbedCSS, toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { OrgNode } from '../types/org'
import { NODE_MIN_HEIGHT, NODE_WIDTH } from '../types/org'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export function computeGraphBounds(nodes: OrgNode[], padding = 40): Bounds {
  if (!nodes.length) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH)
    maxY = Math.max(maxY, node.position.y + NODE_MIN_HEIGHT)
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  }
}

export function viewportForBounds(bounds: Bounds, containerWidth: number, containerHeight: number): Viewport {
  const zoom = Math.min(containerWidth / bounds.width, containerHeight / bounds.height)
  return {
    x: -bounds.x * zoom + (containerWidth - bounds.width * zoom) / 2,
    y: -bounds.y * zoom + (containerHeight - bounds.height * zoom) / 2,
    zoom,
  }
}

export async function exportFlowToPdf(rendererEl: HTMLElement, filename = 'organigrama.pdf'): Promise<void> {
  const fontEmbedCSS = await getFontEmbedCSS(rendererEl)
  const dataUrl = await toPng(rendererEl, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
    fontEmbedCSS,
  })

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('No se pudo cargar la imagen del organigrama.'))
    img.src = dataUrl
  })

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const scale = Math.min(pageWidth / img.width, pageHeight / img.height)
  const width = img.width * scale
  const height = img.height * scale

  pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height)
  pdf.save(filename)
}
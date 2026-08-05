import { hierarchy, tree } from 'd3-hierarchy'
import type { OrgNode, Position } from '../types/org'
import { LAYOUT_SPACING_X, LAYOUT_SPACING_Y, NODE_MIN_HEIGHT, NODE_WIDTH } from '../types/org'

interface LayoutDatum {
  id: string
  children?: LayoutDatum[]
}

const ROOT_ID = '__org_root__'

export function computeTreeLayout(nodes: OrgNode[]): Map<string, Position> {
  const positions = new Map<string, Position>()

  const byParent = new Map<string | null, OrgNode[]>()
  for (const node of nodes) {
    const list = byParent.get(node.parentId) ?? []
    list.push(node)
    byParent.set(node.parentId, list)
  }

  const buildDatum = (node: OrgNode): LayoutDatum => {
    const children = (byParent.get(node.id) ?? []).map(buildDatum)
    return children.length ? { id: node.id, children } : { id: node.id }
  }

  const roots = (byParent.get(null) ?? []).map(buildDatum)
  if (!roots.length) return positions

  const data: LayoutDatum = roots.length === 1 ? roots[0] : { id: ROOT_ID, children: roots }

  const root = hierarchy<LayoutDatum>(data, (d) => d.children)

  tree<LayoutDatum>()
    .nodeSize([NODE_WIDTH + LAYOUT_SPACING_X, NODE_MIN_HEIGHT + LAYOUT_SPACING_Y])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.2))(root)

  root.each((node) => {
    if (node.data.id === ROOT_ID || node.x === undefined || node.y === undefined) return
    positions.set(node.data.id, {
      x: node.x - NODE_WIDTH / 2,
      y: node.y - NODE_MIN_HEIGHT / 2,
    })
  })

  return positions
}

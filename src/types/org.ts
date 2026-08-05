export type NodeType = 'direccion' | 'jefatura' | 'puesto'

export interface Position {
  x: number
  y: number
}

export interface OrgNode {
  id: string
  type: NodeType
  label: string
  description: string
  parentId: string | null
  position: Position
}

export interface NodeTypeMeta {
  label: string
  short: string
  icon: string
  color: string
  soft: string
}

export const NODE_TYPES: NodeType[] = ['direccion', 'jefatura', 'puesto']

export const NODE_TYPE_META: Record<NodeType, NodeTypeMeta> = {
  direccion: {
    label: 'Dirección',
    short: 'Dirección',
    icon: 'pi pi-building-columns',
    color: '#0f8a5f',
    soft: '#e2f6ee',
  },
  jefatura: {
    label: 'Jefatura',
    short: 'Jefatura',
    icon: 'pi pi-briefcase',
    color: '#2563eb',
    soft: '#e5edff',
  },
  puesto: {
    label: 'Puesto de trabajo',
    short: 'Puesto',
    icon: 'pi pi-user',
    color: '#d97706',
    soft: '#fdf1d9',
  },
}

export const NODE_WIDTH = 220
export const NODE_MIN_HEIGHT = 78

export const LAYOUT_SPACING_X = 70
export const LAYOUT_SPACING_Y = 110

export const ORG_JSON_VERSION = 1

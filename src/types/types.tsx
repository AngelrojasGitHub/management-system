import { Prisma } from '@prisma/client'

export type SideMenuItem = {
  title: string
  path: string
  icon?: JSX.Element | null
  submenu?: boolean
  submenuItems?: SideMenuItem[]
}

export type Renglon = {
  id: number
  nombre: string
  descripcion: string
  clasificacion: 'Consumible' | 'Equipo' | 'Insumo' | 'Material' | 'Mueble'
  categoria: string
  tipo: string
  presentacion: string
  numero_parte: string
  unidad_de_medida: string
}
export type Renglones = Prisma.RenglonesGetPayload<{
  include: {
    recibimientos: true
  }
}>
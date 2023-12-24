import { columns } from './columns'
import { Renglon } from '@/utils/types/types'
import { DataTable } from '@/modules/common/components/table/data-table'
import { prisma } from '@/lib/prisma'
import { Button } from '@/modules/common/components/button/button'
import { Plus } from 'lucide-react'

import Link from 'next/link'
import Modal from '@/modules/renglones/components/renglones-modal'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recibimientos',
  description: 'Desde aquí puedes administrar la entrada del inventario',
}
type SearchParamProps = {
  searchParams: Record<string, string> | null | undefined
}
async function getData() {
  const data = await prisma.recibimientos.findMany()
  return data
}
export default async function Page({ searchParams }: SearchParamProps) {
  const data = await getData()
  const show = searchParams?.show === 'true'
  return (
    <main className="flex-1 max-h-full m-12 overflow-hidden overflow-y-auto bg-background p-5 border border-border rounded-sm">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-md font-medium">Recibimientos</h1>
        <Link href="/dashboard/abastecimiento/recibimientos?show=true">
          <Button variant="outline" size={'sm'}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Recibimiento
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={data} />
      {show && <Modal />}
    </main>
  )
}

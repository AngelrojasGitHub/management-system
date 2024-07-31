import { getItemById } from '@/app/(main)/dashboard/lib/actions/item'

import PageForm from '@/modules/layout/components/page-form'
import ItemsForm from '../../../../../components/item-form'

export default async function Page({
  params: { id },
}: {
  params: { id: string }
}) {
  const itemData = await getItemById(Number(id))
  return (
    <PageForm title="Editar Renglón" backLink="/dashboard/armamento/inventario">
      <ItemsForm section="Armamento" defaultValues={itemData} />
    </PageForm>
  )
}
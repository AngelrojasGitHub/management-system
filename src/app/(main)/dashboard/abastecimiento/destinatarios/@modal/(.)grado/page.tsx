import CloseButtonDialog from '@/modules/common/components/dialog-close'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/modules/common/components/dialog/dialog'
import CategoriesForm from '@/modules/rangos/components/forms/categories-form'
import GradesForm from '@/modules/rangos/components/forms/grades-form'

export default async function Page() {
  return (
    <Dialog open={true}>
      <DialogContent
        customClose
        className={'lg:max-w-screen-lg overflow-hidden p-0'}
      >
        <DialogHeader className="p-5 mb-8 border-b border-border">
          <DialogTitle className="text-sm font-semibold text-foreground">
            Crear Grado
          </DialogTitle>
        </DialogHeader>
        <CloseButtonDialog />
        <GradesForm />
      </DialogContent>
    </Dialog>
  )
}

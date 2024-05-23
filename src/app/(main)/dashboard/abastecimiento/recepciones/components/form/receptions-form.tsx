'use client'
import { useCallback, useEffect, useState, useTransition } from 'react'

import { columns } from './columns'
import { cn } from '@/utils/utils'
import {
  useForm,
  SubmitHandler,
  useFieldArray,
  useFormState,
} from 'react-hook-form'
import { Button, buttonVariants } from '@/modules/common/components/button'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/common/components/form'

import { format } from 'date-fns'
import { CheckIcon, Loader2, Plus } from 'lucide-react'
import { DataTable } from '@/modules/common/components/table/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/common/components/card/card'
import { useToast } from '@/modules/common/components/toast/use-toast'
import {
  Prisma,
  Recepcion,
  Recepciones_Renglones,
  Serial,
} from '@prisma/client'
import {
  createReception,
  updateReception,
} from '@/app/(main)/dashboard/abastecimiento/recepciones/lib/actions/receptions'
import ModalForm from '@/modules/common/components/modal-form'
import { DialogFooter } from '@/modules/common/components/dialog/dialog'
import { CardItemSelected } from './card-item-selected'
import Link from 'next/link'
import { Input } from '@/modules/common/components/input/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/modules/common/components/popover/popover'
import { CaretSortIcon } from '@radix-ui/react-icons'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/modules/common/components/command/command'
import { getAllReceivers } from '../../../destinatarios/lib/actions/receivers'
import { getAllProfessionals } from '@/app/(main)/dashboard/rangos/lib/actions/professionals'

type SerialType = Omit<
  Serial,
  'id' | 'id_recepcion' | 'fecha_creacion' | 'ultima_actualizacion'
>
type RecepcionType = Prisma.RecepcionGetPayload<{
  include: {
    renglones: {
      include: {
        renglon: { include: { unidad_empaque: true; recepciones: true } }
        seriales: true
      }
    }
  }
}>

type RenglonType = Prisma.RenglonGetPayload<{
  include: { unidad_empaque: true; recepciones: true }
}>
type Detalles = Omit<
  Recepciones_Renglones,
  'id_recepcion' | 'id' | 'fecha_creacion' | 'ultima_actualizacion'
> & {
  seriales: SerialType[]
}

export type FormValues = Omit<
  Recepcion,
  'id' | 'fecha_creacion' | 'ultima_actualizacion'
> & {
  renglones: Detalles[]
}
interface Props {
  renglonesData: RenglonType[]
  defaultValues?: RecepcionType
}
type ComboboxData = {
  value: string
  label: string
}
export default function ReceptionsForm({
  renglonesData,
  defaultValues,
}: Props) {
  const { toast } = useToast()
  const isEditEnabled = !!defaultValues
  const router = useRouter()

  const form = useForm<FormValues>({
    mode: 'onChange',
    defaultValues,
  })
  const { isDirty } = useFormState({ control: form.control })

  const { append, remove } = useFieldArray<FormValues>({
    control: form.control,
    name: `renglones`,
  })
  const [isPending, startTransition] = useTransition()

  const [itemsWithoutSerials, setItemsWithoutSerials] = useState<number[]>([])
  const [selectedRows, setSelectedRows] = useState<any>({})
  const [selectedRowsData, setSelectedRowsData] = useState<RenglonType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [receivers, setReceivers] = useState<ComboboxData[]>([])
  const [professionals, setProfessionals] = useState<ComboboxData[]>([])

  const toogleModal = () => setIsModalOpen(!isModalOpen)

  useEffect(() => {
    startTransition(() => {
      getAllReceivers().then((data) => {
        const transformedData = data.map((receiver) => ({
          value: receiver.cedula,
          label: receiver.cedula + '-' + receiver.nombres,
        }))

        setReceivers(transformedData)
      })

      getAllProfessionals().then((data) => {
        const transformedData = data.map((receiver) => ({
          value: receiver.cedula,
          label: receiver.cedula + '-' + receiver.nombres,
        }))

        setProfessionals(transformedData)
      })
    })
  }, [])
  useEffect(() => {
    if (isEditEnabled) {
      const items = defaultValues.renglones
      const itemsData = items.map((item) => item.renglon) //TODO: revisar el tipado
      const selectedItems = items.reduce(
        (acc, item) => {
          acc[item.id_renglon] = true
          return acc
        },
        {} as { [key: number]: boolean }
      )

      setSelectedRows(selectedItems)
      setSelectedRowsData(itemsData)
    }
  }, [isEditEnabled, defaultValues])

  const handleTableSelect = useCallback(
    (lastSelectedRow: any) => {
      if (lastSelectedRow) {
        append({
          id_renglon: lastSelectedRow.id,
          cantidad: 0,
          fabricante: null,
          precio: 0,
          codigo_solicitud: null,
          fecha_fabricacion: null,
          fecha_vencimiento: null,
          seriales: [],
          seriales_automaticos: false,
          observacion: null,
        })
        setSelectedRowsData((prev) => {
          if (prev.find((item) => item.id === lastSelectedRow.id)) {
            const index = prev.findIndex(
              (item) => item.id === lastSelectedRow.id
            )
            remove(index)
            return prev.filter((item) => item.id !== lastSelectedRow.id)
          } else {
            return [...prev, lastSelectedRow]
          }
        })
      }
    },
    [append, remove]
  )

  const deleteItem = (index: number) => {
    setSelectedRowsData((prev) => {
      return prev.filter((item) => {
        const nuevoObjeto = { ...selectedRows }
        if (item.id === selectedRowsData[index].id) {
          delete nuevoObjeto[item.id]
          setSelectedRows(nuevoObjeto)
        }
        return item.id !== selectedRowsData[index].id
      })
    })
    remove(index)
  }
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (data.renglones.length === 0) {
      toast({
        title: 'Faltan campos',
        description: 'No se puede crear una recepción sin renglones',
      })
      return
    }

    data.renglones.map((item) => {
      item.seriales.length === 0 &&
        setItemsWithoutSerials((prev) => [...prev, item.id_renglon])
    })

    if (itemsWithoutSerials.length > 0) {
      return
    }

    startTransition(() => {
      if (!isEditEnabled) {
        createReception(data).then((res) => {
          if (res?.error) {
            toast({
              title: 'Error',
              description: res?.error,
              variant: 'destructive',
            })

            //@ts-ignore
            res.fields?.map((field) => {
              setItemsWithoutSerials((prev) => [...prev, field])
            })
            return
          }

          toast({
            title: 'Recepción creada',
            description: 'La recepción se ha creado correctamente',
            variant: 'success',
          })
          router.replace('/dashboard/abastecimiento/recepciones')
        })
        return
      }

      if (!isDirty) {
        toast({
          title: 'No se han detectado cambios',
        })

        return
      }

      updateReception(defaultValues?.id, data).then((res) => {
        if (res?.error) {
          toast({
            title: 'Error',
            description: res?.error,
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Recepción actualizada',
          description: 'La recepción se ha actualizado correctamente',
          variant: 'success',
        })
        router.replace('/dashboard/abastecimiento/recepciones')
      })
    })
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className=" space-y-10 mb-[8rem] "
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Complete la información solicitada para la recepción de los
              renglones
            </CardTitle>
            <CardDescription>
              Llene los campos solicitados para la recepción de los renglones
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8 pt-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="cedula_destinatario"
                rules={{ required: 'Este campo es obligatorio' }}
                render={({ field }) => (
                  <FormItem className="flex-1 ">
                    <FormLabel>Persona que entrega:</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? receivers.find(
                                  (receiver) => receiver.value === field.value
                                )?.label
                              : 'Seleccionar destinatario'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="PopoverContent">
                        <Command>
                          <CommandInput
                            placeholder="Buscar destinatario..."
                            className="h-9"
                          />
                          <CommandEmpty>
                            No se encontaron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {receivers.map((receiver) => (
                              <CommandItem
                                value={receiver.label}
                                key={receiver.value}
                                onSelect={() => {
                                  form.setValue(
                                    'cedula_destinatario',
                                    receiver.value,
                                    { shouldDirty: true }
                                  )
                                }}
                              >
                                {receiver.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    receiver.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormDescription>
                      <Link
                        href="/dashboard/abastecimiento/destinatarios/agregar"
                        className={cn(
                          buttonVariants({ variant: 'link' }),
                          'text-sm h-[30px]'
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Destinatario
                      </Link>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedula_abastecedor"
                rules={{ required: 'Este campo es obligatorio' }}
                render={({ field }) => (
                  <FormItem className=" flex-1 ">
                    <FormLabel>Profesional que recibe:</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? professionals.find(
                                  (professional) =>
                                    professional.value === field.value
                                )?.label
                              : 'Seleccionar profesional'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="PopoverContent">
                        <Command>
                          <CommandInput
                            placeholder="Buscar profesional..."
                            className="h-9"
                          />
                          <CommandEmpty>
                            No se encontaron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {professionals.map((professional) => (
                              <CommandItem
                                value={professional.label}
                                key={professional.value}
                                onSelect={() => {
                                  form.setValue(
                                    'cedula_abastecedor',
                                    professional.value,
                                    { shouldDirty: true }
                                  )
                                }}
                              >
                                {professional.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    professional.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormDescription>
                      <Link
                        href="/dashboard/profesionales/agregar"
                        className={cn(
                          buttonVariants({ variant: 'link' }),
                          'text-sm h-[30px]'
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Profesional
                      </Link>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="cedula_autorizador"
                rules={{ required: 'Este campo es obligatorio' }}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>
                      Profesional que autorizará la recepción:
                    </FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? professionals.find(
                                  (professional) =>
                                    professional.value === field.value
                                )?.label
                              : 'Seleccionar profesional'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="PopoverContent">
                        <Command>
                          <CommandInput
                            placeholder="Buscar profesional..."
                            className="h-9"
                          />
                          <CommandEmpty>
                            No se encontaron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {professionals.map((professional) => (
                              <CommandItem
                                value={professional.label}
                                key={professional.value}
                                onSelect={() => {
                                  form.setValue(
                                    'cedula_autorizador',
                                    professional.value,
                                    { shouldDirty: true }
                                  )
                                }}
                              >
                                {professional.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    professional.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedula_supervisor"
                rules={{ required: 'Este campo es obligatorio' }}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>
                      Profesional que supervisa la recepción:
                    </FormLabel>

                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? professionals.find(
                                  (professional) =>
                                    professional.value === field.value
                                )?.label
                              : 'Seleccionar profesional'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="PopoverContent">
                        <Command>
                          <CommandInput
                            placeholder="Buscar profesional..."
                            className="h-9"
                          />
                          <CommandEmpty>
                            No se encontaron resultados.
                          </CommandEmpty>
                          <CommandGroup>
                            {professionals.map((professional) => (
                              <CommandItem
                                value={professional.label}
                                key={professional.value}
                                onSelect={() => {
                                  form.setValue(
                                    'cedula_supervisor',
                                    professional.value,
                                    { shouldDirty: true }
                                  )
                                }}
                              >
                                {professional.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    professional.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="border-b border-base-300" />
            <FormField
              control={form.control}
              name="motivo"
              rules={{
                maxLength: {
                  value: 200,
                  message: 'Debe tener un máximo de 200 carácteres',
                },
              }}
              render={({ field }) => (
                <FormItem className="">
                  <div className="flex flex-col gap-1">
                    <FormLabel>Motivo</FormLabel>
                    <FormDescription>
                      Redacta el motivo por el cual se está recibiendo el
                      material, renglones, etc...
                    </FormDescription>
                  </div>
                  <FormControl>
                    <textarea
                      id="motivo"
                      rows={3}
                      className=" w-full rounded-md border-0 p-1.5 text-foreground bg-background ring-1  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-b border-base-300" />
            <FormField
              control={form.control}
              name={`fecha_recepcion`}
              rules={{
                required: true,
                validate: (value) => {
                  if (value > new Date()) {
                    return 'La fecha de recepción no debe ser mayor a la fecha actual'
                  }
                },
              }}
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-row flex-1 items-center gap-5 ">
                    <div className="w-[20rem]">
                      <FormLabel>Fecha de recepción</FormLabel>
                      <FormDescription>
                        Selecciona la fecha en la que se reciben los materiales
                        o renglones{' '}
                      </FormDescription>
                    </div>
                    <div className="flex-1 w-full">
                      <Input
                        type="datetime-local"
                        id="fecha_recepcion"
                        {...field}
                        value={
                          field.value
                            ? format(
                                new Date(field.value),
                                "yyyy-MM-dd'T'HH:mm"
                              )
                            : ''
                        }
                        onBlur={() => {
                          form.trigger('fecha_recepcion')
                        }}
                        onChange={(e) => {
                          if (!e.target.value) {
                            //@ts-ignore
                            form.setValue('fecha_recepcion', null)
                            return
                          }

                          form.setValue(
                            'fecha_recepcion',
                            new Date(e.target.value)
                          )
                        }}
                        className="w-full"
                      />

                      <FormMessage />
                    </div>
                  </FormItem>
                )
              }}
            />
            <div className="border-b border-base-300" />

            <div className="flex flex-1 flex-row gap-8 items-center justify-between">
              <FormDescription className="w-[20rem]">
                Selecciona los materiales o renglones que se han recibido
              </FormDescription>
              <ModalForm
                triggerName="Seleccionar renglones"
                closeWarning={false}
                open={isModalOpen}
                customToogleModal={toogleModal}
              >
                <div className="flex flex-col gap-4 p-8">
                  <CardTitle>Selecciona los renglones recibidos</CardTitle>
                  <CardDescription>
                    Encuentra y elige los productos que se han recibido en el
                    CESERLODAI. Usa la búsqueda para agilizar el proceso.
                  </CardDescription>
                  <CardDescription>
                    Si no encuentras el renglón que buscas, puedes crearlo
                    <Link
                      href="/dashboard/abastecimiento/inventario/renglon"
                      className={cn(
                        buttonVariants({ variant: 'secondary' }),
                        'mx-4'
                      )}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Renglón
                    </Link>
                  </CardDescription>
                  <DataTable
                    columns={columns}
                    data={renglonesData}
                    onSelectedRowsChange={handleTableSelect}
                    isColumnFilterEnabled={false}
                    selectedData={selectedRows}
                    setSelectedData={setSelectedRows}
                  />
                  <Button
                    variant={'default'}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Listo
                  </Button>
                </div>
              </ModalForm>
            </div>
          </CardContent>
        </Card>

        {selectedRowsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Detalle la información de cada renglón seleccionado
              </CardTitle>
              <CardDescription>
                Es necesario que cada renglón contenga la información
                correspondiente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-8 pt-4">
              <div className="grid xl:grid-cols-2 gap-4">
                {selectedRowsData.map((item, index) => {
                  const isEmpty = itemsWithoutSerials.includes(item.id)
                  return (
                    <CardItemSelected
                      key={item.id}
                      item={item}
                      index={index}
                      deleteItem={deleteItem}
                      isEmpty={
                        isEmpty
                          ? 'Este renglon no tiene seriales asociados'
                          : false
                      }
                      setItemsWithoutSerials={setItemsWithoutSerials}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="fixed right-0 bottom-0 bg-white pt-4 border-t border-border gap-4 items-center w-full p-8">
          <Button disabled={isPending} variant="default" type={'submit'}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

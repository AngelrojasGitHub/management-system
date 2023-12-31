import { cn } from '@/lib/utils'

export const PageTemplate = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('', className)} {...props}>
      {props.children}
    </div>
  )
}

export const PageHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between mb-5 p-5 border-b',
        className
      )}
      {...props}
    >
      {props.children}
    </div>
  )
}
PageHeader.displayName = 'PageHeader'

export const PageHeaderTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h1
      className={cn(
        'text-2xl font-semibold tracking-tight flex gap-2 items-center',
        className
      )}
      {...props}
    >
      {props.children}
    </h1>
  )
}
PageHeaderTitle.displayName = 'PageHeaderTitle'

export const PageHeaderDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
)
PageHeaderDescription.displayName = 'PageHeaderDescription'

export const HeaderLeftSide = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col justify-start space-y-1', className)}
    {...props}
  />
)
HeaderLeftSide.displayName = 'HeaderLeftSide'

export const HeaderRightSide = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex justify-end items-center space-x-4', className)}
    {...props}
  />
)

export const PageContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5', className)} {...props} />
)
PageContent.displayName = 'PageContent'
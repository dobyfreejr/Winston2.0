import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Dialog = ({ children, open, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [isOpen, setIsOpen] = React.useState(open || false)
  
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }
  
  return (
    <div>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { isOpen, onOpenChange: handleOpenChange } as any)
          : child
      )}
    </div>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isOpen?: boolean; onOpenChange?: (open: boolean) => void }
>(({ className, children, asChild, isOpen, onOpenChange, ...props }, ref) => {
  const handleClick = () => {
    onOpenChange?.(true)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: handleClick
    })
  }
  
  return (
    <button
      ref={ref}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean; onOpenChange?: (open: boolean) => void }
>(({ className, children, isOpen, onOpenChange, ...props }, ref) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        ref={ref}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        {...props}
      >
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}
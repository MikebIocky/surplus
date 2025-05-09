declare module "@/components/ui/dialog" {
  import * as React from "react"
  import * as DialogPrimitive from "@radix-ui/react-dialog"

  export const Dialog: typeof DialogPrimitive.Root
  export const DialogTrigger: typeof DialogPrimitive.Trigger
  export const DialogContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>
  export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>
  export const DialogTitle: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>
  export const DialogDescription: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>
} 
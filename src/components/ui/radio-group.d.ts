declare module "@/components/ui/radio-group" {
  import * as React from "react"
  import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
 
  export const RadioGroup: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>
  export const RadioGroupItem: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>
} 
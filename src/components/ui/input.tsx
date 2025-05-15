import * as React from "react"

import { cn } from "@/lib/utils"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export function Input(props: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={
        "border rounded px-3 py-2 w-full " +
        (props.className || "")
      }
    />
  )
}

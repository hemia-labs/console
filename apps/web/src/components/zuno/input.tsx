"use client"

import { Input as BaseInput } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: BaseInput.Props) {
  return <BaseInput className={state => cn("h-8 min-h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base text-foreground md:text-sm placeholder:text-muted-foreground transition-colors duration-(--zuno-duration-fast) motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:border-ring focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:outline-destructive data-invalid:border-destructive data-invalid:focus-visible:border-destructive data-invalid:focus-visible:outline-destructive", typeof className === "function" ? className(state) : className)} {...props} />
}

'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }) {
        return (
          <Toast key={id} {...props} className={className}>
            <div className="grid gap-1 w-full !m-0">
              {title && <ToastTitle className="w-full">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="w-full">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="md:max-w-[500px] lg:max-w-[550px]" />
    </ToastProvider>
  )
}

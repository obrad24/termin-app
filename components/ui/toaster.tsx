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
  const { toasts, dismiss } = useToast()
  const hasOpenToast = toasts.some(t => t.open)

  return (
    <>
      {/* Backdrop overlay for clicking outside */}
      {hasOpenToast && (
        <div
          className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm"
          onClick={() => {
            toasts.forEach(toast => {
              if (toast.open) {
                dismiss(toast.id)
              }
            })
          }}
        />
      )}
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
    </>
  )
}

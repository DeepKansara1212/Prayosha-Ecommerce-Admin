import { create } from 'zustand'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastState {
  toasts: ToastItem[]
  add: (message: string, type: ToastType) => void
  remove: (id: number) => void
}

let _counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add(message, type) {
    const id = ++_counter
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500
    )
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function useToast() {
  const add = useToastStore((s) => s.add)
  return {
    success: (message: string) => add(message, 'success'),
    error:   (message: string) => add(message, 'error'),
  }
}

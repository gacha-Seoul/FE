import { useEffect } from 'react'

export type ToastMsg = { id: number; text: string; kind?: 'error' | 'info' | 'reward' }

export default function Toast({ toast, onDone }: { toast: ToastMsg | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null
  return (
    <div key={toast.id} className={`toast is-${toast.kind ?? 'info'}`} role="status">
      {toast.text}
    </div>
  )
}

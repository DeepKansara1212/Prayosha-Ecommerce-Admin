import { X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

export default function Toaster() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success'
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 6,
              background: isSuccess ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}`,
              color: isSuccess ? '#166534' : '#991B1B',
              fontFamily: "'Jost', sans-serif",
              fontSize: 13,
              minWidth: 220,
              maxWidth: 340,
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              pointerEvents: 'all',
            }}
          >
            {/* Dot indicator */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isSuccess ? '#22C55E' : '#EF4444',
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                display: 'flex',
                padding: 0,
                opacity: 0.6,
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

'use client'
import { useRef, ReactNode } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'

interface PopoverProps {
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
}

export default function Popover({ onClose, children, title, className }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClose)

  return (
    <div ref={ref} className={`popover p-3 min-w-[220px] ${className ?? ''}`} style={{ position: 'absolute', zIndex: 200 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
          <button className="btn-ghost" style={{ padding: '2px 6px', fontSize: 16 }} onClick={onClose}>×</button>
        </div>
      )}
      {children}
    </div>
  )
}

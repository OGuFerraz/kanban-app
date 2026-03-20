'use client'
import { useEffect, ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
  className?: string
}

export default function Modal({ onClose, children, className }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`modal-content ${className ?? ''}`}>
        {children}
      </div>
    </div>
  )
}

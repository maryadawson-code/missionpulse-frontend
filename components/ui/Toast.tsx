// filepath: components/ui/Toast.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const colors = {
    success: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300',
    error: 'border-red-500/40 bg-red-950/60 text-red-300',
    info: 'border-cyan/40 bg-cyan-950/60 text-cyan-300',
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm ${colors[toast.type]} animate-in slide-in-from-right`}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

// Global toast state hook
let toastListeners: Array<(toasts: ToastMessage[]) => void> = []
let toastState: ToastMessage[] = []

export function addToast(type: ToastMessage['type'], message: string) {
  const toast: ToastMessage = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message,
  }
  toastState = [...toastState, toast]
  toastListeners.forEach((fn) => fn(toastState))
}

function removeToast(id: string) {
  toastState = toastState.filter((t) => t.id !== id)
  toastListeners.forEach((fn) => fn(toastState))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  const handleDismiss = useCallback((id: string) => {
    removeToast(id)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}

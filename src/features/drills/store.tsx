import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ReactNode } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Toaster } from '@/components/ui/sonner'
import { STORAGE_KEY, advanceSimulation, restoreState, seedState } from './data'
import type { DemoState } from './data'

type Store = {
  state: DemoState
  update: (fn: (draft: DemoState) => void) => void
  notify: (text: string) => void
  reset: () => void
  storageWarning: string
}
const Context = createContext<Store | null>(null)
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => seedState(1788566400000))
  const [ready, setReady] = useState(false)
  const [storageWarning, setStorageWarning] = useState('')
  useEffect(() => {
    try {
      const restored = restoreState(
        localStorage.getItem(STORAGE_KEY),
        Date.now(),
      )
      setState(restored.state)
      if (restored.recovered)
        toast.warning(
          'Saved demo data was invalid. A fresh workspace has been restored.',
        )
    } catch {
      setState(seedState())
      setStorageWarning(
        'Browser storage is unavailable. Changes will last for this session only.',
      )
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      setStorageWarning(
        'Changes could not be saved in this browser. Your current session is still available.',
      )
    }
  }, [state, ready])
  useEffect(() => {
    if (!ready) return
    const timer = setInterval(
      () => setState((s) => advanceSimulation(s, Date.now())),
      1000,
    )
    return () => clearInterval(timer)
  }, [ready])
  function update(fn: (draft: DemoState) => void) {
    setState((s) => {
      const draft = structuredClone(s)
      fn(draft)
      return draft
    })
  }
  return (
    <Context.Provider
      value={{
        state,
        update,
        notify: (text) => toast.success(text),
        storageWarning,
        reset: () => {
          setState(seedState())
          toast.success('Demo data has been reset.')
        },
      }}
    >
      {ready ? (
        children
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
            D
          </span>
          <span className="inline-flex items-center gap-2">
            <Spinner /> Loading your workspace…
          </span>
        </div>
      )}
      <Toaster position="bottom-right" richColors closeButton />
    </Context.Provider>
  )
}
export function useDemo() {
  const store = useContext(Context)
  if (!store) throw new Error('DemoProvider is required')
  return store
}

import { useEffect, RefObject } from 'react'

declare global {
  interface Window {
    electronAPI: {
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
    }
  }
}

export function useClickThrough(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current
    if (!element || !window.electronAPI) return

    const handleMouseEnter = () => {
      window.electronAPI.setIgnoreMouseEvents(false)
    }

    const handleMouseLeave = () => {
      window.electronAPI.setIgnoreMouseEvents(true, { forward: true })
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref])
}
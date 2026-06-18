'use client'

import { Component, type ReactNode } from 'react'

export class DisplayErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[DisplayErrorBoundary] render error — reloading in 5s', error)
    setTimeout(() => window.location.reload(), 5_000)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='fixed inset-0 bg-navy-dark flex items-center justify-center'>
          <p className='font-mono text-xs uppercase tracking-[0.28em] text-white/20'>—</p>
        </div>
      )
    }
    return this.props.children
  }
}

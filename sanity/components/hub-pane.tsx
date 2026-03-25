'use client'

import { usePaneRouter } from 'sanity/structure'

export type HubItem = {
  id: string
  icon: string
  title: string
  description: string
}

export function createHubPane(items: HubItem[]) {
  return function HubPane() {
    const { ChildLink } = usePaneRouter()

    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <ChildLink key={item.id} childId={item.id} childParameters={{}}>
              <div
                style={{
                  display: 'block',
                  padding: '16px 20px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  background: '#fff',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#111' }}>
                  {item.icon}&nbsp;&nbsp;{item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  {item.description}
                </div>
              </div>
            </ChildLink>
          ))}
        </div>
      </div>
    )
  }
}

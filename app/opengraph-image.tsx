import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'Fescue Golf Club — Private Golf Club';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const logoBuffer = readFileSync(
    join(process.cwd(), 'public', 'Logo-no-border.png'),
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        background: '#002918',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(184,150,60,0.10) 0%, transparent 70%)',
          display: 'flex',
        }}
      />

      <img
        src={logoSrc}
        width={520}
        height={520}
        style={{ objectFit: 'contain' }}
      />
    </div>,
    { ...size },
  );
}

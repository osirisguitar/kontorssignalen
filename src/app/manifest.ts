import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kontorssignalen',
    short_name: 'Kontoret',
    description: 'Kontorssignalen',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/traffic-light.png',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}

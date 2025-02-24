import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kontorssignalen',
    short_name: 'Kontor🚦',
    description: 'Kontorssignalen',
    start_url: '/',
    display: 'standalone',
    background_color: '#000',
    theme_color: '#000',
    icons: [
      {
        src: '/traffic-light.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}

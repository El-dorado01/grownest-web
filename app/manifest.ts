import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GrowNest',
    short_name: 'GrowNest',
    description: "Africa's premier platform for financial prosperity.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#D5A018',
    icons: [
      {
        src: '/d_icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}

import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

// Module level — runs ONCE at build time, not per path
const posts = await getCollection('posts', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true,
);

// WOFF (not WOFF2) — satori does not support brotli-compressed WOFF2
const spaceGrotesk600 = fs.readFileSync(
  path.resolve(
    'node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff',
  ),
);
const chakraPetch400 = fs.readFileSync(
  path.resolve(
    'node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-400-normal.woff',
  ),
);
const jetbrainsMono400 = fs.readFileSync(
  path.resolve(
    'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff',
  ),
);

export function getStaticPaths() {
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.[^.]+$/, '') },
    props: { post },
  }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: (typeof posts)[0] };

  const svg = await satori(buildOgTemplate({ title: post.data.title, tags: post.data.tags }), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Space Grotesk', data: spaceGrotesk600.buffer as ArrayBuffer, weight: 600, style: 'normal' },
      { name: 'Chakra Petch', data: chakraPetch400.buffer as ArrayBuffer, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: jetbrainsMono400.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
}

function buildOgTemplate(data: { title: string; tags?: string[] }) {
  const tagBadge = data.tags?.[0]
    ? [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '22px',
              fontFamily: 'Chakra Petch',
              color: '#D1D9E6',
              border: '1px solid rgba(209,217,230,0.3)',
              padding: '4px 12px',
              alignSelf: 'flex-start',
            },
            children: `#${data.tags![0].toUpperCase()}`,
          },
        },
      ]
    : [];

  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0A0F1E',
        padding: '72px 80px',
      },
      children: [
        // Top section: optional tag badge + title
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            },
            children: [
              ...tagBadge,
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '64px',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    lineHeight: 1.15,
                  },
                  children: data.title,
                },
              },
            ],
          },
        },
        // Cyan separator line
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '2px',
              backgroundColor: '#00FFFF',
            },
          },
        },
        // Bottom row: author/wordmark left, site URL right
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: '28px',
                          fontFamily: 'Space Grotesk',
                          color: '#FFFFFF',
                        },
                        children: 'Cláudio Rapôso',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          fontSize: '24px',
                          fontFamily: 'Chakra Petch',
                          color: '#00FFFF',
                        },
                        children: 'O Sertão será Cloud',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '18px',
                    fontFamily: 'JetBrains Mono',
                    color: 'rgba(209,217,230,0.6)',
                  },
                  children: 'sertaoseracloud.com',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

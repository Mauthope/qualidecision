import type { MetadataRoute } from 'next';

/**
 * Diretivas de rastreamento de buscadores (Robots.txt)
 * Bloqueia 100% da indexação por motores de busca (Google, Bing, Yahoo, Yandex, DuckDuckGo)
 * e rastreadores de inteligência artificial (GPTBot, CCBot, Google-Extended, etc.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
      {
        userAgent: [
          'Googlebot',
          'Googlebot-Image',
          'Googlebot-News',
          'Googlebot-Video',
          'Bingbot',
          'MSNBot',
          'Baiduspider',
          'Yandex',
          'DuckDuckBot',
          'Yahoo! Slurp',
          'Applebot',
          'facebookexternalhit',
          'Twitterbot',
          'LinkedInBot',
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'CCBot',
          'anthropic-ai',
          'ClaudeBot',
          'Claude-Web',
          'Omgilibot',
          'FacebookBot',
          'Bytespider',
          'PerplexityBot',
          'Amazonbot'
        ],
        disallow: '/',
      }
    ],
  };
}

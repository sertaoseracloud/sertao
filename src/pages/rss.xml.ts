import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/consts';

const parser = new MarkdownIt();

export async function GET(context: { site: URL }) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    customData: `<language>pt-BR</language>`,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/posts/${post.id.replace(/\.[^.]+$/, '')}/`,
        content: sanitizeHtml(parser.render(post.body ?? ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      })),
  });
}

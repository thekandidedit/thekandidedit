// lib/mdx.ts
import 'server-only';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/** Loosely detect if content looks like raw HTML (starts with a tag) */
function looksLikeHtml(input: string) {
  return /^\s*</.test(input);
}

/**
 * Convert markdown (preferred) or raw HTML to safe HTML.
 * - If it's markdown: parse → rehype → sanitize → string
 * - If it's HTML: sanitize only (no execution / scripts)
 */
export async function renderPostContent(input: string): Promise<string> {
  const htmlLike = looksLikeHtml(input);

  if (htmlLike) {
    const file = await unified()
      .use(remarkParse) // harmless for HTML, keeps pipeline consistent
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSanitize, {
        ...defaultSchema,
        attributes: {
          ...defaultSchema.attributes,
          code: [...(defaultSchema.attributes?.code || []), ['className']],
          pre: [...(defaultSchema.attributes?.pre || []), ['className']],
          a: [
            ...(defaultSchema.attributes?.a || []),
            ['target'],
            ['rel'],
          ],
          img: [
            ...(defaultSchema.attributes?.img || []),
            ['src'],
            ['alt'],
            ['title'],
            ['width'],
            ['height'],
          ],
        },
      })
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: { className: 'anchor' },
      })
      .use(rehypeStringify, { allowDangerousHtml: false })
      .process(input);

    return String(file);
  }

  // Markdown path
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        code: [...(defaultSchema.attributes?.code || []), ['className']],
        pre: [...(defaultSchema.attributes?.pre || []), ['className']],
        a: [
          ...(defaultSchema.attributes?.a || []),
          ['target'],
          ['rel'],
        ],
      },
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: 'anchor' },
    })
    .use(rehypeStringify)
    .process(input);

  return String(file);
}
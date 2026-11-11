import { useEffect } from 'react';
import { SITE_URL } from './config';

const SITE_NAME = 'Cryp-Cross';

// Finds or creates a <meta>/<link> in <head> so each route updates one tag instead of adding duplicates.
function upsertHeadTag(tag, matchAttr, matchValue, attrs) {
  let el = document.head.querySelector(`${tag}[${matchAttr}="${matchValue}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(matchAttr, matchValue);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}

// Unique title, description and canonical per route; `noindex` for dynamic and error pages.
export default function usePageMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    upsertHeadTag('meta', 'name', 'description', { content: description });
    upsertHeadTag('meta', 'property', 'og:title', { content: fullTitle });
    upsertHeadTag('meta', 'property', 'og:description', { content: description });
    upsertHeadTag('meta', 'name', 'robots', { content: noindex ? 'noindex, follow' : 'index, follow' });
    if (path) {
      upsertHeadTag('link', 'rel', 'canonical', { href: `${SITE_URL}${path}` });
      upsertHeadTag('meta', 'property', 'og:url', { content: `${SITE_URL}${path}` });
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
    }
  }, [title, description, path, noindex]);
}

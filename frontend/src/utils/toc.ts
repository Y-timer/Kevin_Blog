import type { ReactNode } from 'react';

export interface TocItem {
  id: string;
  label: string;
  indent?: boolean;
}

export function slugifyHeading(text: string): string {
  return (
    'toc-' +
    text
      .toLowerCase()
      .replace(/[^\w一-鿿\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const label = match[2].trim();
    items.push({ id: slugifyHeading(label), label, indent: level === 3 });
  }

  return items;
}

export function getTextFromNode(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextFromNode).join('');
  return '';
}

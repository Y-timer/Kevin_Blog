import { useEffect } from 'react';

const BASE_TITLE = 'KevinBlog - 探索技术与未来的边界';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} - KevinBlog` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
}

import { useState } from 'react';
import Hero from '../components/home/Hero';
import ArticleList from '../components/home/ArticleList';
import Sidebar from '../components/home/Sidebar';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const handleCategoryClick = (catId: string) => {
    setCategoryId(categoryId === catId ? '' : catId);
    setSearch('');
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setCategoryId('');
  };

  return (
    <>
      <Hero />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="grid grid-cols-1 gap-9 py-5 pb-15 lg:grid-cols-[1fr_320px]">
          <ArticleList key={JSON.stringify([search, categoryId])} search={search} categoryId={categoryId} />
          <Sidebar onCategoryClick={handleCategoryClick} activeCategoryId={categoryId} onSearch={handleSearch} />
        </div>
      </div>
    </>
  );
}

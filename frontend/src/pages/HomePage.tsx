import { useState } from 'react';
import Hero from '../components/home/Hero';
import ArticleList from '../components/home/ArticleList';
import Sidebar from '../components/home/Sidebar';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');

  const handleCategoryClick = (catId: string) => {
    if (!catId) {
      // 点击「全部」
      setCategoryId('');
      setActiveCategoryId('');
    } else if (activeCategoryId === catId) {
      setCategoryId('');
      setActiveCategoryId('');
    } else {
      setCategoryId(catId);
      setActiveCategoryId(catId);
      setSearch('');
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setCategoryId('');
    setActiveCategoryId('');
  };

  return (
    <>
      <Hero />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div className="grid grid-cols-1 gap-9 py-5 pb-15 lg:grid-cols-[1fr_320px]">
          <ArticleList search={search} categoryId={categoryId} />
          <Sidebar onCategoryClick={handleCategoryClick} activeCategoryId={activeCategoryId} onSearch={handleSearch} />
        </div>
      </div>
    </>
  );
}

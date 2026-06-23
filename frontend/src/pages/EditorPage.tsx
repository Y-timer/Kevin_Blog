import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ParticleBackground from '../components/layout/ParticleBackground';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import MarkdownRenderer from '../components/article/MarkdownRenderer';
import { createPost, getPostBySlug, getCategories } from '../services/post';
import { getAssetUrl, uploadImage } from '../services/upload';
import api from '../services/api';
import type { Category, Tag } from '../types';
import { getApiErrorMessage } from '../utils/errors';

const catOptions = [
  { value: '', label: '选择分类...' },
  { value: 'AI & ML', label: 'AI & ML' },
  { value: 'Web 开发', label: 'Web 开发' },
  { value: '安全攻防', label: '安全攻防' },
  { value: 'DevOps', label: 'DevOps' },
  { value: '系统设计', label: '系统设计' },
  { value: '性能优化', label: '性能优化' },
  { value: '开源项目', label: '开源项目' },
  { value: '技术随笔', label: '技术随笔' },
];

interface EditorDraft {
  title?: string;
  category?: string;
  date?: string;
  tags?: string[];
  excerpt?: string;
  content?: string;
  savedAt?: string;
}

function countWords(text: string): number {
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const eng = text
    .replace(/[一-鿿㐀-䶿]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return cjk + eng;
}

function estimateReadTime(text: string): number {
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const engWords = countWords(text) - cjk;
  return Math.max(1, Math.ceil(cjk / 300 + engWords / 200));
}

export default function EditorPage() {
  const { slug } = useParams<{ slug?: string }>();
  const isEditing = !!slug; // 有 slug → 编辑模式，无 slug → 新建模式
  const navigate = useNavigate();
  const [editPostId, setEditPostId] = useState<string | null>(null); // 编辑时的文章 UUID
  const [catNameToId, setCatNameToId] = useState<Record<string, string>>({}); // 分类名→ID 映射
  const [tagNameToId, setTagNameToId] = useState<Record<string, string>>({}); // 标签名→ID 映射
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'ready' | 'saved' | 'saving' | 'published'>('ready');
  const [lastSaved, setLastSaved] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [mobileShowPreview, setMobileShowPreview] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mdFileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = countWords(content);
  const chars = content.length;
  const readMin = estimateReadTime(content);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  };

  const saveDraft = useCallback(() => {
    const draft = { title, category, date, tags, excerpt, content, savedAt: new Date().toISOString() };
    localStorage.setItem('nexuslog_draft', JSON.stringify(draft));
    setSaveStatus('saved');
    setLastSaved(new Date().toLocaleTimeString('zh-CN'));
    showToast('✓ 草稿已保存 (Ctrl+S)');
  }, [title, category, date, tags, excerpt, content]);

  // Edit mode: load existing article data from API
  useEffect(() => {
    if (!slug) return;
    getPostBySlug(slug)
      .then((post) => {
        setEditPostId(post.id);
        setTitle(post.title);
        setContent(post.content);
        if (post.excerpt) setExcerpt(post.excerpt);
        if (post.category?.name) setCategory(post.category.name);
        if (post.createdAt) setDate(post.createdAt.slice(0, 10));
        if (post.tags?.length) setTags(post.tags.map((t) => t.name));
        setSaveStatus('ready');
      })
      .catch(() => {
        showToast('✗ 文章加载失败');
      });
  }, [slug]);

  // Load draft on mount (new mode only)
  useEffect(() => {
    if (isEditing) return;
    try {
      const raw = localStorage.getItem('nexuslog_draft');
      if (raw) {
        const d = JSON.parse(raw) as EditorDraft;
        if (d.title) setTitle(d.title);
        if (d.category) setCategory(d.category);
        if (d.date) setDate(d.date);
        if (Array.isArray(d.tags)) setTags(d.tags);
        if (d.content) setContent(d.content);
        if (d.excerpt) setExcerpt(d.excerpt);
        if (d.savedAt) setLastSaved(new Date(d.savedAt).toLocaleString('zh-CN'));
        setSaveStatus('ready');
      }
    } catch {
      localStorage.removeItem('nexuslog_draft');
    }
  }, [isEditing]);

  // Auto-save draft every 30s
  useEffect(() => {
    draftTimer.current = setInterval(() => {
      const draft = { title, category, date, tags, excerpt, content, savedAt: new Date().toISOString() };
      localStorage.setItem('nexuslog_draft', JSON.stringify(draft));
      setSaveStatus('saved');
      setLastSaved(new Date().toLocaleTimeString('zh-CN'));
    }, 30000);
    return () => {
      if (draftTimer.current) clearInterval(draftTimer.current as unknown as number);
    };
  }, [title, category, date, tags, excerpt, content]);

  // 加载分类和标签列表，建 name → id 映射
  useEffect(() => {
    getCategories()
      .then((cats: Category[]) => {
        const map: Record<string, string> = {};
        cats.forEach((c) => {
          map[c.name] = c.id;
        });
        setCatNameToId(map);
      })
      .catch(() => {
        setCatNameToId({});
      });
    // 加载已有标签
    api
      .get<{ data: Tag[] }>('/tags')
      .then((r) => {
        const map: Record<string, string> = {};
        (r.data.data || []).forEach((t) => {
          map[t.name] = t.id;
        });
        setTagNameToId(map);
      })
      .catch(() => {
        setTagNameToId({});
      });
  }, []);

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveDraft]);

  // 获取分类 ID：已有分类直接返回，不存在则自动创建
  const resolveCategoryId = async (): Promise<string | undefined> => {
    if (!category) return undefined;
    if (catNameToId[category]) return catNameToId[category];
    try {
      const r = await api.post('/categories', { name: category });
      const newId = r.data.data.id;
      setCatNameToId((p) => ({ ...p, [category]: newId }));
      return newId;
    } catch {
      return undefined;
    }
  };

  // 将用户输入的标签名转为 tagIds（已有标签用ID，新标签先创建再返回ID）
  const resolveTagIds = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const name of tags) {
      if (tagNameToId[name]) {
        ids.push(tagNameToId[name]);
        continue;
      }
      try {
        const r = await api.post('/tags', { name });
        const nid = r.data.data.id;
        setTagNameToId((p) => ({ ...p, [name]: nid }));
        ids.push(nid);
      } catch {
        continue;
      }
    }
    return ids;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showToast('✗ 请先输入文章标题');
      return;
    }
    if (!content.trim()) {
      showToast('✗ 请先输入文章内容');
      return;
    }
    setPublishing(true);
    try {
      // 生成干净摘要：去除所有 Markdown 语法，只保留纯文本的前 150 字
      const plainExcerpt = content
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*|__/g, '')
        .replace(/\*|_/g, '')
        .replace(/`{1,3}/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/^[-*+]\s/gm, '')
        .replace(/^\d+\.\s/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 150);
      const finalExcerpt = excerpt.trim() || plainExcerpt || content.slice(0, 150);
      const catId = await resolveCategoryId(); // 自动创建不存在的分类
      const tagIds = await resolveTagIds();

      if (isEditing && slug) {
        await api.put(`/posts/${editPostId}`, {
          title: title.trim(),
          content,
          excerpt: finalExcerpt,
          categoryId: catId,
          tagIds,
        });
        setSaveStatus('published');
        showToast('✓ 文章更新成功！');
        setTimeout(() => navigate(`/post/${slug}`), 800);
      } else {
        const post = await createPost({
          title: title.trim(),
          content,
          excerpt: finalExcerpt,
          categoryId: catId,
          tagIds,
        });
        localStorage.removeItem('nexuslog_draft');
        setSaveStatus('published');
        showToast('✓ 文章发布成功！');
        setTimeout(() => navigate(`/post/${post.slug}`), 800);
      }
    } catch (err) {
      showToast('✗ ' + getApiErrorMessage(err, '发布失败'));
    } finally {
      setPublishing(false);
    }
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val) && tags.length < 10) {
      setTags([...tags, val]);
      setTagInput('');
    } else if (tags.length >= 10) {
      showToast('最多添加 10 个标签');
    }
  };

  const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));

  // 处理图片上传：粘贴 / 拖拽 / 文件选择 → 上传到后端 → 插入 ![](url)
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    showToast('⏳ 图片上传中...');
    try {
      const result = await uploadImage(file);
      const imageUrl = getAssetUrl(result.url);
      // 在光标位置插入 Markdown 图片语法
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const mdImage = `![${result.filename}](${imageUrl})`;
        const newContent = content.substring(0, start) + mdImage + content.substring(end);
        setContent(newContent);
        // 将光标移到插入内容之后
        setTimeout(() => {
          ta.focus();
          ta.selectionStart = ta.selectionEnd = start + mdImage.length;
        }, 0);
      }
      showToast('✓ 图片上传成功');
    } catch {
      showToast('✗ 图片上传失败');
    }
  };

  // 导入 .md 文件：提取第一个 # 标题作为文章标题，其余作为正文
  const handleMdImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n');
      const h1Match = text.match(/^#\s+(.+)$/m);
      if (h1Match && !title.trim()) {
        setTitle(h1Match[1].trim());
        const idx = lines.findIndex((l) => l.startsWith('# '));
        const body =
          idx >= 0
            ? lines
                .slice(idx + 1)
                .join('\n')
                .trim()
            : text;
        setContent(body);
      } else {
        // 以 markdown 语法块插入到光标位置
        const ta = textareaRef.current;
        if (ta) {
          const start = ta.selectionStart;
          const newContent = content.substring(0, start) + text + content.substring(ta.selectionEnd);
          setContent(newContent);
        } else {
          setContent(content ? content + '\n' + text : text);
        }
      }
      showToast('✓ Markdown 文件已导入');
    };
    reader.readAsText(file);
    e.target.value = ''; // 允许重复导入同一文件
  };

  const statusColor = saveStatus === 'published' ? '#b44dff' : saveStatus === 'saved' ? '#00ff88' : '#00ff88';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <ParticleBackground />

      {/* 顶部导航栏 */}
      <nav
        className="glass fixed top-0 right-0 left-0 z-100 border-b transition-all duration-300"
        style={{
          borderBottomColor: scrolled ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.06)',
          boxShadow: scrolled ? '0 1px 20px rgba(0,229,255,0.08)' : 'none',
        }}
      >
        <div className="mx-auto flex items-center justify-between px-6" style={{ maxWidth: '1440px', height: '64px' }}>
          <Link
            to="/"
            className="gradient-text relative text-[1.6rem] font-extrabold tracking-[1px]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            KevinBlog
            <span
              className="absolute left-0"
              style={{
                bottom: '-4px',
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, #00e5ff, #b44dff)',
                borderRadius: '1px',
              }}
            />
          </Link>
          <Link
            to="/"
            className="group inline-flex items-center gap-1 text-[0.88rem] font-semibold text-[#9090a8] transition-all duration-300 hover:text-[#00e5ff]"
          >
            <span className="text-[1.1rem] transition-transform group-hover:-translate-x-[3px]">&larr;</span> 返回首页
          </Link>
        </div>
      </nav>

      {/* 编辑内容区域 */}
      <main style={{ paddingTop: '64px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>
          <div className="card mt-6 mb-5 flex items-center justify-between px-6 py-3">
            <span
              className="flex items-center gap-2 text-base font-bold tracking-[1px] text-[#9090a8]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              &#9998; <span className="text-[#00e5ff]">KevinBlog</span> / {isEditing ? '编辑文章' : '编辑器'}
            </span>
            <div className="flex items-center gap-2.5">
              {/* 隐藏的文件选择器 —— 导入 .md  */}
              <input
                ref={mdFileRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                onChange={handleMdImport}
                className="hidden"
              />
              <button
                onClick={() => mdFileRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-transparent px-[18px] py-2 text-[0.85rem] font-semibold text-[#9090a8] transition-all hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]"
                style={{ fontFamily: 'inherit' }}
              >
                &#128194; 导入 MD
              </button>
              <button
                onClick={saveDraft}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[20px] border border-[rgba(255,109,58,0.3)] bg-transparent px-[18px] py-2 text-[0.85rem] font-semibold text-[#ff6d3a] transition-all hover:border-[#ff6d3a] hover:bg-[rgba(255,109,58,0.08)] hover:shadow-[0_0_12px_rgba(255,109,58,0.1)]"
                style={{ fontFamily: 'inherit' }}
              >
                &#128190; 保存草稿{' '}
                <span className="ml-1 text-[0.72rem] text-[#606078]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Ctrl+S
                </span>
              </button>
              <button
                onClick={() => setMobileShowPreview(!mobileShowPreview)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-transparent px-[18px] py-2 text-[0.85rem] font-semibold text-[#9090a8] transition-all hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)] lg:hidden"
                style={{ fontFamily: 'inherit' }}
              >
                &#128065; {mobileShowPreview ? '编辑' : '预览'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[20px] border-none px-[18px] py-2 text-[0.85rem] font-bold text-white transition-all hover:-translate-y-px hover:shadow-[0_0_20px_rgba(0,229,255,0.3),0_0_40px_rgba(180,77,255,0.15)] disabled:opacity-60"
                style={{ fontFamily: 'inherit', background: 'linear-gradient(135deg, #00e5ff, #b44dff)' }}
              >
                &#9889; {publishing ? (isEditing ? '更新中...' : '发布中...') : isEditing ? '更新文章' : '发布文章'}
              </button>
            </div>
          </div>

          {/* Editor Body: Split Panes */}
          <div
            className="mb-5 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2"
            style={{ minHeight: 'calc(100vh - 320px)' }}
          >
            {/* Left: Editor Pane */}
            <div className={`card flex flex-col overflow-hidden ${mobileShowPreview ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3.5">
                <span
                  className="flex items-center gap-2 text-[0.82rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#00e5ff]" style={{ boxShadow: '0 0 8px #00e5ff' }} />{' '}
                  Markdown 编辑
                </span>
                <span className="text-[0.76rem] text-[#606078]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {chars} 字
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    标题
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入文章标题..."
                    maxLength={200}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-2.5 text-[0.95rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                  />
                </div>

                {/* Category + Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      分类
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-2.5 text-[0.95rem] text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239090a8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 14px center',
                      }}
                    >
                      {catOptions.map((o) => (
                        <option key={o.value} value={o.value} style={{ background: '#111118', color: '#e0e0e8' }}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      日期
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-2.5 text-[0.95rem] text-[#e0e0e8] transition-all outline-none focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                    />
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    标签
                  </label>
                  <div className="flex min-h-[44px] cursor-text flex-wrap items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2 transition-all focus-within:border-[#00e5ff] focus-within:shadow-[0_0_12px_rgba(0,229,255,0.12)]">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-[14px] border border-[rgba(0,229,255,0.2)] bg-[rgba(0,229,255,0.1)] px-3 py-1 text-[0.82rem] text-[#00e5ff]"
                        style={{ fontFamily: 'var(--font-mono)', animation: 'tagIn 0.2s ease-out' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(i)}
                          className="cursor-pointer border-none bg-transparent text-[0.9rem] leading-none text-[#00e5ff] opacity-60 hover:opacity-100"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                        if (e.key === 'Backspace' && !tagInput && tags.length > 0) removeTag(tags.length - 1);
                      }}
                      placeholder={tags.length < 10 ? '输入标签后按 Enter 添加...' : ''}
                      disabled={tags.length >= 10}
                      className="min-w-[100px] flex-1 border-none bg-transparent text-[0.9rem] text-[#e0e0e8] outline-none placeholder:text-[#606078] disabled:opacity-40"
                      style={{ fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Excerpt / 文章摘要 */}
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    摘要
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value.slice(0, 150))}
                    rows={2}
                    maxLength={150}
                    placeholder="文章的简短摘要，将显示在首页卡片中（不超过 150 字）..."
                    className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-2.5 text-[0.92rem] text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.12)]"
                  />
                  <span className="text-right text-[0.72rem] text-[#606078]">{excerpt.length}/150</span>
                </div>

                {/* Markdown Editor */}
                <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                  <label
                    className="text-[0.78rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    正文 (Markdown)
                  </label>

                  {/* Markdown 工具栏 */}
                  <div className="-mb-1 flex flex-wrap gap-1">
                    {([
                      ['B', '**粗体**'],
                      ['I', '*斜体*'],
                      ['S', '~~删除线~~'],
                      ['H', '## 标题'],
                      ['-', '- 列表'],
                      ['1.', '1. 有序列表'],
                      ['[]', '[链接](url)'],
                      ['img', '![图片](url)'],
                      ['`', '`代码`'],
                      ['```', '```\n代码块\n```'],
                      ['>', '> 引用'],
                      ['---', '\n---\n'],
                    ] as [string, string][]).map(([label, syntax]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const ta = textareaRef.current;
                          if (!ta) return;
                          const start = ta.selectionStart;
                          const end = ta.selectionEnd;
                          const before = content.substring(0, start);
                          const sel = content.substring(start, end);
                          // 有选中文字时包住选中内容，无选中时插入模板
                          let insert = syntax;
                          if (sel && syntax.includes('*') && syntax.includes('粗体')) insert = `**${sel}**`;
                          else if (sel && syntax.includes('*斜体')) insert = `*${sel}*`;
                          else if (sel && syntax.includes('删除线')) insert = `~~${sel}~~`;
                          else if (sel && syntax.includes('`代码`')) insert = `\`${sel}\``;
                          else if (sel && syntax.includes('链接')) insert = `[${sel}](url)`;
                          else if (sel && syntax.includes('图片')) insert = `![${sel}](url)`;
                          else if (sel && syntax.includes('代码块')) insert = `\`\`\`\n${sel}\n\`\`\``;
                          else if (sel && syntax.includes('>')) insert = `> ${sel}`;
                          const newContent = before + insert + content.substring(end);
                          setContent(newContent);
                          setTimeout(() => {
                            ta.focus();
                            const pos = start + insert.length;
                            ta.selectionStart = ta.selectionEnd = pos;
                          }, 0);
                        }}
                        className="rounded px-2.5 py-1 text-[0.78rem] font-semibold text-[#606078] border border-[rgba(255,255,255,0.06)] bg-transparent cursor-pointer transition-all hover:border-[#00e5ff] hover:text-[#00e5ff] hover:bg-[rgba(0,229,255,0.04)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                        title={syntax}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const s = e.currentTarget;
                        const st = s.selectionStart;
                        s.value = s.value.substring(0, st) + '  ' + s.value.substring(s.selectionEnd);
                        s.selectionStart = s.selectionEnd = st + 2;
                      }
                    }}
                    // 粘贴图片上传：只拦截图片，文本粘贴交给浏览器原生处理
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (items)
                        for (const item of Array.from(items)) {
                          if (item.type.startsWith('image/')) {
                            e.preventDefault();
                            handleImageUpload(item.getAsFile()!);
                            break;
                          }
                        }
                    }}
                    // 拖拽图片上传：只有拖入图片文件时才拦截并上传，文本拖入走浏览器原生行为
                    onDrop={(e) => {
                      const f = e.dataTransfer?.files?.[0];
                      if (f && f.type.startsWith('image/')) {
                        e.preventDefault();
                        handleImageUpload(f);
                      }
                    }}
                    onDragOver={(e) => {
                      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
                    }}
                    placeholder={`在此输入 Markdown 内容...\n\n支持标准 Markdown 语法：\n# 标题\n## 二级标题\n- 无序列表\n1. 有序列表\n> 引用\n\`行内代码\`\n\`\`\`代码块\`\`\`\n![图片](url)\n[链接](url)\n---\n| 表格 |\n\n&#128247; 支持粘贴/拖拽上传图片`}
                    className="w-full flex-1 resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0d0d14] p-4 text-[0.92rem] leading-[1.7] text-[#d0d0e0] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:shadow-[0_0_12px_rgba(0,229,255,0.1)]"
                    style={{ fontFamily: 'var(--font-mono)', tabSize: '2', minHeight: '300px' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Preview Pane */}
            <div className={`card flex flex-col overflow-hidden ${mobileShowPreview ? 'flex' : 'hidden lg:flex'}`}>
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3.5">
                <span
                  className="flex items-center gap-2 text-[0.82rem] font-semibold tracking-[1px] text-[#606078] uppercase"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#b44dff]" style={{ boxShadow: '0 0 8px #b44dff' }} />{' '}
                  实时预览
                </span>
                <span className="text-[0.76rem] text-[#606078]" style={{ fontFamily: 'var(--font-mono)' }}>
                  预计 {readMin} 分钟
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-8">
                {!title && !content.trim() ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-[0.9rem] text-[#606078]">
                    <div className="text-[3rem] opacity-30">&#128221;</div>
                    <p className="text-center leading-[1.6]">
                      在左侧编辑区输入 Markdown 内容
                      <br />
                      此处将实时渲染预览
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto max-w-[720px]">
                    {title && (
                      <div className="mb-4">
                        <h1 className="gradient-text mb-4 text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.35] font-extrabold tracking-[-0.5px]">
                          {title}
                        </h1>
                        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-6 text-[0.84rem] text-[#606078]">
                          {category && (
                            <span
                              className="inline-block rounded-[14px] border border-[rgba(0,229,255,0.2)] bg-[rgba(0,229,255,0.12)] px-3.5 py-[3px] text-[0.75rem] font-semibold tracking-[1px] text-[#00e5ff]"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              {category}
                            </span>
                          )}
                          <span style={{ fontFamily: 'var(--font-mono)' }}>
                            {new Date(date).toLocaleDateString('zh-CN')}
                          </span>
                          <span className="inline-flex items-center gap-1">&#9202; {readMin} 分钟阅读</span>
                        </div>
                      </div>
                    )}
                    <MarkdownRenderer content={content} />
                    {tags.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-2 border-t border-[rgba(255,255,255,0.06)] pt-6">
                        {tags.map((t, i) => (
                          <span
                            key={i}
                            className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3.5 py-1.5 text-[0.8rem] text-[#606078]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div
            className="card mb-6 flex items-center justify-between px-6 py-2.5 text-[0.8rem] text-[#606078]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                />
                <span>{saveStatus === 'published' ? '已发布' : saveStatus === 'saved' ? '已保存' : '已就绪'}</span>
              </span>
              <span>字数: {words}</span>
              <span>字符: {chars}</span>
            </div>
            <div className="flex items-center gap-5">
              <span>预计阅读: {readMin} 分钟</span>
              <span>{lastSaved ? `上次保存: ${lastSaved}` : '未保存'}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      <div
        className={`card pointer-events-none fixed right-6 bottom-20 z-[999] rounded-lg border border-[rgba(0,229,255,0.25)] px-6 py-3 text-[0.88rem] font-semibold text-[#00e5ff] transition-all duration-300 ${toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
        style={{ boxShadow: '0 0 30px rgba(0,229,255,0.15), 0 0 60px rgba(180,77,255,0.08)' }}
      >
        {toastMsg}
      </div>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

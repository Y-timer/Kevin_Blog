import { useState } from 'react';
import type { Comment } from '../../types';

interface CommentSectionProps {
  comments: Comment[];
  isAuthenticated: boolean;
  onAdd: (content: string, parentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  currentUserId?: string;
  postAuthorId?: string;
}

const avClasses = [
  'bg-gradient-to-br from-[#00e5ff] to-[#0088cc]',
  'bg-gradient-to-br from-[#b44dff] to-[#6a1b9a]',
  'bg-gradient-to-br from-[#ff6d3a] to-[#c41c00]',
  'bg-gradient-to-br from-[#00ff88] to-[#007a3d]',
];

// 组织评论层级：顶级 + 回复 map
function nestComments(all: Comment[]) {
  const top: Comment[] = [];
  const replies: Record<string, Comment[]> = {};
  all.forEach((c) => {
    if ((c as any).parentId) {
      const pid = (c as any).parentId;
      if (!replies[pid]) replies[pid] = [];
      replies[pid].push(c);
    } else {
      top.push(c);
    }
  });
  return { top, replies };
}

function ReplyItem({ comment, i, onDelete, currentUserId, postAuthorId }: {
  comment: Comment; i: number; onDelete: (id: string) => Promise<void>; currentUserId?: string; postAuthorId?: string;
}) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="relative mt-3 ml-12 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
      {/* 左边连接线装饰 */}
      <div className="absolute left-[-16px] top-[18px] h-3 w-3 rounded-bl border-b-2 border-l-2 border-[rgba(255,255,255,0.06)]" />
      <div className="mb-2 flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.78rem] font-bold text-white ${avClasses[(i + 1) % avClasses.length]}`}>
          {comment.user?.username?.slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-text-primary">
            {comment.user?.username || '用户'}
            {comment.userId === postAuthorId && <span className="text-[0.7rem] text-accent-purple">作者</span>}
          </div>
          <div className="text-[0.76rem] text-text-muted font-(--font-mono)" style={{ fontFamily: 'var(--font-mono)' }}>
            {new Date(comment.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
        {currentUserId === comment.userId && (
          <button onClick={async () => { setDeleting(true); try { await onDelete(comment.id); } catch {} setDeleting(false); }}
            disabled={deleting} className="text-xs text-[#606078] transition-colors hover:text-[#ff2d95]">{deleting ? '...' : '删除'}</button>
        )}
      </div>
      <p className="text-[0.9rem] leading-[1.7] text-[#c0c0ce]">{comment.content}</p>
    </div>
  );
}

function CommentItem({
  comment, i, replies, isAuthenticated, onAdd, onDelete, currentUserId, postAuthorId,
}: {
  comment: Comment; i: number; replies?: Comment[]; isAuthenticated: boolean;
  onAdd: (content: string, parentId?: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
  currentUserId?: string; postAuthorId?: string;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(true); // 子回复展开/收起

  const handleReply = async () => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    try { await onAdd(replyContent.trim(), comment.id); setReplyContent(''); setShowReply(false); setRepliesOpen(true); } catch {}
    setSubmitting(false);
  };

  const replyCount = replies?.length || 0;

  return (
    <div className="card mb-4 px-6 py-5.5 transition-all duration-300 hover:border-[rgba(255,255,255,0.1)]">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.82rem] font-bold text-white ${avClasses[i % avClasses.length]}`}>
          {comment.user?.username?.slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-[0.92rem] font-semibold text-text-primary">
            {comment.user?.username || '用户'}
            {comment.userId === postAuthorId && <span className="text-[0.7rem] text-accent-purple">作者</span>}
          </div>
          <div className="text-[0.78rem] text-text-muted font-(--font-mono)" style={{ fontFamily: 'var(--font-mono)' }}>
            {new Date(comment.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
        {currentUserId === comment.userId && (
          <button onClick={async () => { setDeleting(true); try { await onDelete(comment.id); } catch {} setDeleting(false); }}
            disabled={deleting} className="text-xs text-[#606078] transition-colors hover:text-[#ff2d95]">{deleting ? '...' : '删除'}</button>
        )}
      </div>
      <p className="text-[0.92rem] leading-[1.7] text-[#c0c0ce]">{comment.content}</p>

      {/* Reply button + toggle */}
      <div className="mt-2 flex items-center gap-3">
        {isAuthenticated && (
          <button onClick={() => setShowReply(!showReply)} className="text-xs text-[#606078] hover:text-[#00e5ff] transition-colors">
            {showReply ? '取消回复' : '回复'}
          </button>
        )}
        {replyCount > 0 && (
          <button onClick={() => setRepliesOpen(!repliesOpen)} className="text-xs text-[#606078] hover:text-[#00e5ff] transition-colors">
            {repliesOpen ? '收起回复' : `展开 ${replyCount} 条回复`}
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReply && (
        <div className="mt-3">
          <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={2}
            placeholder={`回复 ${comment.user?.username || '用户'}...`}
            className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-2.5 text-sm text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]" />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setShowReply(false)} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-transparent px-4 py-1.5 text-xs text-[#9090a8] transition-all hover:border-[#00e5ff] hover:text-[#00e5ff]">取消</button>
            <button onClick={handleReply} disabled={!replyContent.trim() || submitting}
              className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? '提交中...' : '回复'}
            </button>
          </div>
        </div>
      )}

      {/* Nested replies —— 包裹在主评论卡片内部 */}
      {repliesOpen && replyCount > 0 && (
        <div className="mt-1">
          {replies!.map((r, ri) => (
            <ReplyItem key={r.id} comment={r} i={ri} onDelete={onDelete} currentUserId={currentUserId} postAuthorId={postAuthorId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({
  comments, isAuthenticated, onAdd, onDelete, currentUserId, postAuthorId,
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { top, replies } = nestComments(comments);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try { await onAdd(content.trim()); setContent(''); } catch {}
    setSubmitting(false);
  };

  return (
    <section className="mb-12" id="comments">
      <h2 className="mb-7 border-l-[3px] border-accent-cyan pl-4 text-[1.3rem] font-bold">评论 ({comments.length})</h2>

      {isAuthenticated && (
        <div className="card mb-5 p-5">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3}
            placeholder="写下你的评论..."
            className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111118] px-4 py-3 text-sm text-[#e0e0e8] transition-all outline-none placeholder:text-[#606078] focus:border-[#00e5ff] focus:shadow-[0_0_16px_rgba(0,229,255,0.15)]" />
          <div className="mt-3 flex justify-end">
            <button onClick={handleSubmit} disabled={!content.trim() || submitting}
              className="rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#b44dff] px-5 py-2 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? '提交中...' : '发表评论'}
            </button>
          </div>
        </div>
      )}

      {top.length === 0 && <p className="py-8 text-center text-sm text-[#606078]">暂无评论</p>}

      {top.map((comment, i) => (
        <CommentItem key={comment.id} comment={comment} i={i}
          replies={replies[comment.id]} isAuthenticated={isAuthenticated} onAdd={onAdd} onDelete={onDelete} currentUserId={currentUserId} postAuthorId={postAuthorId} />
      ))}
    </section>
  );
}

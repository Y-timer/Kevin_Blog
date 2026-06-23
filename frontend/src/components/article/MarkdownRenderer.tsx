import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTextFromNode, slugifyHeading } from '../../utils/toc';

function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0d0d14]">
      <div
        className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0f0f19] px-4 py-2.5 text-[0.78rem] text-[#606078]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#00e5ff]" />
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[0.74rem] transition-all duration-300 hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.1)]"
          style={{
            fontFamily: 'var(--font-mono)',
            borderColor: copied ? '#00ff88' : undefined,
            color: copied ? '#00ff88' : undefined,
            background: copied ? 'rgba(0,255,136,0.06)' : undefined,
          }}
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre
        className="m-0 overflow-x-auto p-5 text-[0.88rem] leading-[1.65] text-[#d0d0e0]"
        style={{ fontFamily: 'var(--font-mono)', tabSize: '4', overflowWrap: 'anywhere', wordBreak: 'break-all' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div id="articleContent" className="text-[1.05rem] leading-[1.9] text-[#e0e0e8]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = getTextFromNode(children);
            const id = slugifyHeading(text);
            return (
              <h2
                id={id}
                className="relative mt-12 mb-4 border-b border-[rgba(255,255,255,0.06)] pb-2.5 text-[1.6rem] font-bold"
                style={{ scrollMarginTop: '90px' }}
              >
                {children}
                <span
                  className="absolute left-0"
                  style={{ bottom: '-1px', width: '60px', height: '2px', background: '#00e5ff', borderRadius: '1px' }}
                />
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = getTextFromNode(children);
            const id = slugifyHeading(text);
            return (
              <h3
                id={id}
                className="mt-9 mb-3 text-[1.28rem] font-bold text-[#00e5ff]"
                style={{ scrollMarginTop: '90px' }}
              >
                {children}
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="mb-5 text-justify break-words text-[#c8c8d4]" style={{ overflowWrap: 'anywhere' }}>
              {children}
            </p>
          ),
          strong: ({ children }) => <strong className="font-bold text-[#e0e0e8]">{children}</strong>,
          ul: ({ children }) => <ul className="my-4 mb-5 ml-6 list-disc text-[#c8c8d4]">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 mb-5 ml-6 list-decimal text-[#c8c8d4]">{children}</ol>,
          li: ({ children }) => <li className="mb-2 pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="relative my-7 rounded-r-lg border-l-[3px] border-[#b44dff] bg-[rgba(180,77,255,0.05)] px-7 py-5 text-[#9090a8] italic">
              <span
                className="absolute top-2 left-3.5 text-[2.5rem] leading-none text-[rgba(180,77,255,0.2)]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                &ldquo;
              </span>
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="rounded border border-[rgba(0,229,255,0.1)] bg-[rgba(0,229,255,0.08)] px-2 py-0.5 text-[0.9em] text-[#00e5ff]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1]}>{String(children)}</CodeBlock>;
          },
          pre: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <div className="my-7">
              <img
                src={src}
                alt={alt || ''}
                className="w-full rounded-xl border border-[rgba(255,255,255,0.06)]"
                loading="lazy"
              />
              {alt && <p className="mt-2 text-center text-[0.82rem] text-[#606078] italic">{alt}</p>}
            </div>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-[0.9rem]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[rgba(255,255,255,0.08)] bg-[#111118] px-4 py-2 text-left font-semibold text-[#e0e0e8]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[rgba(255,255,255,0.06)] px-4 py-2 text-[#9090a8]">{children}</td>
          ),
          hr: () => <hr className="my-8 border-[rgba(255,255,255,0.06)]" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

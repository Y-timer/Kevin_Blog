import { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export default function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

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
        className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0f0f19] px-4 py-2.5 text-[0.78rem] font-[var(--font-mono)] text-[#606078]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#00e5ff]" />
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[0.74rem] font-[var(--font-mono)] transition-all duration-300 hover:border-[#00e5ff] hover:bg-[rgba(0,229,255,0.06)] hover:text-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.1)]"
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
        style={{ fontFamily: 'var(--font-mono)', tabSize: '4' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

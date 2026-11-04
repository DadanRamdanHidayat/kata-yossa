import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Menampilkan balasan AI (Markdown) dengan gaya yang sama dengan aplikasi.
// HTML mentah tidak dirender, jadi aman untuk teks dari AI.
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
        h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-bold text-navy first:mt-0">{children}</h3>,
        h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-bold text-navy first:mt-0">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-bold text-navy first:mt-0">{children}</h4>,
        h4: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-semibold text-navy first:mt-0">{children}</h4>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-slate-300 pl-3 text-slate-600 last:mb-0">{children}</blockquote>
        ),
        hr: () => <hr className="my-3 border-slate-200" />,
        table: ({ children }) => (
          <div className="mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100 last:mb-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-100">
            {children}
          </pre>
        ),
        code: ({ children, className }) => (
          <code className={`${className ?? ""} rounded bg-slate-100 px-1 py-0.5 text-[0.85em]`}>{children}</code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

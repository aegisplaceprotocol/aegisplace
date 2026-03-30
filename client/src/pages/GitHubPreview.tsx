import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

export default function GitHubPreview() {
  const [md, setMd] = useState("");

  useEffect(() => {
    fetch("/GITHUB-README.md")
      .then(r => r.text())
      .then(setMd)
      .catch(() => setMd("Failed to load README."));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-[900px] px-6 lg:px-8">
          {/* GitHub-style header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#30363d]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>
            <span className="text-sm text-[#8b949e]">README.md</span>
            <span className="ml-auto text-xs text-[#8b949e] border border-[#30363d] rounded px-2 py-0.5">Preview</span>
          </div>

          {/* Render markdown as GitHub-styled HTML */}
          <div className="github-markdown" dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(md)) }} />
        </div>
      </div>
      <Footer />

      <style>{`
        .github-markdown {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: #e6edf3;
        }
        .github-markdown h1 {
          font-size: 2em;
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #30363d;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .github-markdown h2 {
          font-size: 1.5em;
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #30363d;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .github-markdown h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .github-markdown p { margin-bottom: 16px; }
        .github-markdown a { color: #58a6ff; text-decoration: none; }
        .github-markdown a:hover { text-decoration: underline; }
        .github-markdown strong { color: #f0f6fc; }
        .github-markdown code {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 2px 6px;
          font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
          font-size: 85%;
        }
        .github-markdown pre {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .github-markdown pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 85%;
          line-height: 1.45;
        }
        .github-markdown table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 16px;
        }
        .github-markdown th, .github-markdown td {
          border: 1px solid #30363d;
          padding: 6px 13px;
          text-align: left;
        }
        .github-markdown th {
          background: #161b22;
          font-weight: 600;
        }
        .github-markdown tr:nth-child(even) { background: rgba(22,27,34,0.5); }
        .github-markdown hr {
          border: 0;
          border-top: 1px solid #30363d;
          margin: 24px 0;
        }
        .github-markdown ul, .github-markdown ol {
          padding-left: 2em;
          margin-bottom: 16px;
        }
        .github-markdown li { margin-bottom: 4px; }
        .github-markdown img { max-width: 100%; border-radius: 6px; }
        .github-markdown blockquote {
          border-left: 4px solid #30363d;
          padding: 0 16px;
          color: #8b949e;
          margin-bottom: 16px;
        }
        .github-markdown .center { text-align: center; }
        .github-markdown img[src*="shields.io"] {
          display: inline-block;
          margin: 2px 4px;
        }
      `}</style>
    </div>
  );
}

/* Strip dangerous HTML tags and attributes from rendered output */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<button\b[^>]*>/gi, '');
}

/* Simple markdown → HTML renderer (no deps) */
function renderMarkdown(md: string): string {
  if (!md) return "";

  let html = md
    // HTML passthrough (div, img, badges)
    .replace(/<div align="center">/g, '<div class="center">')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre><code class="language-${lang}">${esc(code.trim())}</code></pre>`)
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // HR
    .replace(/^---$/gm, '<hr/>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Images (badges)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '<!--sep-->';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')

  // Wrap table rows
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table><thead>$1</thead></table>')
    .replace(/<!--sep-->\n?/g, '')

  // Wrap lists
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')

  return `<p>${html}</p>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

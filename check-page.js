const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app', '(app)', 'documents', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const oldLine = lines[399];
console.log('Line 400:', oldLine);

const newLines = [
"        <button",
"          onClick={async () => {",
"            try {",
"              const res = await fetch('/api/pdf?id=' + quote.id)",
"              const blob = await res.blob()",
"              const file = new File([blob], quote.quote_number + '.pdf', { type: 'application/pdf' })",
"              if (navigator.share) {",
"                await navigator.share({ files: [file], title: quote.quote_number })",
"              } else {",
"                const url = URL.createObjectURL(blob)",
"                const a = document.createElement('a')",
"                a.href = url",
"                a.download = quote.quote_number + '.pdf'",
"                document.body.appendChild(a)",
"                a.click()",
"                document.body.removeChild(a)",
"                URL.revokeObjectURL(url)",
"              }",
"            } catch(e) {",
"              window.open('/api/pdf?id=' + quote.id, '_blank')",
"            }",
"          }}",
"          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--purple-bg)', border: 'none', borderRadius: 12, padding: '10px 8px', cursor: 'pointer', width: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}",
"        >",
"          <svg width='20' height='20' viewBox='0 0 20 20' fill='none'><path d='M10 2v11M6 9l4 4 4-4' stroke='#6c47ff' strokeWidth='1.5' strokeLinecap='round'/><path d='M4 15h12' stroke='#6c47ff' strokeWidth='1.5' strokeLinecap='round'/></svg>",
"          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textAlign: 'center', lineHeight: 1.2 }}>PDF</span>",
"        </button>",
];

lines.splice(399, 4, ...newLines);
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Done. New line 400:', lines[399]);
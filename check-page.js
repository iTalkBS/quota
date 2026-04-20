const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app', '(app)', 'documents', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const newCode = [
"              const res = await fetch('/api/pdf?id=' + quote.id)",
"              const blob = await res.blob()",
"              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)",
"              if (isMobile && navigator.share) {",
"                const file = new File([blob], quote.quote_number + '.pdf', { type: 'application/pdf' })",
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
];

lines.splice(402, 17, ...newCode);
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Done. Lines now around 402:');
for(let i = 400; i < 420; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
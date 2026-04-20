const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app', '(app)', 'documents', '[id]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.splice(419, 0, "            } catch(e) {");
lines.splice(420, 0, "              window.open('/api/pdf?id=' + quote.id, '_blank')");
lines.splice(421, 0, "            }");

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed. Lines 417-423:');
for(let i = 416; i < 424; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
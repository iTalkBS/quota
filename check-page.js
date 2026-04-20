const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', '(app)', 'documents', '[id]', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('');
console.log('Lines 220-235:');
for(let i = 219; i < 235; i++) {
  console.log((i+1) + ': ' + lines[i]);
}

console.log('');
console.log('Lines 1-20:');
for(let i = 0; i < 20; i++) {
  console.log((i+1) + ': ' + lines[i]);
}
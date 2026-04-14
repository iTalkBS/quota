const fs = require('fs');

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#6c47ff"/>
  <rect x="100" y="148" width="312" height="40" rx="20" fill="white"/>
  <rect x="100" y="236" width="234" height="40" rx="20" fill="white" opacity="0.8"/>
  <rect x="100" y="324" width="156" height="40" rx="20" fill="white" opacity="0.6"/>
</svg>`;

fs.writeFileSync('public/icon.svg', svg);
console.log('Icon created successfully');
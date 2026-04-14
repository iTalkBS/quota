const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/icon.svg');

sharp(svg)
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png', (err) => {
    if (err) console.error('192 error:', err);
    else console.log('icon-192.png created');
  });

sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png', (err) => {
    if (err) console.error('512 error:', err);
    else console.log('icon-512.png created');
  });
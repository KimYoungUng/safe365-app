const fs = require('fs');
const path = require('path');

const colorMap = {
  '#7c3aed': '#3b82f6', // primary purple -> blue-500
  '#8b5cf6': '#60a5fa', // lighter purple -> blue-400
  '#a78bfa': '#93c5fd', // blue-300
  '#c4b5fd': '#bfdbfe', // blue-200
  '#e9d5ff': '#dbeafe', // blue-100
  '#ede9fe': '#dbeafe', // blue-100
  '#f5f3ff': '#eff6ff', // blue-50
  '#7e22ce': '#1d4ed8', // dark purple -> blue-700
  'rgba(124, 58, 237,': 'rgba(59, 130, 246,', // box-shadow alpha
  'rgba(124,58,237,': 'rgba(59,130,246,',
  'rgba(139, 92, 246,': 'rgba(96, 165, 250,'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function replaceColorsInFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Case insensitive replacement for hex codes
  for (const [key, value] of Object.entries(colorMap)) {
    const regex = new RegExp(key.replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'gi');
    content = content.replace(regex, value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated colors in: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'src'), replaceColorsInFile);
console.log('Color replacement complete.');

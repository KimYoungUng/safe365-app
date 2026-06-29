const fs = require('fs');

const path = 'src/pages/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/fontSize: '13px'/g, "fontSize: '16px'");

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing font size in Dashboard');

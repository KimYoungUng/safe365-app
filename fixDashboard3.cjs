const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// Fix the span wrapper for the dashboard buttons
content = content.replace(/<span style={{ fontSize: '16px', fontWeight: 'bold' }}>([\s\S]*?)<\/span>/g, "<div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>$1</div>");

// Fix the emergency button text
content = content.replace(/긴급 작업중지 발령 \(전 직원 알림\)/g, "<div style={{ textAlign: 'center' }}>긴급 작업중지 발령<br/><span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>(전 직원 알림)</span></div>");

fs.writeFileSync('src/pages/Dashboard.jsx', content, 'utf8');
console.log("Dashboard formatting fixed");

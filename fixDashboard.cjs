const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

content = content.replace(/style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '16px'/g, 
"style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line'");

// Also change the text inside to have \n for better breaking
content = content.replace(/>아차사고 접수</g, ">아차사고\\n접수<");
content = content.replace(/>안전의견 접수</g, ">안전의견\\n접수<");
content = content.replace(/>내 출퇴근 기록</g, ">내 출퇴근\\n기록<");
content = content.replace(/>내 급여명세서</g, ">내 급여\\n명세서<");
content = content.replace(/>내 근로계약서</g, ">내 근로\\n계약서<");
content = content.replace(/>연장근로신청</g, ">연장근로\\n신청<");

fs.writeFileSync('src/pages/Dashboard.jsx', content, 'utf8');
console.log("Dashboard buttons fixed");

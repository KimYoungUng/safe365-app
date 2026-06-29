const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

content = content.replace(/아차사고\\n접수/g, "아차사고<br/>접수");
content = content.replace(/안전의견\\n접수/g, "안전의견<br/>접수");
content = content.replace(/내 출퇴근\\n기록/g, "내 출퇴근<br/>기록");
content = content.replace(/내 급여\\n명세서/g, "내 급여<br/>명세서");
content = content.replace(/내 근로\\n계약서/g, "내 근로<br/>계약서");
content = content.replace(/연장근로\\n신청/g, "연장근로<br/>신청");

fs.writeFileSync('src/pages/Dashboard.jsx', content, 'utf8');
console.log("Dashboard buttons br fixed");

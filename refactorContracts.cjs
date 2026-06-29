const fs = require('fs');
const path = 'src/context/DataContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject fetch for contracts
const fetchContractsCode = `
      const { data: contractsData } = await supabase.from('contracts').select('*');
      if (contractsData && contractsData.length > 0) {
        setContracts(contractsData.map(c => ({
          id: c.id,
          userId: c.user_id,
          companyId: c.company_id,
          status: c.status,
          signatureDataUrl: c.signature_data_url,
          issuedAt: c.issued_at,
          ...c.contract_data
        })));
      }
`;

if (!content.includes("await supabase.from('contracts')")) {
  content = content.replace(
    "const fetchSupabaseData = async () => {",
    "const fetchSupabaseData = async () => {\n" + fetchContractsCode
  );
}

// 2. Patch requestSignature
content = content.replace(
  "const requestSignature = (userId, companyId, contractData) => {",
  "const requestSignature = async (userId, companyId, contractData) => {\n" +
  "    const newId = Date.now();\n" +
  "    await supabase.from('contracts').insert({\n" +
  "      id: newId, user_id: userId, company_id: companyId, status: '서명대기', contract_data: contractData, issued_at: new Date().toISOString().split('T')[0]\n" +
  "    });\n" +
  "    setContracts(prev => [...prev.filter(c => !(c.userId === userId && c.status === '서명대기')), { id: newId, userId, companyId, status: '서명대기', issuedAt: new Date().toISOString().split('T')[0], ...contractData }]);"
);

// 3. Patch signContract
content = content.replace(
  "const signContract = (contractId, signatureDataUrl) => {",
  "const signContract = async (contractId, signatureDataUrl) => {\n" +
  "    let fileUrl = signatureDataUrl;\n" +
  "    if (signatureDataUrl && signatureDataUrl.startsWith('data:')) {\n" +
  "       fileUrl = await uploadImageToSupabase(signatureDataUrl, 'signatures');\n" +
  "    }\n" +
  "    await supabase.from('contracts').update({ status: '서명완료', signature_data_url: fileUrl }).eq('id', contractId);\n" +
  "    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: '서명완료', signatureDataUrl: fileUrl } : c));"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Contracts refactored!');

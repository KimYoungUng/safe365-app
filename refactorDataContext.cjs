const fs = require('fs');

const path = 'src/context/DataContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
if (!content.includes("import { supabase }")) {
  content = content.replace("import { createContext, useState, useEffect } from 'react';", 
    "import { createContext, useState, useEffect } from 'react';\nimport { supabase } from '../supabaseClient';\nimport { uploadImageToSupabase } from '../utils/supabaseStorage';");
}

// 2. Add useEffect inside DataProvider
const useEffectCode = `
  useEffect(() => {
    const fetchSupabaseData = async () => {
      const { data: companiesData } = await supabase.from('companies').select('*');
      if (companiesData && companiesData.length > 0) {
        setCompanies(companiesData.map(c => ({...c, managerName: c.manager_name, managerPhone: c.manager_phone})));
      }
      
      const { data: tbmData } = await supabase.from('tbm_submissions').select('*');
      if (tbmData && tbmData.length > 0) {
        setTbmSubmissions(tbmData.map(t => ({...t, companyId: t.company_id, participantSignatures: t.participant_signatures})));
      }
      
      const { data: attData } = await supabase.from('attendances').select('*');
      if (attData && attData.length > 0) {
        setAttendances(attData.map(a => ({...a, clockIn: a.clock_in, clockOut: a.clock_out, userId: a.user_id, companyId: a.company_id})));
      }
      
      const { data: reportData } = await supabase.from('safety_reports').select('*');
      if (reportData && reportData.length > 0) {
        setSafetySuggestions(reportData.filter(r => r.type === 'suggestion').map(r => ({...r, companyId: r.company_id, userId: r.user_id, userName: r.user_name})));
        setNearMisses(reportData.filter(r => r.type === 'nearmiss').map(r => ({...r, companyId: r.company_id, userId: r.user_id, userName: r.user_name})));
      }
    };
    fetchSupabaseData();
  }, []);
`;

if (!content.includes("fetchSupabaseData")) {
  content = content.replace("export function DataProvider({ children }) {", "export function DataProvider({ children }) {\n" + useEffectCode);
}

// 3. Patch addCompany
content = content.replace(
  "const addCompany = (companyData) => {",
  "const addCompany = async (companyData) => {\n" +
  "    const newId = `company_${Date.now()}`;\n" +
  "    await supabase.from('companies').insert({ id: newId, name: companyData.name, representative: companyData.representative, contact: companyData.contact, status: '활성' });"
);

// 4. Patch submitTbm
content = content.replace(
  "const submitTbm = (userId, userName, companyId, date, type, title, data, files = []) => {",
  "const submitTbm = async (userId, userName, companyId, date, type, title, data, files = []) => {\n" +
  "    let uploadedFiles = [];\n" +
  "    if (files.length > 0) {\n" +
  "      const fileUrl = await uploadImageToSupabase(files[0], 'tbm_photos');\n" +
  "      if (fileUrl) uploadedFiles.push(fileUrl);\n" +
  "    }\n" +
  "    const newTbmId = Date.now();\n" +
  "    await supabase.from('tbm_submissions').insert({\n" +
  "      id: newTbmId, user_id: userId, user_name: userName, company_id: companyId, date, type, title, data, files: uploadedFiles, participant_signatures: []\n" +
  "    });"
);

// 5. Patch updateTbm
content = content.replace(
  "const updateTbm = (id, updatedFields) => {",
  "const updateTbm = async (id, updatedFields) => {\n" +
  "    if (updatedFields.participantSignatures) {\n" +
  "      await supabase.from('tbm_submissions').update({ participant_signatures: updatedFields.participantSignatures }).eq('id', id);\n" +
  "    }"
);

// 6. Patch addSafetySuggestion
content = content.replace(
  "const addSafetySuggestion = (userId, userName, companyId, title, content, location, isAnonymous, photo) => {",
  "const addSafetySuggestion = async (userId, userName, companyId, title, reportContent, location, isAnonymous, photo) => {\n" +
  "    let uploadedPhoto = null;\n" +
  "    if (photo) uploadedPhoto = await uploadImageToSupabase(photo, 'safety_reports');\n" +
  "    await supabase.from('safety_reports').insert({\n" +
  "      id: Date.now(), type: 'suggestion', user_id: userId, user_name: userName, company_id: companyId, title, content: reportContent, location, is_anonymous: isAnonymous, photo: uploadedPhoto, status: '접수됨', created_at: new Date().toISOString()\n" +
  "    });"
);
content = content.replace(/content,/g, "reportContent,");

// 7. Patch addNearMiss
content = content.replace(
  "const addNearMiss = (userId, userName, companyId, title, reportContent, location, isAnonymous) => {",
  "const addNearMiss = async (userId, userName, companyId, title, reportContent, location, isAnonymous) => {\n" +
  "    await supabase.from('safety_reports').insert({\n" +
  "      id: Date.now(), type: 'nearmiss', user_id: userId, user_name: userName, company_id: companyId, title, content: reportContent, location, is_anonymous: isAnonymous, status: '접수됨', created_at: new Date().toISOString()\n" +
  "    });"
);

// 8. Patch registerClockIn
content = content.replace(
  "const registerClockIn = (userId, dateStr, timeStr, status) => {",
  "const registerClockIn = async (userId, dateStr, timeStr, status) => {\n" +
  "    const newRecordId = Date.now();\n" +
  "    await supabase.from('attendances').insert({ id: newRecordId, user_id: userId, date: dateStr, clock_in: timeStr, status });"
);

// 9. Patch updateClockOut
content = content.replace(
  "const updateClockOut = (recordId, timeStr, status) => {",
  "const updateClockOut = async (recordId, timeStr, status) => {\n" +
  "    await supabase.from('attendances').update({ clock_out: timeStr, status }).eq('id', recordId);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('DataContext refactored!');

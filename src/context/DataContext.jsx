import { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { uploadImageToSupabase } from '../utils/supabaseStorage';
import { 
  MOCK_ATTENDANCES, 
  MOCK_LEAVES, 
  MOCK_OVERTIMES, 
  MOCK_NOTICES, 
  MOCK_MESSAGES, 
  MOCK_EDUCATIONS,
  MOCK_USER_EDUCATIONS,
  MOCK_PAYROLLS,
  MOCK_CONTRACTS,
  MOCK_SAFETY_CHECKLIST,
  MOCK_SAFETY_RESULTS,
  MOCK_COMPANIES,
  MOCK_SUBSCRIPTIONS,
  MOCK_PAYMENT_HISTORY,
  MOCK_TBM_SUBMISSIONS,
  MOCK_SAFETY_SUGGESTIONS,
  MOCK_NEAR_MISSES
} from '../mockData';
import { saveVideoFile, deleteVideoFile } from '../utils/dbHelper';


export const DataContext = createContext(null);

export function DataProvider({ children }) {

  useEffect(() => {
    const fetchSupabaseData = async () => {
      // 1. Companies
      const { data: companiesData } = await supabase.from('companies').select('*');
      if (companiesData) {
        const localTbmTemplates = JSON.parse(localStorage.getItem('tbm_templates_fallback') || '{}');
        setCompanies(companiesData.map(c => ({
          ...c, 
          managerName: c.manager_name, 
          managerPhone: c.manager_phone,
          tbm_template: c.tbm_template || localTbmTemplates[c.id],
          useSafetyFeature: c.use_safety_feature,
          useWorkFeature: c.use_work_feature,
          useEduFeature: c.use_edu_feature
        })));
      }

      // 2. Attendances
      const { data: attData } = await supabase.from('attendances').select('*');
      if (attData) {
        setAttendances(attData.map(a => ({...a, clockIn: a.clock_in, clockOut: a.clock_out, userId: a.user_id, companyId: a.company_id})));
      }

      // 3. Notices
      const { data: noticesData } = await supabase.from('notices').select('*');
      if (noticesData) {
        setNotices(noticesData.map(n => ({...n, companyId: n.company_id, targetCompanyId: n.target_company_id, fileName: n.file_name})));
      }

      // 4. Messages
      const { data: msgsData } = await supabase.from('messages').select('*');
      if (msgsData) {
        setMessages(msgsData.map(m => ({...m, senderId: m.sender_id, receiverId: m.receiver_id, companyId: m.company_id})));
      }

      // 5. Safety Reports (Suggestions & Near Misses)
      const { data: reportsData } = await supabase.from('safety_reports').select('*');
      if (reportsData) {
        const mappedReports = reportsData.map(r => ({
          ...r,
          userId: r.user_id,
          userName: r.user_name,
          companyId: r.company_id,
          reportContent: r.content,
          content: r.content,
          isAnonymous: r.is_anonymous,
          isPublic: r.is_public,
          createdAt: r.created_at,
          feedbackImage: r.feedback_image
        }));
        setSafetySuggestions(mappedReports.filter(r => r.type === 'suggestion'));
        setNearMisses(mappedReports.filter(r => r.type === 'nearmiss'));
      }

      // 7. TBM Submissions
      const { data: tbmData } = await supabase.from('tbm_submissions').select('*');
      if (tbmData && tbmData.length > 0) {
        setTbmSubmissions(tbmData.map(t => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name,
          companyId: t.company_id,
          date: t.date,
          type: t.type,
          title: t.title,
          data: typeof t.data === 'string' ? JSON.parse(t.data) : t.data,
          files: (typeof t.files === 'string' ? JSON.parse(t.files) : t.files) || [],
          participantSignatures: (typeof t.participant_signatures === 'string' ? JSON.parse(t.participant_signatures) : t.participant_signatures) || []
        })));
      } else {
        setTbmSubmissions(MOCK_TBM_SUBMISSIONS);
      }

      // 7-2. Safety Checklist Results
      const { data: safetyData } = await supabase.from('safety_results').select('*');
      if (safetyData && safetyData.length > 0) {
        setSafetyResults(safetyData.map(r => ({
          id: r.id,
          userId: r.user_id,
          date: r.date,
          isPerfect: r.is_perfect,
          items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
        })));
      } else {
        setSafetyResults(MOCK_SAFETY_RESULTS);
      }

      // 8. Leaves & Overtimes
      const { data: leavesData } = await supabase.from('leaves').select('*');
      if (leavesData) setLeaves(leavesData.map(l => ({...l, userId: l.user_id, startDate: l.start_date, endDate: l.end_date})));
      
      const { data: overtimesData } = await supabase.from('overtimes').select('*');
      if (overtimesData) setOvertimes(overtimesData.map(o => ({...o, userId: o.user_id, startTime: o.start_time, endTime: o.end_time})));

      // 9. Subscriptions
      const { data: subsData } = await supabase.from('subscriptions').select('*');
      if (subsData) {
        setSubscriptions(subsData.map(s => ({
          ...s,
          companyId: s.company_id,
          nextBillingDate: s.next_billing_date
        })));
      }
      // 10. Missing Tables
      const { data: eduData } = await supabase.from('educations').select('*');
      if (eduData) setEducations(eduData.map(e => ({...e, companyId: e.company_id, startDate: e.start_date, endDate: e.end_date, videoUrl: e.video_url, cutLine: e.cut_line, quizzes: typeof e.quizzes === 'string' ? JSON.parse(e.quizzes) : e.quizzes})));

      const { data: userEduData } = await supabase.from('user_educations').select('*');
      if (userEduData) setUserEducations(userEduData.map(ue => ({...ue, userId: ue.user_id, eduId: ue.edu_id})));

      const { data: payrollsData } = await supabase.from('payrolls').select('*');
      if (payrollsData) setPayrolls(payrollsData.map(p => ({...p, companyId: p.company_id, records: typeof p.records === 'string' ? JSON.parse(p.records) : p.records})));

      const { data: psData } = await supabase.from('payroll_settings').select('*');
      if (psData) {
        const psMap = {};
        psData.forEach(ps => {
          psMap[ps.company_id] = { baseSalary: ps.base_salary, hourlyRate: ps.hourly_rate, overtimeRate: ps.overtime_rate, taxRate: ps.tax_rate };
        });
        setPayrollSettings(prev => ({...prev, ...psMap}));
      }

      const { data: arData } = await supabase.from('attendance_requests').select('*');
      if (arData) setAttendanceRequests(arData.map(ar => ({...ar, userId: ar.user_id, companyId: ar.company_id, requestTime: ar.request_time})));

      const { data: scData } = await supabase.from('safety_checklists').select('*');
      if (scData) setSafetyChecklist(scData.map(sc => ({...sc, companyId: sc.company_id, options: typeof sc.options === 'string' ? JSON.parse(sc.options) : sc.options})));

      const { data: emData } = await supabase.from('emergencies').select('*');
      if (emData) setActiveEmergencies(emData.filter(e => e.status === '발생').map(e => e.company_id));
    };
    fetchSupabaseData();
  }, []);

  const [attendances, setAttendances] = useState([]);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [notices, setNotices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [educations, setEducations] = useState(() => {
    const saved = localStorage.getItem('educations');
    return saved ? JSON.parse(saved) : MOCK_EDUCATIONS;
  }); // 아직 DB 미지원 기능들
  const [userEducations, setUserEducations] = useState(() => {
    const saved = localStorage.getItem('userEducations');
    return saved ? JSON.parse(saved) : MOCK_USER_EDUCATIONS;
  });
  const [safetyChecklist, setSafetyChecklist] = useState(MOCK_SAFETY_CHECKLIST);
  const [safetyResults, setSafetyResults] = useState(MOCK_SAFETY_RESULTS);
  const [tbmSubmissions, setTbmSubmissions] = useState([]);
  const [safetySuggestions, setSafetySuggestions] = useState([]);
  const [nearMisses, setNearMisses] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [subscriptions, setSubscriptions] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState(MOCK_PAYMENT_HISTORY);

  // 긴급 상황(작업중지) 관리
  const [activeEmergencies, setActiveEmergencies] = useState(() => {
    const saved = localStorage.getItem('activeEmergencies');
    return saved ? JSON.parse(saved) : [];
  });
  const [emergencyHistory, setEmergencyHistory] = useState(() => {
    const saved = localStorage.getItem('emergencyHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 로컬 스토리지에서 payrolls 불러오기 (로그아웃해도 유지되도록)
  const [payrolls, setPayrolls] = useState(() => {
    const saved = localStorage.getItem('payrolls');
    return saved ? JSON.parse(saved) : MOCK_PAYROLLS;
  });

  // 로컬 스토리지에서 contracts 불러오기
  const [contracts, setContracts] = useState(() => {
    const saved = localStorage.getItem('contracts');
    return saved ? JSON.parse(saved) : MOCK_CONTRACTS;
  });

  // 급여 명세서 기본 양식 설정
  const [payrollSettings, setPayrollSettings] = useState(() => {
    const saved = localStorage.getItem('payrollSettings');
    return saved ? JSON.parse(saved) : {};
  });

  // 로컬 스토리지 변경 시 activeEmergencies 동기화
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'activeEmergencies') {
        setActiveEmergencies(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 결제일 만료 자동 정지 체크 (앱 로드 시 1회 실행)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    setSubscriptions(prevSubs => {
      let isSubUpdated = false;
      const updatedSubs = prevSubs.map(sub => {
        if (sub.status === '결제완료' && sub.nextBillingDate < today) {
          isSubUpdated = true;
          return { ...sub, status: '미납' };
        }
        return sub;
      });

      if (isSubUpdated) {
        setCompanies(prevComps => {
          const updated = prevComps.map(comp => {
            const sub = updatedSubs.find(s => s.companyId === comp.id);
            if (sub && sub.status === '미납' && comp.status === '활성') {
              return { ...comp, status: '정지' };
            }
            return comp;
          });
          localStorage.setItem('companies', JSON.stringify(updated));
          return updated;
        });
        return updatedSubs;
      }
      return prevSubs;
    });
  }, []);

  // 자동 퇴근 처리 (앱 로드 시 1회 실행)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setAttendances(prev => {
      let isUpdated = false;
      const updated = prev.map(record => {
        if (record.date < today && record.clockIn && !record.clockOut) {
          isUpdated = true;
          return { ...record, clockOut: '18:00', status: '시스템 자동퇴근' };
        }
        return record;
      });
      if (isUpdated) {
        localStorage.setItem('attendances', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, []);

  const updatePayrollSettings = async (companyId, newSettings) => {
    const dbData = { company_id: companyId, base_salary: newSettings.baseSalary, hourly_rate: newSettings.hourlyRate, overtime_rate: newSettings.overtimeRate, tax_rate: newSettings.taxRate };
    await supabase.from('payroll_settings').upsert(dbData);
    setPayrollSettings(prev => {
      const updated = { ...prev, [companyId]: newSettings };
      localStorage.setItem('payrollSettings', JSON.stringify(updated));
      return updated;
    });
  };
    const updateCompanyTbmTemplate = async (companyId, newTemplate) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ tbm_template: newTemplate })
        .eq('id', companyId);
        
      if (error) {
        if (error.code === 'PGRST204') {
          console.warn('Supabase tbm_template column is missing. Falling back to localStorage.');
          const localTbmTemplates = JSON.parse(localStorage.getItem('tbm_templates_fallback') || '{}');
          localTbmTemplates[companyId] = newTemplate;
          localStorage.setItem('tbm_templates_fallback', JSON.stringify(localTbmTemplates));
        } else {
          throw error;
        }
      }
      
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, tbm_template: newTemplate } : c
      ));
      return true;
    } catch (error) {
      console.error('Error updating TBM template:', error);
      return false;
    }
  };

  // 안전 점검 제출
  const submitSafetyResult = async (userId, date, items) => {
    const isPerfect = items.every(item => {
      const question = safetyChecklist.find(q => q.id === item.questionId);
      return question && item.status === question.options[0]; // 첫 번째 옵션을 양호(Perfect)로 간주
    });
    const newResultId = Date.now();

    // 기존 해당 사용자와 날짜의 점검 데이터 삭제 후 재등록 (upsert 역할)
    await supabase.from('safety_results').delete().eq('user_id', userId).eq('date', date);
    await supabase.from('safety_results').insert({
      id: newResultId,
      user_id: userId,
      date,
      is_perfect: isPerfect,
      items
    });

    const newResult = {
      id: newResultId,
      userId,
      date,
      isPerfect,
      items
    };
    setSafetyResults(prev => {
      const filtered = prev.filter(r => !(r.userId === userId && r.date === date));
      return [...filtered, newResult];
    });
  };

  // 안전 점검 항목 추가
  const addSafetyChecklistItem = async (title, description, options = ['양호', '미흡', '불량']) => {
    const newId = String(Date.now());
    const dbData = { id: newId, company_id: 'SYSTEM', title, description, options: JSON.stringify(options), created_at: new Date().toISOString() };
    await supabase.from('safety_checklists').insert(dbData);
    setSafetyChecklist(prev => [...prev, { id: newId, title, description, options }]);
  };
    const updateSafetyChecklistItem = async (id, title, description, options) => {
    await supabase.from('safety_checklists').update({ title, description, options: JSON.stringify(options) }).eq('id', String(id));
    setSafetyChecklist(prev => prev.map(item => item.id === id ? { ...item, title, description, options } : item));
  };
    const deleteSafetyChecklistItem = async (id) => {
    await supabase.from('safety_checklists').delete().eq('id', String(id));
    setSafetyChecklist(prev => prev.filter(item => item.id !== id));
  };
    const triggerEmergency = async (companyId, issuerName) => {
    const newId = String(Date.now());
    await supabase.from('emergencies').insert({ id: newId, company_id: companyId, issuer_name: issuerName, status: '발생' });
    setActiveEmergencies(prev => {
      if (!prev.includes(companyId)) {
        const next = [...prev, companyId];
        localStorage.setItem('activeEmergencies', JSON.stringify(next));
        return next;
      }
      return prev;
    });
    const newEvent = { id: newId, companyId, type: '발생', issuerName, timestamp: new Date().toISOString() };
    setEmergencyHistory(prev => {
      const next = [...prev, newEvent];
      localStorage.setItem('emergencyHistory', JSON.stringify(next));
      return next;
    });
  };
    const resolveEmergency = async (companyId) => {
    await supabase.from('emergencies').update({ status: '해제' }).eq('company_id', companyId).eq('status', '발생');
    setActiveEmergencies(prev => {
      const next = prev.filter(id => id !== companyId);
      localStorage.setItem('activeEmergencies', JSON.stringify(next));
      return next;
    });
    const newEvent = { id: Date.now(), companyId, type: '해제', timestamp: new Date().toISOString() };
    setEmergencyHistory(prev => {
      const next = [...prev, newEvent];
      localStorage.setItem('emergencyHistory', JSON.stringify(next));
      return next;
    });
  };
    const confirmPayroll = async (companyId, month, records = []) => {
    const newId = String(Date.now());
    const dbData = { id: newId, company_id: companyId, month, status: '확정', records: JSON.stringify(records) };
    await supabase.from('payrolls').insert(dbData);
    setPayrolls(prev => {
      const existing = prev.find(p => p.companyId === companyId && p.month === month);
      if (existing) return prev;
      const newPayrolls = [...prev, { id: newId, companyId, month, status: '확정', records }];
      localStorage.setItem('payrolls', JSON.stringify(newPayrolls));
      return newPayrolls;
    });
  };
    const addAttendance = async (userId, companyId, date, timeStr, status) => {
    const dbRecord = { user_id: userId, date, clock_in: timeStr, status, company_id: companyId };
    const { data } = await supabase.from('attendances').insert(dbRecord).select('*').single();
    if (data) {
      setAttendances(prev => [...prev, { ...data, clockIn: data.clock_in, clockOut: data.clock_out, userId: data.user_id, companyId: data.company_id }]);
    }
  };

  const updateClockOut = async (recordId, timeStr, status, reason = '') => {
    try {
      await supabase.from('attendances').update({ clock_out: timeStr, status, reason }).eq('id', recordId);
    } catch (e) {}
    setAttendances(prev => prev.map(a => 
      a.id === recordId ? { ...a, clockOut: timeStr, status, reason } : a
    ));
  };

  // 출퇴근 기록 수정 요청
  const requestAttendanceChange = async (userId, companyId, date, type, requestTime, reason) => {
    const newId = String(Date.now());
    const dbData = { id: newId, user_id: userId, company_id: companyId, date, type, request_time: requestTime, reason, status: '대기중' };
    await supabase.from('attendance_requests').insert(dbData);
    const newRequest = { id: newId, userId, companyId, date, type, requestTime, reason, status: '대기중', createdAt: new Date().toISOString() };
    setAttendanceRequests(prev => [newRequest, ...prev]);
  };
    const approveAttendanceChange = async (requestId) => {
    await supabase.from('attendance_requests').update({ status: '승인' }).eq('id', String(requestId));
    setAttendanceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: '승인' } : req));
  };
    const rejectAttendanceChange = async (requestId) => {
    await supabase.from('attendance_requests').update({ status: '반려' }).eq('id', String(requestId));
    setAttendanceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: '반려' } : req));
  };
    const applyLeave = async (leaveData) => {
    const dbLeave = {
      user_id: leaveData.userId,
      type: leaveData.type,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      days: leaveData.days,
      reason: leaveData.reason,
      status: '대기'
    };
    const { data } = await supabase.from('leaves').insert(dbLeave).select('*').single();
    if (data) {
      setLeaves(prev => [{ ...data, userId: data.user_id, startDate: data.start_date, endDate: data.end_date }, ...prev]);
    }
  };

  // 연장근로 신청
  const applyOvertime = async (otData) => {
    const dbOt = {
      user_id: otData.userId,
      date: otData.date,
      start_time: otData.startTime,
      end_time: otData.endTime,
      hours: otData.hours,
      reason: otData.reason,
      status: '대기'
    };
    const { data } = await supabase.from('overtimes').insert(dbOt).select('*').single();
    if (data) {
      setOvertimes(prev => [{ ...data, userId: data.user_id, startTime: data.start_time, endTime: data.end_time }, ...prev]);
    }
  };

  // 휴가 결재 상태 변경 (승인/반려)
  const updateLeaveStatus = async (leaveId, status) => {
    await supabase.from('leaves').update({ status }).eq('id', leaveId);
    setLeaves(prev => prev.map(leave => leave.id === leaveId ? { ...leave, status } : leave));
  };

  // 연장근로 결재 상태 변경 (승인/반려)
  const updateOvertimeStatus = async (otId, status) => {
    await supabase.from('overtimes').update({ status }).eq('id', otId);
    setOvertimes(prev => prev.map(ot => ot.id === otId ? { ...ot, status } : ot));
  };

  // 메시지 보내기
  const sendMessage = async (senderId, senderName, recipientId, title, content) => {
    const dbMsg = { sender_id: senderId, receiver_id: recipientId, content, title };
    const { data } = await supabase.from('messages').insert(dbMsg).select('*').single();
    if (data) {
      setMessages(prev => [{ ...data, senderId: data.sender_id, receiverId: data.receiver_id }, ...prev]);
      return true;
    }
    return false;
  };

  // 메시지 읽음 처리
  const readMessage = async (messageId) => {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
  };

  // 공지사항 관리
  const addNotice = async (notice) => {
    const dbNotice = {
      title: notice.title,
      content: notice.content,
      author: notice.author,
      company_id: notice.companyId,
      target_company_id: notice.targetCompanyId,
      image: notice.image,
      file: notice.file,
      file_name: notice.fileName,
      views: 0
    };
    const { data, error } = await supabase.from('notices').insert(dbNotice).select('*').single();
    if (error) {
      console.error('Notice insert error:', error);
      alert('공지사항 등록 중 오류가 발생했습니다: ' + error.message);
      return;
    }
    if (data) {
      setNotices(prev => [{ ...data, companyId: data.company_id || 'SYSTEM', targetCompanyId: data.target_company_id, fileName: data.file_name }, ...prev]);
    }
  };

  const editNotice = async (id, updatedData) => {
    const dbNotice = {
      title: updatedData.title,
      content: updatedData.content,
      target_company_id: updatedData.targetCompanyId,
      image: updatedData.image,
      file: updatedData.file,
      file_name: updatedData.fileName
    };
    await supabase.from('notices').update(dbNotice).eq('id', id);
    setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updatedData } : n));
  };

  const deleteNotice = async (id) => {
    await supabase.from('notices').delete().eq('id', id);
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  // 교육 수강 완료 처리
  const takeCourse = async (userId, eduId) => {
    const newId = String(Date.now());
    const dbUe = { id: newId, user_id: userId, edu_id: eduId, progress: 0, status: '수강중' };
    await supabase.from('user_educations').insert(dbUe);
    setUserEducations(prev => {
      const existing = prev.find(ue => ue.userId === userId && String(ue.eduId) === String(eduId));
      if (existing) return prev;
      const newUe = { userId, eduId, progress: 0, status: '수강중', date: new Date().toISOString() };
      const updated = [...prev, newUe];
      localStorage.setItem('userEducations', JSON.stringify(updated));
      return updated;
    });
  };
    const updateProgress = async (userId, eduId, progress) => {
    const status = progress >= 100 ? '수료' : '수강중';
    await supabase.from('user_educations').update({ progress, status }).eq('user_id', userId).eq('edu_id', String(eduId));
    setUserEducations(prev => {
      const updated = prev.map(ue => ue.userId === userId && String(ue.eduId) === String(eduId) ? { ...ue, progress: Math.min(100, progress), status } : ue);
      localStorage.setItem('userEducations', JSON.stringify(updated));
      return updated;
    });
  };
    const addEducation = async (companyId, title, startDate, endDate, videoUrl, videoFile, quizzes, cutLine = 60) => {
    const newId = String(Date.now());
    const finalVideoUrl = videoUrl;
    const dbEdu = { id: newId, company_id: companyId, title, start_date: startDate, end_date: endDate, video_url: finalVideoUrl, quizzes: JSON.stringify(quizzes), cut_line: cutLine };
    await supabase.from('educations').insert(dbEdu);
    const newEdu = { id: newId, companyId: companyId || null, title, startDate, endDate, videoUrl: finalVideoUrl, quizzes: quizzes || [], cutLine, createdAt: new Date().toISOString() };
    setEducations(prev => {
      const updated = [...prev, newEdu];
      localStorage.setItem('educations', JSON.stringify(updated));
      return updated;
    });
  };
    const updateEducation = async (id, title, startDate, endDate, videoUrl, videoFile, quizzes, cutLine = 60) => {
    const finalVideoUrl = videoUrl;
    const dbEdu = { title, start_date: startDate, end_date: endDate, video_url: finalVideoUrl, quizzes: JSON.stringify(quizzes), cut_line: cutLine };
    await supabase.from('educations').update(dbEdu).eq('id', String(id));
    setEducations(prev => {
      const updated = prev.map(edu => edu.id === id ? { ...edu, title, startDate, endDate, videoUrl: finalVideoUrl, quizzes: quizzes || [], cutLine } : edu);
      localStorage.setItem('educations', JSON.stringify(updated));
      return updated;
    });
  };
    const deleteEducation = async (id) => {
    await supabase.from('educations').delete().eq('id', String(id));
    await supabase.from('user_educations').delete().eq('edu_id', String(id));
    setEducations(prev => {
      const updated = prev.filter(edu => edu.id !== id);
      localStorage.setItem('educations', JSON.stringify(updated));
      return updated;
    });
    setUserEducations(prev => {
      const updated = prev?.filter(ue => ue.eduId !== id) || [];
      localStorage.setItem('userEducations', JSON.stringify(updated));
      return updated;
    });
  };
    const requestSignature = async (userId, companyId, contractData) => {
    const newId = Date.now();
    const { error } = await supabase.from('contracts').insert({
      id: newId, user_id: userId, company_id: companyId, status: '서명대기', contract_data: contractData, issued_at: new Date().toISOString().split('T')[0]
    });
    if (error) {
      console.error('Supabase insert error in requestSignature:', error);
      alert('근로계약서 전송 중 오류가 발생했습니다: ' + error.message);
      return;
    }
    setContracts(prev => {
      // 이미 서명대기중인 계약은 제외 (새로운 수정본으로 덮어쓰기 위함)
      const filtered = prev.filter(c => !(c.userId === userId && c.status === '서명대기'));
      
      const newContract = {
        id: newId,
        userId,
        companyId,
        status: '서명대기',
        signatureDataUrl: null, // 근로자(을) 서명
        issuedAt: new Date().toISOString().split('T')[0],
        ...contractData // 관리자가 입력한 세부 내용 및 employerSignature 포함
      };
      const updated = [...filtered, newContract];
      localStorage.setItem('contracts', JSON.stringify(updated));
      return updated;
    });
  };

  // 계약서 서명 완료 (사원)
  const signContract = async (contractId, signatureDataUrl) => {
    let fileUrl = signatureDataUrl;
    if (signatureDataUrl && signatureDataUrl.startsWith('data:')) {
       fileUrl = await uploadImageToSupabase(signatureDataUrl, 'signatures');
    }
    await supabase.from('contracts').update({ status: '서명완료', signature_data_url: fileUrl }).eq('id', contractId);
    setContracts(prev => {
      const updated = prev.map(c => 
        c.id === contractId ? { ...c, status: '서명완료', signatureDataUrl: fileUrl } : c
      );
      localStorage.setItem('contracts', JSON.stringify(updated));
      return updated;
    });
  };

  // 고객사 추가 및 수정
  const addSystemNotice = async (title, content, type = '일반', isImportant = false) => {
    const newId = Date.now();
    const { error } = await supabase.from('notices').insert({ id: newId, company_id: 'SYSTEM', title, content, type, is_important: isImportant, date: new Date().toISOString(), created_at: new Date().toISOString() });
    if (error) {
      console.error('Notice insert error:', error);
      throw error;
    }
    setNotices(prev => [{ id: newId, companyId: 'SYSTEM', title, content, type, isImportant, date: new Date().toISOString() }, ...prev]);
  };

  const addCompany = async (companyData) => {
    const newId = `company_${Date.now()}`;
    await supabase.from('companies').insert({ id: newId, name: companyData.name, representative: companyData.representative, contact: companyData.contact, status: '활성' });
    setCompanies(prev => {
      const updated = [...prev, { ...companyData, id: newId }];
      localStorage.setItem('companies', JSON.stringify(updated));
      return updated;
    });
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const billingDate = nextMonth.toISOString().split('T')[0];
    const subId = Date.now();
    
    await supabase.from('subscriptions').insert({
      id: subId,
      company_id: newId,
      plan: 'Basic',
      amount: 50000,
      next_billing_date: billingDate,
      status: '결제완료'
    });

    setSubscriptions(prev => [
      ...prev, 
      { id: subId, companyId: newId, plan: 'Basic', amount: 50000, nextBillingDate: billingDate, status: '결제완료' }
    ]);
  };

  const updateCompany = async (id, data) => {
    const dbData = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.representative !== undefined) dbData.representative = data.representative;
    if (data.contact !== undefined) dbData.contact = data.contact;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.managerName !== undefined) dbData.manager_name = data.managerName;
    if (data.managerPhone !== undefined) dbData.manager_phone = data.managerPhone;
    if (data.address !== undefined) dbData.address = data.address;
    if (data.latitude !== undefined) dbData.latitude = data.latitude === '' ? null : data.latitude;
    if (data.longitude !== undefined) dbData.longitude = data.longitude === '' ? null : data.longitude;
    if (data.workStartTime !== undefined) dbData.work_start_time = data.workStartTime;
    if (data.workEndTime !== undefined) dbData.work_end_time = data.workEndTime;
    if (data.useSafetyFeature !== undefined) dbData.use_safety_feature = data.useSafetyFeature;
    if (data.useWorkFeature !== undefined) dbData.use_work_feature = data.useWorkFeature;
    if (data.useEduFeature !== undefined) dbData.use_edu_feature = data.useEduFeature;
    if (Object.keys(dbData).length > 0) {
      await supabase.from('companies').update(dbData).eq('id', id);
    }
    setCompanies(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...data } : c);
      localStorage.setItem('companies', JSON.stringify(updated));
      return updated;
    });
  };
    const addSubscription = async (companyId, data) => {
    const newId = Date.now();
    const dbData = {
      id: newId,
      company_id: companyId,
      plan: data.plan || 'Basic',
      amount: data.amount || 0,
      status: data.status || '결제완료',
      next_billing_date: data.nextBillingDate || new Date().toISOString().split('T')[0]
    };
    await supabase.from('subscriptions').insert(dbData);
    const newSub = {
      id: newId,
      companyId: companyId,
      plan: dbData.plan,
      amount: dbData.amount,
      status: dbData.status,
      nextBillingDate: dbData.next_billing_date
    };
    setSubscriptions(prev => [...prev, newSub]);
    return newSub;
  };

  // 구독 정보 업데이트 및 회사 상태 연동
  const updateSubscription = async (subId, data) => {
    let companyIdToUpdate = null;
    let newStatus = null;
    
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === subId) {
        if (data.status && sub.status !== data.status) {
          companyIdToUpdate = sub.companyId;
          newStatus = data.status === '미납' ? '정지' : '활성';
        }
        return { ...sub, ...data };
      }
      return sub;
    }));
    
    // Supabase 업데이트 (변경된 컬럼명 매핑)
    const dbData = {};
    if (data.plan !== undefined) dbData.plan = data.plan;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.nextBillingDate !== undefined) dbData.next_billing_date = data.nextBillingDate;
    if (data.status !== undefined) dbData.status = data.status;
    
    await supabase.from('subscriptions').update(dbData).eq('id', subId);

    if (companyIdToUpdate && newStatus) {
      updateCompany(companyIdToUpdate, { status: newStatus });
    }
  };

  // 수동 결제 내역 등록 및 기한 연장
  const addPaymentHistory = (companyId, amount, method) => {
    const today = new Date().toISOString().split('T')[0];
    
    setPaymentHistory(prev => [
      ...prev,
      { id: Date.now(), companyId, date: today, amount, method, status: '결제완료' }
    ]);

    setSubscriptions(prevSubs => prevSubs.map(sub => {
      if (sub.companyId === companyId) {
        const refDate = new Date(sub.nextBillingDate) < new Date() ? new Date() : new Date(sub.nextBillingDate);
        refDate.setMonth(refDate.getMonth() + 1);
        return { ...sub, status: '결제완료', nextBillingDate: refDate.toISOString().split('T')[0] };
      }
      return sub;
    }));

    setCompanies(prevComps => {
      const updated = prevComps.map(comp => 
        comp.id === companyId ? { ...comp, status: '활성' } : comp
      );
      localStorage.setItem('companies', JSON.stringify(updated));
      return updated;
    });
  };

  // TBM 제출 처리
  const submitTbm = async (userId, userName, companyId, date, type, title, data, files = []) => {
    let uploadedFiles = [];
    if (files.length > 0) {
      for (const f of files) {
        if (f.data && f.data.startsWith('data:')) {
          const fileUrl = await uploadImageToSupabase(f.data, 'tbm_photos');
          if (fileUrl) {
            uploadedFiles.push({ name: f.name, type: f.type, data: fileUrl });
          }
        } else if (f.data && f.data.startsWith('http')) {
          uploadedFiles.push(f);
        }
      }
    }
    const newTbmId = Date.now();
    await supabase.from('tbm_submissions').insert({
      id: newTbmId, user_id: userId, user_name: userName, company_id: companyId, date, type, title, data, files: uploadedFiles, participant_signatures: []
    });
    setTbmSubmissions(prev => {
      const newTbm = { id: newTbmId, userId, userName, companyId, date, type, title, data, files: uploadedFiles, participantSignatures: [] };
      return [newTbm, ...prev];
    });
  };

  // TBM 내용 업데이트 (서명 추가 등)
  const updateTbm = async (id, updatedFields) => {
    if (updatedFields.participantSignatures) {
      await supabase.from('tbm_submissions').update({ participant_signatures: updatedFields.participantSignatures }).eq('id', id);
    }
    setTbmSubmissions(prev => prev.map(tbm => tbm.id === id ? { ...tbm, ...updatedFields } : tbm));
  };

  // 안전의견접수 등록
  const addSafetySuggestion = async (userId, userName, companyId, title, reportContent, location, isAnonymous, photo, isPublic = true) => {
    let uploadedPhoto = null;
    if (photo) uploadedPhoto = await uploadImageToSupabase(photo, 'safety_reports');
    const newId = Date.now();
    const { error } = await supabase.from('safety_reports').insert({
      id: newId, type: 'suggestion', user_id: userId, user_name: userName, company_id: companyId, title, content: reportContent, location, is_anonymous: isAnonymous, photo: uploadedPhoto, status: '접수대기', created_at: new Date().toISOString(), is_public: isPublic
    });
    if (error) {
      console.error('Safety suggestion insert error:', error);
      throw error;
    }
    setSafetySuggestions(prev => {
      const newSuggestion = {
        id: newId,
        userId,
        userName,
        companyId,
        title,
        content: reportContent,
        location,
        isAnonymous,
        isPublic,
        photo: uploadedPhoto,
        status: '접수대기',
        feedback: '',
        feedbackImage: null,
        createdAt: new Date().toISOString()
      };
      return [newSuggestion, ...prev];
    });
  };

  // 안전의견접수 업데이트 (관리자 조치 등)
  const updateSafetySuggestion = async (id, data) => {
    const updatePayload = { ...data, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('safety_reports').update(updatePayload).eq('id', id);
    if (error) {
      console.error('Safety suggestion update error:', error);
      throw error;
    }
    setSafetySuggestions(prev => prev.map(s => s.id === id ? { ...s, ...updatePayload } : s));
  };

  // 아차사고 등록
  const addNearMiss = async (userId, userName, companyId, title, reportContent, location, isAnonymous, photo, isPublic = true) => {
    let uploadedPhoto = null;
    if (photo) uploadedPhoto = await uploadImageToSupabase(photo, 'safety_reports');
    const newId = Date.now();
    const { error } = await supabase.from('safety_reports').insert({
      id: newId, type: 'nearmiss', user_id: userId, user_name: userName, company_id: companyId, title, content: reportContent, location, is_anonymous: isAnonymous, photo: uploadedPhoto, status: '접수대기', created_at: new Date().toISOString(), is_public: isPublic
    });
    if (error) {
      console.error('Near miss insert error:', error);
      throw error;
    }
    setNearMisses(prev => {
      const newNearMiss = {
        id: newId,
        userId,
        userName,
        companyId,
        title,
        content: reportContent,
        location,
        isAnonymous,
        isPublic,
        photo: uploadedPhoto,
        status: '접수대기',
        feedback: '',
        createdAt: new Date().toISOString()
      };
      return [newNearMiss, ...prev];
    });
  };

  // 아차사고 업데이트 (관리자 조치 등)
  const updateNearMiss = async (id, data) => {
    await supabase.from('safety_reports').update(data).eq('id', id);
    setNearMisses(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  return (
    <DataContext.Provider value={{
      attendances,
      leaves,
      overtimes,
      notices,
      messages,
      educations,
      userEducations,
      payrolls,
      contracts,
      safetyChecklist,
      safetyResults,
      attendanceRequests,
      companies,
      subscriptions,
      paymentHistory,
      payrollSettings,
      addCompany,
      updateCompany,
      addSubscription,
      updateSubscription,
      addPaymentHistory,
      updatePayrollSettings,
      updateCompanyTbmTemplate,
      addAttendance,
      registerClockIn: addAttendance,
      updateClockOut,
      requestAttendanceChange,
      approveAttendanceChange,
      rejectAttendanceChange,
      applyLeave,
      applyOvertime,
      updateLeaveStatus,
      updateOvertimeStatus,
      confirmPayroll,
      sendMessage,
      readMessage,
      addNotice,
      editNotice,
      deleteNotice,
      takeCourse,
      updateProgress,
      addEducation,
      updateEducation,
      deleteEducation,
      requestSignature,
      signContract,
      submitSafetyResult,
      addSafetyChecklistItem,
      updateSafetyChecklistItem,
      deleteSafetyChecklistItem,
      updatePayrollSettings,
      tbmSubmissions,
      submitTbm,
      updateTbm,
      safetySuggestions,
      addSafetySuggestion,
      updateSafetySuggestion,
      nearMisses,
      addNearMiss,
      updateNearMiss,
      activeEmergencies,
      emergencyHistory,
      triggerEmergency,
      resolveEmergency
    }}>
      {children}
    </DataContext.Provider>
  );
}

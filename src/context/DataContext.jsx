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
          tbm_template: c.tbm_template || localTbmTemplates[c.id]
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

  const updatePayrollSettings = (companyId, newSettings) => {
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
  const addSafetyChecklistItem = (title, description, options = ['양호', '미흡', '불량']) => {
    setSafetyChecklist(prev => [
      ...prev,
      { id: Date.now(), title, description, options }
    ]);
  };

  // 안전 점검 항목 수정
  const updateSafetyChecklistItem = (id, title, description, options) => {
    setSafetyChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, title, description, options } : item
    ));
  };

  // 안전 점검 항목 삭제
  const deleteSafetyChecklistItem = (id) => {
    setSafetyChecklist(prev => prev.filter(item => item.id !== id));
  };

  // 긴급 상황 발생 (작업중지)
  const triggerEmergency = (companyId, issuerName) => {
    setActiveEmergencies(prev => {
      if (prev.includes(companyId)) return prev;
      const next = [...prev, companyId];
      localStorage.setItem('activeEmergencies', JSON.stringify(next));
      return next;
    });

    setEmergencyHistory(prev => {
      const newEvent = {
        id: Date.now(),
        companyId,
        issuerName: issuerName || '직원',
        timestamp: new Date().toISOString()
      };
      const next = [...prev, newEvent];
      localStorage.setItem('emergencyHistory', JSON.stringify(next));
      return next;
    });
  };

  // 긴급 상황 해제
  const resolveEmergency = (companyId) => {
    setActiveEmergencies(prev => {
      const next = prev.filter(id => id !== companyId);
      localStorage.setItem('activeEmergencies', JSON.stringify(next));
      return next;
    });
  };

  // 급여 정산 확정 처리 (상세 내역 records 포함)
  const confirmPayroll = (companyId, month, records = []) => {
    setPayrolls(prev => {
      const existing = prev.find(p => p.companyId === companyId && p.month === month);
      if (existing) return prev;
      const newPayrolls = [...prev, { id: Date.now(), companyId, month, status: '확정', records }];
      localStorage.setItem('payrolls', JSON.stringify(newPayrolls));
      return newPayrolls;
    });
  };

  // 출근 등록
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
  const requestAttendanceChange = (userId, companyId, date, type, requestTime, reason) => {
    setAttendanceRequests(prev => {
      const newRequest = {
        id: Date.now(),
        userId,
        companyId,
        date,
        type, // 'clockIn' or 'clockOut'
        requestTime,
        reason,
        status: '대기',
        createdAt: new Date().toISOString()
      };
      const updated = [newRequest, ...prev];
      localStorage.setItem('attendanceRequests', JSON.stringify(updated));
      return updated;
    });
  };

  // 출퇴근 기록 수정 요청 승인
  const approveAttendanceChange = (requestId) => {
    let targetRequest = null;
    setAttendanceRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === requestId) {
          targetRequest = req;
          return { ...req, status: '승인' };
        }
        return req;
      });
      localStorage.setItem('attendanceRequests', JSON.stringify(updated));
      return updated;
    });

    if (targetRequest) {
      setAttendances(prev => {
        let isExisting = false;
        const updated = prev.map(a => {
          if (a.userId === targetRequest.userId && a.date === targetRequest.date) {
            isExisting = true;
            if (targetRequest.type === 'clockIn') return { ...a, clockIn: targetRequest.requestTime };
            if (targetRequest.type === 'clockOut') return { ...a, clockOut: targetRequest.requestTime };
          }
          return a;
        });
        
        // 기록이 없는 상태에서 출근시간 추가 요청 시 (누락 보완)
        if (!isExisting && targetRequest.type === 'clockIn') {
          updated.push({
            id: Date.now(),
            userId: targetRequest.userId,
            date: targetRequest.date,
            clockIn: targetRequest.requestTime,
            clockOut: null,
            status: '정상출근'
          });
        }
        
        localStorage.setItem('attendances', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // 출퇴근 기록 수정 요청 반려
  const rejectAttendanceChange = (requestId) => {
    setAttendanceRequests(prev => {
      const updated = prev.map(req => req.id === requestId ? { ...req, status: '반려' } : req);
      localStorage.setItem('attendanceRequests', JSON.stringify(updated));
      return updated;
    });
  };

  // 휴가 신청
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
  const takeCourse = (userId, eduId) => {
    setUserEducations(prev => {
      const existing = prev.find(ue => ue.userId === userId && String(ue.eduId) === String(eduId));
      let updated;
      if (existing) {
        updated = prev.map(ue => ue.userId === userId && String(ue.eduId) === String(eduId) ? { ...ue, progress: 100, status: '수료' } : ue);
      } else {
        updated = [...prev, { userId, eduId: isNaN(eduId) ? eduId : Number(eduId), progress: 100, status: '수료' }];
      }
      localStorage.setItem('userEducations', JSON.stringify(updated));
      return updated;
    });
  };

  // 교육 진행률 업데이트
  const updateProgress = (userId, eduId, progress) => {
    setUserEducations(prev => {
      const existing = prev.find(ue => ue.userId === userId && String(ue.eduId) === String(eduId));
      let updated;
      if (existing) {
        updated = prev.map(ue => ue.userId === userId && String(ue.eduId) === String(eduId) ? { ...ue, progress: Math.min(progress, 100) } : ue);
      } else {
        updated = [...prev, { userId, eduId: isNaN(eduId) ? eduId : Number(eduId), progress: Math.min(progress, 100), status: '미수료' }];
      }
      localStorage.setItem('userEducations', JSON.stringify(updated));
      return updated;
    });
  };

  // 교육 과정 추가
  const addEducation = async (companyId, title, startDate, endDate, videoUrl, videoFile, quizzes, cutLine = 60) => {
    const newEduId = Date.now();
    
    if (videoFile) {
      try {
        await saveVideoFile(newEduId, videoFile);
      } catch (err) {
        console.error('Failed to save video to IndexedDB:', err);
      }
    }

    const newEdu = {
      id: newEduId,
      companyId,
      title,
      startDate,
      endDate,
      videoUrl: videoFile ? '' : (videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'),
      quizzes,
      cutLine: Number(cutLine)
    };

    setEducations(prev => {
      const updated = [...prev, newEdu];
      localStorage.setItem('educations', JSON.stringify(updated));
      return updated;
    });
  };

  // 교육 과정 수정
  const updateEducation = async (id, title, startDate, endDate, videoUrl, videoFile, quizzes, cutLine = 60) => {
    if (videoFile) {
      try {
        await saveVideoFile(id, videoFile);
      } catch (err) {
        console.error('Failed to save video to IndexedDB:', err);
      }
    }

    setEducations(prev => {
      const updated = prev.map(edu => {
        if (edu.id === id) {
          return {
            ...edu,
            title,
            startDate,
            endDate,
            videoUrl: videoFile ? '' : (videoUrl || edu.videoUrl),
            quizzes,
            cutLine: Number(cutLine)
          };
        }
        return edu;
      });
      localStorage.setItem('educations', JSON.stringify(updated));
      return updated;
    });
  };

  // 교육 과정 삭제
  const deleteEducation = async (id) => {
    try {
      await deleteVideoFile(id);
    } catch (err) {
      console.error('Failed to delete video from IndexedDB:', err);
    }

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

  // 계약서 작성 및 서명 요청 (관리자) - 서명대기인 경우 덮어쓰기
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

  const updateCompany = (id, data) => {
    setCompanies(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...data } : c);
      localStorage.setItem('companies', JSON.stringify(updated));
      return updated;
    });
  };
  // 새로운 구독 추가
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

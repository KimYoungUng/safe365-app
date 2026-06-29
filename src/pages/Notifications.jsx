import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Users, BookOpen, FileSignature, MessageSquare, AlertCircle, Calendar, Clock, FileText, AlertTriangle, ShieldAlert, ClipboardCheck, X, Building } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function Notifications() {
  const navigate = useNavigate();
  const { currentUser, users, pendingUsers } = useContext(AuthContext);
  const { tbmSubmissions, userEducations, educations, contracts, messages, notices, safetySuggestions, nearMisses, leaves, overtimes, payrolls, attendanceRequests, readMessage, activeEmergencies, safetyResults, companies, subscriptions } = useContext(DataContext);

  const lastVisits = useMemo(() => {
    if (!currentUser?.id) return {};
    const saved = localStorage.getItem(`lastVisits_${currentUser.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [currentUser?.id]);

  const [dismissedIds, setDismissedIds] = useState(() => {
    if (!currentUser?.id) return [];
    const saved = localStorage.getItem(`dismissedNotifications_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const handleDismiss = (id) => {
    if (!currentUser?.id) return;
    setDismissedIds(prev => {
      const updated = [...prev, id];
      localStorage.setItem(`dismissedNotifications_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('dismissedNotificationsChanged'));
  };

  const notificationsList = useMemo(() => {
    const list = [];
    if (!currentUser) return list;

    const isRead = (dateStr, path) => {
      if (!lastVisits[path]) return false;
      return new Date(dateStr) <= new Date(lastVisits[path]);
    };

    // 1. TBM
    if (tbmSubmissions) {
      const unsignedTbms = tbmSubmissions.filter(t => {
        if (t.companyId !== currentUser.companyId) return false;
        if (t.type === 'checklist') return false;

        const hasSigned = t.participantSignatures?.some(s => s.userId === currentUser.id);
        if (hasSigned) return false;

        if (currentUser.roleCode === 'COMPANY_ADMIN') {
          if (t.type === 'free') return false;
          const parts = t.data?.participants || [];
          return parts.some(p => p.userId === currentUser.id);
        } else {
          // Employee
          if (t.type === 'free') return true;
          if (t.type === 'minutes') {
            const parts = t.data?.participants || [];
            return parts.some(p => p.userId === currentUser.id);
          }
          return true;
        }
      });

      unsignedTbms.forEach(t => {
        list.push({ id: `tbm_${t.id}`, isUnread: true, icon: <Users color="#3b82f6" />, title: '[TBM] 서명 요청', message: `'${t.title || 'TBM 회의록'}'에 서명이 필요합니다.`, time: t.date || '최근', link: `/safety/tbm?id=${t.id}` });
      });
    }

    // 2. 교육
    if (educations && currentUser.roleCode === 'EMPLOYEE') {
      const incompleteEducations = educations
        .filter(edu => !edu.companyId || edu.companyId === currentUser.companyId)
        .filter(edu => {
          const userEdu = userEducations?.find(e => e.userId === currentUser.id && String(e.eduId) === String(edu.id));
          return !userEdu || (userEdu.status !== '수료' && userEdu.status !== 'completed');
        });
      incompleteEducations.forEach(edu => {
        list.push({ id: `edu_${edu.id}`, isUnread: true, icon: <BookOpen color="#ef4444" />, title: '[교육] 미이수 알림', message: `'${edu.title}' 교육을 이수해주세요.`, time: '기한 확인 필요', link: `/education` });
      });
    }

    // 3. 근로계약서
    if (contracts) {
      const unsignedContracts = contracts.filter(c => c.userId === currentUser.id && c.status === '서명대기');
      unsignedContracts.forEach(c => {
        list.push({ id: `contract_${c.id}`, isUnread: true, icon: <FileSignature color="#f59e0b" />, title: '[계약서] 서명 요청', message: '서명 대기 중인 근로계약서가 있습니다.', time: c.issuedAt || '최근', link: `/contract?id=${c.id}` });
      });
    }

    // 4. 메시지
    if (messages) {
      const unreadMessages = messages.filter(m => m.receiverId === currentUser.id && !m.read);
      unreadMessages.forEach(m => {
        list.push({ id: `msg_${m.id}`, isUnread: true, icon: <MessageSquare color="#3b82f6" />, title: '[메시지] 새 메시지', message: m.content || '새로운 사내 메시지가 도착했습니다.', time: m.created_at || m.createdAt || '최근', link: `/messages?id=${m.id}` });
      });
    }

    // 5. 공지사항 (최근 3일)
    // eslint-disable-next-line react-hooks/purity
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (notices) {
      const recentNotices = notices.filter(n => (n.companyId === 'SYSTEM' || n.companyId === currentUser.companyId) && new Date(n.date) >= threeDaysAgo);
      recentNotices.forEach(n => {
        list.push({ id: `notice_${n.id}`, isUnread: !isRead(n.date, `/notice?id=${n.id}`), icon: <Bell color="#10b981" />, title: '[공지] 새 공지사항', message: n.title, time: n.date, link: `/notice?id=${n.id}` });
      });
    }

    // 7. 안전관리(최근 3일)
    if (safetySuggestions) {
      const recentSugg = safetySuggestions.filter(s => {
        if (s.companyId !== currentUser.companyId) return false;
        if (s.isPublic === false) {
          if (currentUser?.roleCode !== 'COMPANY_ADMIN' && s.userId !== currentUser?.id) return false;
        }
        return new Date(s.updated_at || s.createdAt || s.date) >= threeDaysAgo;
      });
      recentSugg.forEach(s => {
        const isAnswered = s.status === '답변완료';
        const notiTitle = isAnswered ? '[안전] 안전의견 답변 등록' : '[안전] 안전의견 등록';
        const notiMessage = isAnswered ? `'${s.title}'에 대한 관리자 답변이 등록되었습니다.` : s.title;
        list.push({ id: `sugg_${s.id}`, isUnread: !isRead(s.updated_at || s.createdAt || s.date, `/safety/suggestion?id=${s.id}`), icon: <AlertCircle color="#3b82f6" />, title: notiTitle, message: notiMessage, time: s.updated_at || s.createdAt || s.date, link: `/safety/suggestion?id=${s.id}` });
      });
    }
    if (nearMisses) {
      const recentMiss = nearMisses.filter(m => {
        if (m.companyId !== currentUser.companyId) return false;
        if (m.isPublic === false) {
          if (currentUser?.roleCode !== 'COMPANY_ADMIN' && m.userId !== currentUser?.id) return false;
        }
        return new Date(m.updated_at || m.createdAt || m.date) >= threeDaysAgo;
      });
      recentMiss.forEach(m => {
        const isAnswered = m.status === '답변완료';
        const notiTitle = isAnswered ? '[안전] 아차사고 답변 등록' : '[안전] 아차사고 등록';
        const notiMessage = isAnswered ? `'${m.title}'에 대한 관리자 답변이 등록되었습니다.` : m.title;
        list.push({ id: `miss_${m.id}`, isUnread: !isRead(m.updated_at || m.createdAt || m.date, `/safety/near-miss?id=${m.id}`), icon: <AlertCircle color="#3b82f6" />, title: notiTitle, message: notiMessage, time: m.updated_at || m.createdAt || m.date, link: `/safety/near-miss?id=${m.id}` });
      });
    }

    // 8. 내 근무 관리 (휴가, 연장근로, 급여)
    if (leaves) {
      const myLeaves = leaves.filter(l => l.userId === currentUser.id && l.status !== '대기');
      myLeaves.forEach(l => {
        list.push({ id: `leave_${l.id}`, isUnread: !isRead(l.updatedAt || l.startDate || l.date, `/leave`), icon: <Calendar color="#f59e0b" />, title: '[휴가] 결재 결과', message: `휴가 신청이 ${l.status} 처리되었습니다.`, time: l.updatedAt || l.startDate || l.date || '최근', link: `/leave` });
      });
    }
    if (overtimes) {
      const myOvertimes = overtimes.filter(o => o.userId === currentUser.id && o.status !== '대기');
      myOvertimes.forEach(o => {
        list.push({ id: `overtime_${o.id}`, isUnread: !isRead(o.updatedAt || o.date, `/overtime`), icon: <Clock color="#f59e0b" />, title: '[연장근로] 결재 결과', message: `연장근로 신청이 ${o.status} 처리되었습니다.`, time: o.updatedAt || o.date || '최근', link: `/overtime` });
      });
    }
    if (payrolls) {
      const myPayrolls = payrolls.filter(p => p.userId === currentUser.id);
      myPayrolls.forEach(p => {
        list.push({ id: `payroll_${p.id || p.month}`, isUnread: !isRead(p.updatedAt || p.month, `/payroll`), icon: <FileText color="#3b82f6" />, title: '[급여] 급여명세서', message: `${p.month} 급여명세서가 등록되었습니다.`, time: p.updatedAt || p.month || '최근', link: `/payroll` });
      });
    }

    // 9. 관리자 결재 대기
    if (currentUser.roleCode === 'COMPANY_ADMIN' && users) {
      const companyUserIds = users.filter(u => u.companyId === currentUser.companyId).map(u => u.id);
      
      if (pendingUsers) {
        const companyPendingUsers = pendingUsers.filter(u => u.companyId === currentUser.companyId);
        companyPendingUsers.forEach(u => {
          list.push({ 
            id: `admin_pending_user_${u.id}`, 
            isUnread: true, 
            icon: <Users color="#f59e0b" />, 
            title: '[가입 승인 대기] 새 직원 가입', 
            message: `'${u.name}'님의 가입 승인 대기 건이 있습니다.`, 
            time: u.requestDate || '최근', 
            link: `/admin/hr` 
          });
        });
      }
      
      if (attendanceRequests) {
        const pendingRequests = attendanceRequests.filter(r => companyUserIds.includes(r.userId) && r.status === '대기');
        pendingRequests.forEach(r => {
          list.push({ id: `admin_attendance_${r.id}`, isUnread: true, icon: <AlertCircle color="#f59e0b" />, title: '[결재] 근태 수정 요청', message: '새로운 근태 수정 요청이 대기 중입니다.', time: r.requestDate || '최근', link: `/admin/attendance` });
        });
      }

      if (leaves) {
        const pendingLeaves = leaves.filter(l => companyUserIds.includes(l.userId) && l.status === '대기');
        pendingLeaves.forEach(l => {
          list.push({ 
            id: `admin_leave_${l.id}`, 
            isUnread: true, 
            icon: <Calendar color="#ef4444" />, 
            title: '[결재 대기] 휴가 승인 요청', 
            message: `${l.name || '직원'}님의 휴가 신청 결재가 대기 중입니다.`, 
            time: l.updatedAt || l.startDate || l.date || '최근', 
            link: `/admin/approvals` 
          });
        });
      }
      if (overtimes) {
        const pendingOvertimes = overtimes.filter(o => companyUserIds.includes(o.userId) && o.status === '대기');
        pendingOvertimes.forEach(o => {
          list.push({ 
            id: `admin_overtime_${o.id}`, 
            isUnread: true, 
            icon: <Clock color="#ef4444" />, 
            title: '[결재 대기] 연장근로 승인 요청', 
            message: `${o.name || '직원'}님의 연장근로 신청 결재가 대기 중입니다.`, 
            time: o.updatedAt || o.date || '최근', 
            link: `/admin/approvals` 
          });
        });
      }
      
      // 관리자 안전 알림
      if (nearMisses) {
        const unreadNearMisses = nearMisses.filter(n => n.companyId === currentUser.companyId && n.status === '접수대기');
        unreadNearMisses.forEach(n => {
          list.push({ id: `admin_nm_${n.id}`, isUnread: !isRead(n.createdAt || n.date, `/admin/safety?tab=아차사고&nearMissId=${n.id}`), icon: <AlertTriangle color="#ef4444" />, title: '[안전] 아차사고 접수', message: '새로운 아차사고 내역이 접수되었습니다.', time: n.createdAt || n.date || '최근', link: `/admin/safety?tab=아차사고&nearMissId=${n.id}` });
        });
      }
      if (safetySuggestions) {
        const unreadSuggestions = safetySuggestions.filter(s => s.companyId === currentUser.companyId && s.status === '접수대기');
        unreadSuggestions.forEach(s => {
          list.push({ id: `admin_sugg_${s.id}`, isUnread: !isRead(s.createdAt || s.date, `/admin/safety?tab=안전의견&suggestionId=${s.id}`), icon: <MessageSquare color="#f59e0b" />, title: '[안전] 안전의견 접수', message: '새로운 안전의견이 접수되었습니다.', time: s.createdAt || s.date || '최근', link: `/admin/safety?tab=안전의견&suggestionId=${s.id}` });
        });
      }
      if (activeEmergencies && activeEmergencies.includes(currentUser.companyId)) {
        list.push({ id: `admin_emergency`, isUnread: !isRead(new Date().toDateString(), `/admin/safety?tab=현황`), icon: <ShieldAlert color="#ef4444" />, title: '[긴급상황] 현장 긴급상황 발생', message: '현장에 긴급상황이 발생했습니다. 즉시 확인해주세요.', time: '최근', link: `/admin/safety?tab=현황` });
      }
      const todayStr = new Date().toDateString();
      if (tbmSubmissions) {
        const todayTbm = tbmSubmissions.filter(t => t.companyId === currentUser.companyId && new Date(t.date || t.createdAt).toDateString() === todayStr);
        todayTbm.forEach(t => {
          list.push({ id: `admin_tbm_${t.id}`, isUnread: !isRead(t.date || t.createdAt, `/admin/safety?tab=TBM&id=${t.id}`), icon: <ClipboardCheck color="#3b82f6" />, title: '[안전] 당일 TBM 현황', message: `'${t.title || 'TBM 현황'}'이(가) 등록되었습니다.`, time: t.date || '최근', link: `/admin/safety?tab=TBM&id=${t.id}` });
        });
      }
      if (safetyResults && users) {
        const todayResults = safetyResults.filter(r => {
          const user = users.find(u => u.id === r.userId);
          const userCompanyId = user?.companyId || user?.companyName;
          return userCompanyId === currentUser.companyId && new Date(r.date).toDateString() === todayStr;
        });
        todayResults.forEach(r => {
          list.push({ id: `admin_inspection_${r.id}`, isUnread: !isRead(r.date, `/admin/safety?tab=현황`), icon: <ClipboardCheck color="#22c55e" />, title: '[안전] 점검 현황', message: '당일 안전 점검 결과가 등록되었습니다.', time: r.date || '최근', link: `/admin/safety?tab=현황` });
        });
      }
    }

    // 10. 슈퍼 관리자 전용 알림
    if (currentUser.roleCode === 'SUPER_ADMIN') {
      if (subscriptions && companies) {
        const mergedSubs = companies.map(c => {
          const sub = subscriptions.find(s => s.companyId === c.id);
          return { ...c, status: sub?.status || '무료', subId: sub?.id };
        });
        const unpaidSubs = mergedSubs.filter(s => s.status === '미납');
        unpaidSubs.forEach(s => {
          list.push({ 
            id: `super_unpaid_${s.id}`, 
            isUnread: !isRead(new Date().toDateString(), `/super/billing`), 
            icon: <AlertTriangle color="#ef4444" />, 
            title: '[시스템] 결제 미납', 
            message: `'${s.name}' 회사의 결제가 미납되었습니다.`, 
            time: '최근', 
            link: `/super/billing` 
          });
        });
      }
      if (companies) {
        // 일주일 내 가입한 회사
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newCompanies = companies.filter(c => c.createdAt && new Date(c.createdAt) >= oneWeekAgo);
        newCompanies.forEach(c => {
          list.push({ 
            id: `super_new_${c.id}`, 
            isUnread: !isRead(c.createdAt, `/super/companies`), 
            icon: <Building color="#3b82f6" />, 
            title: '[시스템] 신규 가입', 
            message: `'${c.name}' 회사가 새로 가입했습니다.`, 
            time: c.createdAt || '최근', 
            link: `/super/companies` 
          });
        });
      }
    }

    // Filter out dismissed notifications
    const activeList = list.filter(item => !dismissedIds.includes(item.id));

    // 정렬 (최신순 등)
    return activeList.sort((a, b) => {
      const dateA = a.time === '최근' || a.time === '기한 확인 필요' ? new Date(0) : new Date(a.time);
      const dateB = b.time === '최근' || b.time === '기한 확인 필요' ? new Date(0) : new Date(b.time);
      return dateB - dateA;
    });
  }, [tbmSubmissions, userEducations, educations, contracts, messages, notices, safetySuggestions, nearMisses, leaves, overtimes, payrolls, lastVisits, currentUser, pendingUsers, users, activeEmergencies, safetyResults, attendanceRequests, dismissedIds]);

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '최근' || timeStr === '기한 확인 필요') return timeStr;
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '80px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="page-header" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, borderBottom: '1px solid #e2e8f0', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={24} color="#333" />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' }}>내 알림</h1>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {notificationsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '15px' }}>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notificationsList.map(noti => (
              <div 
                key={noti.id} 
                onClick={() => {
                  if (noti.id.startsWith('msg_')) {
                    const msgId = parseInt(noti.id.replace('msg_', ''), 10);
                    readMessage(msgId);
                  }
                  navigate(noti.link);
                }}
                style={{ 
                  backgroundColor: noti.isUnread ? 'white' : '#f8fafc', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'flex-start', 
                  cursor: 'pointer', 
                  boxShadow: noti.isUnread ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  border: noti.isUnread ? '1px solid #e2e8f0' : '1px solid transparent',
                  opacity: noti.isUnread ? 1 : 0.6
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: noti.isUnread ? '#f1f5f9' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {noti.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: noti.isUnread ? '#64748b' : '#94a3b8' }}>{noti.title}</span>
                      {noti.isUnread && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatTime(noti.time)}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(noti.id);
                        }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          padding: '4px', 
                          cursor: 'pointer', 
                          color: '#94a3b8', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: '50%',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', color: noti.isUnread ? '#333' : '#64748b', fontWeight: noti.isUnread ? '500' : '400', lineHeight: 1.4 }}>
                    {noti.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

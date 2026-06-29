import { useContext, useMemo, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { useLocation } from 'react-router-dom';

export function useEmployeeNotifications() {
  const { currentUser, users, pendingUsers } = useContext(AuthContext);
  const location = useLocation();
  const { 
    tbmSubmissions, 
    educations,
    userEducations, 
    contracts, 
    messages, 
    notices, 
    safetySuggestions, 
    nearMisses,
    leaves,
    overtimes,
    payrolls,
    attendanceRequests,
    activeEmergencies,
    safetyResults,
    companies,
    subscriptions
  } = useContext(DataContext);

  const [lastVisits, setLastVisits] = useState(() => {
    const saved = localStorage.getItem(`lastVisits_${currentUser?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (currentUser?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastVisits(prev => {
        const fullPath = location.pathname + (location.search || '');
        const next = { ...prev, [fullPath]: new Date().toISOString() };
        localStorage.setItem(`lastVisits_${currentUser.id}`, JSON.stringify(next));
        return next;
      });
    }
  }, [location.pathname, location.search, currentUser?.id]);

  const [dismissedIds, setDismissedIds] = useState(() => {
    const saved = localStorage.getItem(`dismissedNotifications_${currentUser?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleSync = () => {
      if (currentUser?.id) {
        const saved = localStorage.getItem(`dismissedNotifications_${currentUser.id}`);
        setDismissedIds(saved ? JSON.parse(saved) : []);
      }
    };
    window.addEventListener('dismissedNotificationsChanged', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('dismissedNotificationsChanged', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [currentUser?.id]);

  return useMemo(() => {
    // 기본값
    const state = {
      total: 0,
      hasTbm: false,
      hasEducation: false,
      hasContract: false,
      hasMessage: false,
      hasNotice: false,
      hasSafetyPost: false,
      hasPendingLeave: false,
      hasPendingOvertime: false,
      hasPayroll: false,
      // Admin specific counts
      adminUnreadTbmCount: 0,
      adminUnreadSuggestionsCount: 0,
      adminUnreadNearMissesCount: 0,
      adminActiveEmergenciesCount: 0,
      adminUnreadInspectionsCount: 0,
      // Super Admin specific counts
      superUnpaidCount: 0,
      superNewCompanyCount: 0
    };

    if (!currentUser || !['EMPLOYEE', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.roleCode)) {
      return state;
    }

    const list = [];
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
        list.push({ id: `tbm_${t.id}`, isUnread: true });
      });
    }

    // 2. 교육 (회사의 교육 기능이 활성화된 경우에만)
    const userCompanyForEdu = companies?.find(c => c.id === (currentUser.companyId || currentUser.companyName));
    const isEduFeatureEnabled = userCompanyForEdu ? userCompanyForEdu.useEduFeature !== false : true;
    if (educations && currentUser.roleCode === 'EMPLOYEE' && isEduFeatureEnabled) {
      const incompleteEducations = educations
        .filter(edu => !edu.companyId || edu.companyId === currentUser.companyId)
        .filter(edu => {
          const userEdu = userEducations?.find(e => e.userId === currentUser.id && String(e.eduId) === String(edu.id));
          return !userEdu || (userEdu.status !== '수료' && userEdu.status !== 'completed');
        });
      incompleteEducations.forEach(edu => {
        list.push({ id: `edu_${edu.id}`, isUnread: true });
      });
    }

    // 3. 근로계약서
    if (contracts) {
      const unsignedContracts = contracts.filter(c => c.userId === currentUser.id && c.status === '서명대기');
      unsignedContracts.forEach(c => {
        list.push({ id: `contract_${c.id}`, isUnread: true });
      });
    }

    // 4. 메시지
    if (messages) {
      const unreadMessages = messages.filter(m => m.receiverId === currentUser.id && !m.read);
      unreadMessages.forEach(m => {
        list.push({ id: `msg_${m.id}`, isUnread: true });
      });
    }

    // 5. 공지사항 (최근 3일)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (notices) {
      const recentNotices = notices.filter(n => (n.companyId === 'SYSTEM' || n.companyId === currentUser.companyId) && new Date(n.date) >= threeDaysAgo);
      recentNotices.forEach(n => {
        list.push({ id: `notice_${n.id}`, isUnread: !isRead(n.date, `/notice?id=${n.id}`) });
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
        list.push({ id: `sugg_${s.id}`, isUnread: !isRead(s.updated_at || s.createdAt || s.date, `/safety/suggestion?id=${s.id}`) });
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
        list.push({ id: `miss_${m.id}`, isUnread: !isRead(m.updated_at || m.createdAt || m.date, `/safety/near-miss?id=${m.id}`) });
      });
    }

    // 8. 내 근무 관리 (휴가, 연장근로, 급여)
    if (leaves) {
      const myLeaves = leaves.filter(l => l.userId === currentUser.id && l.status !== '대기');
      myLeaves.forEach(l => {
        list.push({ id: `leave_${l.id}`, isUnread: !isRead(l.updatedAt || l.startDate || l.date, `/leave`) });
      });
    }
    if (overtimes) {
      const myOvertimes = overtimes.filter(o => o.userId === currentUser.id && o.status !== '대기');
      myOvertimes.forEach(o => {
        list.push({ id: `overtime_${o.id}`, isUnread: !isRead(o.updatedAt || o.date, `/overtime`) });
      });
    }
    if (payrolls) {
      const myPayrolls = payrolls.filter(p => p.userId === currentUser.id);
      myPayrolls.forEach(p => {
        list.push({ id: `payroll_${p.id || p.month}`, isUnread: !isRead(p.updatedAt || p.month, `/payroll`) });
      });
    }

    // 9. 관리자 결재 대기
    if (currentUser.roleCode === 'COMPANY_ADMIN' && users) {
      const companyUserIds = users.filter(u => u.companyId === currentUser.companyId).map(u => u.id);
      
      if (pendingUsers) {
        const companyPendingUsers = pendingUsers.filter(u => u.companyId === currentUser.companyId);
        companyPendingUsers.forEach(u => {
          list.push({ id: `admin_pending_user_${u.id}`, isUnread: true });
        });
      }
      
      if (attendanceRequests) {
        const pendingRequests = attendanceRequests.filter(r => companyUserIds.includes(r.userId) && r.status === '대기');
        pendingRequests.forEach(r => {
          list.push({ id: `admin_attendance_${r.id}`, isUnread: true });
        });
      }

      if (leaves) {
        const pendingLeaves = leaves.filter(l => companyUserIds.includes(l.userId) && l.status === '대기');
        pendingLeaves.forEach(l => {
          list.push({ id: `admin_leave_${l.id}`, isUnread: true });
        });
      }
      if (overtimes) {
        const pendingOvertimes = overtimes.filter(o => companyUserIds.includes(o.userId) && o.status === '대기');
        pendingOvertimes.forEach(o => {
          list.push({ id: `admin_overtime_${o.id}`, isUnread: true });
        });
      }
      
      // 관리자 안전 알림
      if (nearMisses) {
        const unreadNearMisses = nearMisses.filter(n => n.companyId === currentUser.companyId && n.status === '접수대기');
        unreadNearMisses.forEach(n => {
          list.push({ id: `admin_nm_${n.id}`, isUnread: !isRead(n.createdAt || n.date, `/admin/safety?tab=아차사고&nearMissId=${n.id}`) });
        });
      }
      if (safetySuggestions) {
        const unreadSuggestions = safetySuggestions.filter(s => s.companyId === currentUser.companyId && s.status === '접수대기');
        unreadSuggestions.forEach(s => {
          list.push({ id: `admin_sugg_${s.id}`, isUnread: !isRead(s.createdAt || s.date, `/admin/safety?tab=안전의견&suggestionId=${s.id}`) });
        });
      }
      if (activeEmergencies && activeEmergencies.includes(currentUser.companyId)) {
        list.push({ id: `admin_emergency`, isUnread: !isRead(new Date().toDateString(), `/admin/safety?tab=현황`) });
      }
      const todayStr = new Date().toDateString();
      if (tbmSubmissions) {
        const todayTbm = tbmSubmissions.filter(t => t.companyId === currentUser.companyId && new Date(t.date || t.createdAt).toDateString() === todayStr);
        todayTbm.forEach(t => {
          list.push({ id: `admin_tbm_${t.id}`, isUnread: !isRead(t.date || t.createdAt, `/admin/safety?tab=TBM&id=${t.id}`) });
        });
      }
      if (safetyResults && users) {
        const todayResults = safetyResults.filter(r => {
          const user = users.find(u => u.id === r.userId);
          const userCompanyId = user?.companyId || user?.companyName;
          return userCompanyId === currentUser.companyId && new Date(r.date).toDateString() === todayStr;
        });
        todayResults.forEach(r => {
          list.push({ id: `admin_inspection_${r.id}`, isUnread: !isRead(r.date, `/admin/safety?tab=현황`) });
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
          list.push({ id: `super_unpaid_${s.id}`, isUnread: !isRead(new Date().toDateString(), `/super/billing`) });
        });
      }
      if (companies) {
        // 일주일 내 가입한 회사
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newCompanies = companies.filter(c => c.createdAt && new Date(c.createdAt) >= oneWeekAgo);
        newCompanies.forEach(c => {
          list.push({ id: `super_new_${c.id}`, isUnread: !isRead(c.createdAt, `/super/companies`) });
        });
      }
    }

    const activeList = list.filter(item => !dismissedIds.includes(item.id));
    const unreadList = activeList.filter(item => item.isUnread);

    state.total = unreadList.length;
    state.hasTbm = unreadList.some(item => item.id.startsWith('tbm_'));
    // hasEducation은 알림 dismiss와 무관하게, 실제 교육 이수 데이터 기반으로 판단 (교육 기능 꺼진 회사는 제외)
    state.hasEducation = (educations && currentUser.roleCode === 'EMPLOYEE' && isEduFeatureEnabled)
      ? educations
          .filter(edu => !edu.companyId || edu.companyId === currentUser.companyId)
          .some(edu => {
            const userEdu = userEducations?.find(e => e.userId === currentUser.id && String(e.eduId) === String(edu.id));
            return !userEdu || (userEdu.status !== '수료' && userEdu.status !== 'completed');
          })
      : false;
    state.hasContract = unreadList.some(item => item.id.startsWith('contract_'));
    state.hasMessage = unreadList.some(item => item.id.startsWith('msg_'));
    state.hasNotice = unreadList.some(item => item.id.startsWith('notice_'));
    state.hasSafetyPost = unreadList.some(item => item.id.startsWith('sugg_') || item.id.startsWith('miss_'));
    state.hasPendingLeave = unreadList.some(item => item.id.startsWith('leave_'));
    state.hasPendingOvertime = unreadList.some(item => item.id.startsWith('overtime_'));
    state.hasPayroll = unreadList.some(item => item.id.startsWith('payroll_'));

    // Admin counts
    state.adminUnreadTbmCount = unreadList.filter(item => item.id.startsWith('admin_tbm_')).length;
    state.adminUnreadSuggestionsCount = unreadList.filter(item => item.id.startsWith('admin_sugg_')).length;
    state.adminUnreadNearMissesCount = unreadList.filter(item => item.id.startsWith('admin_nm_')).length;
    state.adminActiveEmergenciesCount = unreadList.filter(item => item.id.startsWith('admin_emergency')).length;
    state.adminUnreadInspectionsCount = unreadList.filter(item => item.id.startsWith('admin_inspection_')).length;
    
    // Super Admin counts
    state.superUnpaidCount = unreadList.filter(item => item.id.startsWith('super_unpaid_')).length;
    state.superNewCompanyCount = unreadList.filter(item => item.id.startsWith('super_new_')).length;

    return state;
  }, [currentUser, users, pendingUsers, tbmSubmissions, educations, userEducations, contracts, messages, notices, safetySuggestions, nearMisses, leaves, overtimes, payrolls, lastVisits, attendanceRequests, activeEmergencies, safetyResults, dismissedIds]);
}

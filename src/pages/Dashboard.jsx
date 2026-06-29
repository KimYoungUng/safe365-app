import { useState, useContext, useEffect } from 'react';
import { Menu, Monitor, Bell, User, Clock, Calendar, MessageSquare, Wifi, Briefcase, BookOpen, FileText, FileSignature, Users, HelpCircle, Smartphone, MapPin, Globe, X, Search, Network, XCircle, Bed, Zap, LogOut, LogIn, AlertCircle, ShieldCheck, File, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, Building } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { useEmployeeNotifications } from '../hooks/useEmployeeNotifications';
import mainLogo from '../assets/logo.png';

function Dashboard() {
  const empNotifications = useEmployeeNotifications();
  const { currentUser, users, pendingUsers, logout } = useContext(AuthContext);
  const { attendances, registerClockIn, updateClockOut, contracts, companies, leaves, overtimes, attendanceRequests, triggerEmergency, messages } = useContext(DataContext);
  const [attendanceState, setAttendanceState] = useState('출근');
  
  const companyUsers = users?.filter(u => u.companyId === currentUser?.companyId) || [];
  const companyUserIds = companyUsers.map(u => u.id);
  const companyPendingUsersCount = pendingUsers?.filter(u => u.companyId === currentUser?.companyId)?.length || 0;
  const pendingLeavesCount = leaves?.filter(l => companyUserIds.includes(l.userId) && l.status === '대기').length || 0;
  const pendingOvertimesCount = overtimes?.filter(o => companyUserIds.includes(o.userId) && o.status === '대기').length || 0;
  const pendingAttendanceRequestsCount = attendanceRequests?.filter(r => companyUserIds.includes(r.userId) && r.status === '대기').length || 0;
  const adminPendingCount = pendingLeavesCount + pendingOvertimesCount;
  
  const adminSafetyCount = 
    (empNotifications.adminUnreadNearMissesCount || 0) + 
    (empNotifications.adminUnreadSuggestionsCount || 0) + 
    (empNotifications.adminUnreadTbmCount || 0) + 
    (empNotifications.adminUnreadInspectionsCount || 0) + 
    (empNotifications.adminActiveEmergenciesCount || 0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [showAttendanceRequestModal, setShowAttendanceRequestModal] = useState(false);
  const [attendanceRequestForm, setAttendanceRequestForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'clockIn', requestTime: '', reason: '' });
  const [showReminderModal, setShowReminderModal] = useState({ show: false, message: '' });
  
  const todayDate = new Date();
  const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!messages || !currentUser) return;
    const unreadMsgs = messages.filter(m => m.receiverId === currentUser.id && !m.read);
    const msgNotifications = unreadMsgs.map(m => ({
      id: `msg_${m.id}`,
      type: 'message',
      title: `[새 메시지] ${m.title || '제목 없음'}`,
      message: m.content || '새로운 메시지가 도착했습니다.',
      time: new Date(m.created_at || Date.now()).toLocaleDateString(),
      isRead: false,
      link: '/messages'
    }));

    setNotifications(prev => {
      const filteredPrev = prev.filter(n => !String(n.id).startsWith('msg_'));
      return [...msgNotifications, ...filteredPrev];
    });
  }, [messages, currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = (noti) => {
    // 알림 읽음 처리
    setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, isRead: true } : n));
    setShowNotifications(false);
    navigate(noti.link);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const [showClockInModal, setShowClockInModal] = useState(false);
  const [clockInLocation, setClockInLocation] = useState(null);
  const [clockInDistance, setClockInDistance] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const { requestAttendanceChange } = useContext(DataContext);

  const handleAttendanceRequestSubmit = () => {
    if (!attendanceRequestForm.requestTime || !attendanceRequestForm.reason) {
      alert('변경 시간과 사유를 모두 입력해주세요.');
      return;
    }
    requestAttendanceChange(
      currentUser.id, 
      currentUser.companyId, 
      attendanceRequestForm.date, 
      attendanceRequestForm.type, 
      attendanceRequestForm.requestTime, 
      attendanceRequestForm.reason
    );
    alert('출퇴근 기록 수정 요청이 성공적으로 전송되었습니다.');
    setShowAttendanceRequestModal(false);
    setAttendanceRequestForm({ date: new Date().toISOString().split('T')[0], type: 'clockIn', requestTime: '', reason: '' });
  };

  // 리마인드 알림 로직
  useEffect(() => {
    if (currentUser?.roleCode === 'EMPLOYEE') {
      const checkReminders = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // 1. 유저 맞춤 출퇴근 시간 가져오기 (1순위 개인설정, 2순위 회사설정, 3순위 09:00/18:00)
        const myCompany = companies?.find(c => c.id === currentUser.companyId);
        const wStart = currentUser.workStartTime || myCompany?.workStartTime || '09:00';
        const wEnd = currentUser.workEndTime || myCompany?.workEndTime || '18:00';
        
        const [startH, startM] = wStart.split(':').map(Number);
        const [endH, endM] = wEnd.split(':').map(Number);

        // 출근 리마인드: 출근 시간 10분 전 ~ 출근 시간
        const startTotalMins = startH * 60 + startM;
        const nowTotalMins = hours * 60 + minutes;
        
        const renderTodayRecord = attendances.find(a => a.userId === currentUser.id && a.date === now.toISOString().split('T')[0]);

        if (nowTotalMins >= startTotalMins - 10 && nowTotalMins <= startTotalMins) {
          if (!renderTodayRecord?.clockIn && !sessionStorage.getItem('clockInReminded')) {
            setShowReminderModal({ show: true, message: `출근 ${startTotalMins - nowTotalMins}분 전입니다! 잊지 말고 출근하기를 눌러주세요.` });
            sessionStorage.setItem('clockInReminded', 'true');
          }
        }

        // 퇴근 리마인드: 퇴근 시간 ~ 퇴근 시간 10분 후
        const endTotalMins = endH * 60 + endM;
        if (nowTotalMins >= endTotalMins && nowTotalMins <= endTotalMins + 10) {
          if (renderTodayRecord?.clockIn && !renderTodayRecord?.clockOut && !sessionStorage.getItem('clockOutReminded')) {
            setShowReminderModal({ show: true, message: `정규 퇴근 시간(${wEnd})이 지났습니다. 퇴근 처리를 완료해주세요!` });
            sessionStorage.setItem('clockOutReminded', 'true');
          }
        }
      };

      checkReminders();
      const interval = setInterval(checkReminders, 60000); // 1분마다 체크
      return () => clearInterval(interval);
    }
  }, [currentUser, attendances, companies]);

  const handleAttendanceClick = (type, reason = '') => {
    if (!currentUser) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 어제 날짜 구하기
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    // 오늘 및 어제 기록 찾기
    const todayRecord = attendances.find(a => a.userId === currentUser.id && a.date === dateStr);
    const yesterdayRecord = attendances.find(a => a.userId === currentUser.id && a.date === yesterdayStr);
    const actionType = type || attendanceState;

    if (actionType === '출근') {
      if (todayRecord && todayRecord.clockIn) {
        alert('이미 출근 기록이 존재합니다.');
        return;
      }
      
      const userCompany = companies?.find(c => c.id === currentUser.companyId);
      if (!userCompany || !userCompany.latitude || !userCompany.longitude) {
        // 회사 위치 정보가 없으면 바로 출근 처리
        confirmClockIn();
        return;
      }

      setShowClockInModal(true);
      setIsLocating(true);
      setLocationError('');
      setClockInDistance(null);
      setClockInLocation(null);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setClockInLocation({ lat, lng, acc: position.coords.accuracy });
            
            const dist = calculateDistance(lat, lng, userCompany.latitude, userCompany.longitude);
            setClockInDistance(dist);
            setIsLocating(false);
          },
          (error) => {
            setLocationError('위치 정보를 가져올 수 없습니다. 브라우저의 위치 권한을 허용해주세요.');
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setLocationError('이 기기/브라우저에서는 위치 정보를 지원하지 않습니다.');
        setIsLocating(false);
      }
    } else {
      if (!todayRecord) {
        // 어제 출근했지만 미퇴근 상태로 자정이 지난 경우 (연장근로 연동)
        if (yesterdayRecord && !yesterdayRecord.clockOut && actionType === '퇴근') {
          updateClockOut(yesterdayRecord.id, `익일 ${timeStr}`, '연장근무');
          alert(`[${timeStr}] 전일자 연장근무 퇴근으로 처리되었습니다. 연장근로 신청 페이지로 이동합니다.`);
          navigate('/overtime', { 
            state: { 
              autoOpen: true, 
              date: yesterdayStr, 
              startTime: '22:00', // 보통 야간/연장 기준 시작시간 또는 이전 출근일의 정규 퇴근시간으로 세팅
              endTime: timeStr, 
              reason: '자정 초과 근무' 
            } 
          });
          return;
        }
        
        alert('오늘 출근 기록이 없습니다. 출근부터 등록해주세요.');
        return;
      }
      if (todayRecord.clockOut && actionType === '퇴근') {
        alert('이미 퇴근 기록이 존재합니다.');
        return;
      }
      
      let status = '정상퇴근';
      if (actionType === '조퇴') status = '조퇴';
      if (actionType === '외근') status = '외근';
      if (actionType === '외출') status = '외출중';
      
      // 출근 시 지각이었다면 지각 상태 유지
      if (todayRecord.status.includes('지각')) {
        status = '지각/' + status;
      }
      
      updateClockOut(todayRecord.id, timeStr, status, reason);
      alert(`[${timeStr}] ${actionType} 등록이 완료되었습니다.`);
    }
  };

  const confirmClockIn = async () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const myCompany = companies?.find(c => c.id === currentUser.companyId);
    const wStart = currentUser.workStartTime || myCompany?.workStartTime || '09:00';
    const [startHour, startMin] = wStart.split(':').map(Number);
    const lateThresholdMin = startHour * 60 + startMin + 5;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    let status = '근무중';
    if (currentMin >= lateThresholdMin) {
      status = '지각';
    }
    
    await registerClockIn(currentUser.id, currentUser.companyId, dateStr, timeStr, status);
    alert(`[${timeStr}] 출근 등록이 완료되었습니다.${status === '지각' ? ' (지각 처리)' : ''}`);
    setShowClockInModal(false);
  };

  if (!currentUser) return null;

  // 근로계약서 서명 대기 여부
  const hasPendingContract = contracts?.some(c => c.userId === currentUser?.id && c.status === '서명대기');

  // 당일 출퇴근 기록
  const todayDateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/\s/g, '-');
  // fallback for today's date if locale formats differently
  const now = new Date();
  const fallbackDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const finalDateStr = fallbackDateStr; // use consistent format
  const renderTodayRecord = attendances?.find(a => a.userId === currentUser?.id && a.date === finalDateStr);

  const userCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '스마트컴퍼니') : '스마트컴퍼니';
  const userCompany = companies?.find(c => c.id === userCompanyId) || { useSafetyFeature: true, useWorkFeature: true, useEduFeature: true };
  const useSafetyFeature = userCompany.useSafetyFeature !== false;
  const useWorkFeature = userCompany.useWorkFeature !== false;
  const useEduFeature = userCompany.useEduFeature !== false;

  return (
    <>
      {/* Header */}
      <header className="header" style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userCompany.logo ? (
            <img src={userCompany.logo} alt="logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} />
          ) : (
            <div style={{ width: '28px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={16} color="#64748b" />
            </div>
          )}
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{userCompany.name || '회사명'}</span>
        </div>
        <div className="header-actions" style={{ position: 'relative', display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          <Network size={20} color="#333" onClick={() => setShowOrgChart(true)} style={{ cursor: 'pointer' }} />

          <div onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} style={{ cursor: 'pointer', position: 'relative', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
            <User size={16} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid white' }}></div>
          </div>

          {/* 프로필 드롭다운 */}
          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '100%', right: '0', width: '200px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '12px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>{currentUser.name} {currentUser.role}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{currentUser.department}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} style={{ padding: '16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6', color: '#333' }}>
                  내 정보
                </div>
                <div onClick={handleLogout} style={{ padding: '16px', cursor: 'pointer', fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>
                  로그아웃
                </div>
              </div>
            </div>
          )}

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: '0', width: '280px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '12px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>최근 알림</span>
                <span onClick={handleMarkAllRead} style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>모두 읽음</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '16px' }}>알림이 없습니다.</div>
                ) : (
                  notifications.map(noti => (
                    <div 
                      key={noti.id} 
                      onClick={() => handleNotificationClick(noti)}
                      style={{ 
                        padding: '16px', 
                        borderBottom: '1px solid #f3f4f6', 
                        cursor: 'pointer', 
                        backgroundColor: noti.isRead ? 'white' : '#eff6ff',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {!noti.isRead && <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '50%' }}></div>}
                        <div style={{ fontSize: '16px', fontWeight: noti.isRead ? 'normal' : 'bold', color: '#111' }}>{noti.title}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginLeft: noti.isRead ? '0' : '12px' }}>{noti.message}</div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '6px', marginLeft: noti.isRead ? '0' : '12px' }}>{noti.time}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Role-Based Dashboard Content */}
      <main className="main-content">
        {/* User Profile Card (Common - Hidden for EMPLOYEE due to new UI) */}
        {currentUser.roleCode !== 'EMPLOYEE' && (
          <div className="user-card">
            <h2>{currentUser.name} {currentUser.role}</h2>
            <p>소속 | {currentUser.department}</p>
            <p>사번 | {currentUser.id}</p>
          </div>
        )}

        {/* --- EMPLOYEE (일반 직원) View --- */}
        {currentUser.roleCode === 'EMPLOYEE' && (
          <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {useWorkFeature && (
            <>
            {/* 출퇴근현황 카드 */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: '#1e293b', fontSize: '16px' }}>
                    <Clock size={20} color="#3b82f6" /> 출퇴근 현황
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px' }}>
                    {`[${currentUser.department || '부서미지정'} / ${currentUser.role || '직급미지정'}] ${currentUser.name}`}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '6px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <ChevronLeft size={18} color="#64748b" />
                    </button>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#334155', minWidth: '90px', textAlign: 'center', letterSpacing: '0.5px' }}>
                      {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월
                    </span>
                    <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <ChevronRight size={18} color="#64748b" />
                    </button>
                  </div>
                </div>
              </div>

              {(() => {
                const myMonthlyAttendances = attendances?.filter(a => a.userId === currentUser?.id && a.date.startsWith(selectedMonth)) || [];
                const myMonthlyLeaves = leaves?.filter(l => l.userId === currentUser?.id && l.status === '승인' && l.startDate.startsWith(selectedMonth)) || [];
                
                const monthlyClockIn = myMonthlyAttendances.filter(a => a.clockIn).length;
                const monthlyLate = myMonthlyAttendances.filter(a => a.status.includes('지각')).length;
                const monthlyEarlyLeave = myMonthlyAttendances.filter(a => a.status.includes('조퇴')).length;
                const monthlyAbsent = myMonthlyAttendances.filter(a => a.status.includes('결근')).length;
                const monthlyLeaveCount = myMonthlyLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);

                return (
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', cursor: 'pointer', gap: '8px' }}
                    onClick={() => navigate('/attendance')}
                    title="클릭하여 세부내역 보기"
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <Briefcase size={22} color="#16a34a" />
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{monthlyClockIn}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>출근</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <XCircle size={22} color="#dc2626" />
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{monthlyAbsent}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>결근</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <Bed size={22} color="#0284c7" />
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{monthlyLeaveCount}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>휴가</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <Zap size={22} color="#d97706" />
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{monthlyEarlyLeave}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>조퇴</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                        <User size={22} color="#ea580c" />
                      </div>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{monthlyLate}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: 'bold' }}>지각</div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* 업무수행중 배너 */}
            <div style={{ backgroundColor: '#dcfce7', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={20} color="#16a34a" />
              <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
                {renderTodayRecord?.clockOut ? '퇴근 처리되었습니다.' : renderTodayRecord?.clockIn ? '업무수행중입니다.' : '출근 전입니다.'}
              </span>
            </div>

            {/* 출근 관리 카드 */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333' }}>
                  <Clock size={18} color="#3b82f6" /> 출퇴근 관리
                </div>
                <Wifi size={20} color="#3b82f6" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {!renderTodayRecord?.clockIn ? (
                  <button 
                    onClick={() => handleAttendanceClick('출근')}
                    style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                    <LogIn size={20} /> 출근하기
                  </button>
                ) : !renderTodayRecord?.clockOut ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => handleAttendanceClick('퇴근')}
                      style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                      <LogOut size={18} /> 정상 퇴근
                    </button>
                    <button 
                      onClick={() => {
                        const reason = window.prompt('조퇴 사유를 간략히 입력해주세요.');
                        if(reason !== null) handleAttendanceClick('조퇴', reason);
                      }}
                      style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                      <LogOut size={18} /> 조퇴하기
                    </button>
                  </div>
                ) : (
                  <button 
                    disabled
                    style={{ flex: 1, backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'not-allowed' }}>
                    <CheckCircle2 size={20} /> 퇴근완료
                  </button>
                )}
                
                <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#333', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} color={renderTodayRecord?.clockIn ? "#3b82f6" : "#cbd5e1"} /> 출근
                  </div>
                  <div style={{ color: renderTodayRecord?.clockIn ? '#22c55e' : '#94a3b8', fontSize: '16px', marginLeft: '22px' }}>
                    {renderTodayRecord?.clockIn ? `출근 : ${renderTodayRecord.clockIn}` : '미출근'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#333', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', marginTop: '12px' }}>
                    <CheckCircle2 size={16} color={renderTodayRecord?.clockOut ? "#ef4444" : "#cbd5e1"} /> 퇴근
                  </div>
                  <div style={{ color: renderTodayRecord?.clockOut ? '#ef4444' : '#94a3b8', fontSize: '16px', marginLeft: '22px' }}>
                    {renderTodayRecord?.clockOut ? `퇴근 : ${renderTodayRecord.clockOut}` : '미퇴근'}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowAttendanceRequestModal(true)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '16px', cursor: 'pointer', textDecoration: 'underline' }}>
                  출퇴근 기록을 깜빡하셨나요? 수정 요청하기
                </button>
              </div>
            </div>
            </>
            )}

            {/* 안전 관리 카드 */}
            {useSafetyFeature && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                  <ShieldCheck size={18} color="#3b82f6" /> 안전 관리
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div onClick={() => navigate('/safety/near-miss')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                    {empNotifications.hasSafetyPost && <div className="badge-new" style={{ top: '8px', right: '8px', position: 'absolute' }}>NEW !</div>}
                    <AlertCircle size={28} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>아차사고<br/>접수</div>
                  </div>
                  <div onClick={() => navigate('/safety/suggestion')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                    {empNotifications.hasSafetyPost && <div className="badge-new" style={{ top: '8px', right: '8px', position: 'absolute' }}>NEW !</div>}
                    <MessageSquare size={28} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>안전의견<br/>접수</div>
                  </div>
                  <div onClick={() => navigate('/safety/tbm')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                    {empNotifications.hasTbm && <div className="badge-new" style={{ top: '8px', right: '8px', position: 'absolute' }}>NEW !</div>}
                    <Users size={28} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>TBM</div>
                  </div>
                  <div onClick={() => navigate('/safety')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer' }}>
                    <CheckCircle2 size={28} />
                    <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>안전 점검</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    onClick={() => {
                      if (window.confirm('실제 상황입니까?\n즉시 전 직원에게 작업중지 긴급 알림과 사이렌이 울립니다.\n발령하시겠습니까?')) {
                        triggerEmergency(currentUser.companyId, currentUser.name);
                      }
                    }}
                    style={{
                      width: '100%', backgroundColor: '#ef4444', color: 'white', border: 'none',
                      borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 'bold',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <AlertTriangle size={20} /> <div style={{ textAlign: 'center' }}>긴급 작업중지 발령<br/><span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.9 }}>(전 직원 알림)</span></div>
                  </button>
                </div>
              </div>
            )}

            {/* 내 근무 관리 */}
            {useWorkFeature && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                <Briefcase size={18} color="#3b82f6" /> 내 근무 관리
              </div>
              <div className="grid-cards">
                <a className="action-card" onClick={() => navigate('/overtime')}>
                  {empNotifications.hasPendingOvertime && <div className="badge-new">NEW !</div>}
                  <Clock className="action-card-icon" />
                  <div className="action-card-title" style={{ whiteSpace: 'nowrap' }}>연장근로 신청</div>
                </a>
                <a className="action-card" onClick={() => navigate('/leave')}>
                  {empNotifications.hasPendingLeave && <div className="badge-new">NEW !</div>}
                  <Calendar className="action-card-icon" />
                  <div className="action-card-title" style={{ whiteSpace: 'nowrap' }}>휴가 신청</div>
                </a>
                <a className="action-card" style={{backgroundColor: '#0284c7'}} onClick={() => navigate('/attendance')}>
                  <Clock className="action-card-icon" />
                  <div className="action-card-title" style={{ whiteSpace: 'nowrap' }}>내 출퇴근 기록</div>
                </a>
                <a className="action-card" onClick={() => navigate('/payroll')}>
                  <FileText className="action-card-icon" />
                  <div className="action-card-title" style={{ whiteSpace: 'nowrap' }}>내 급여 명세서</div>
                </a>
                <a className="action-card" onClick={() => navigate('/contract')} style={{ position: 'relative' }}>
                  {empNotifications.hasContract && <div className="badge-new">NEW !</div>}
                  <FileSignature className="action-card-icon" />
                  <div className="action-card-title" style={{ whiteSpace: 'nowrap' }}>내 근로계약서</div>
                </a>
              </div>
            </div>
            )}

            {/* 내 교육 관리 */}
            {useEduFeature && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                <BookOpen size={18} color="#3b82f6" /> 내 교육 관리
              </div>
              <div className="grid-cards" style={{ gridTemplateColumns: '1fr' }}>
                <a className="action-card" style={{backgroundColor: '#4b5563'}} onClick={() => navigate('/education')}>
                  <div className="badge-new" style={{backgroundColor: empNotifications.hasEducation ? '#ef4444' : '#22c55e'}}>
                    {empNotifications.hasEducation ? '미이수' : '이수완료'}
                  </div>
                  <BookOpen className="action-card-icon" />
                  <div className="action-card-title">내 교육 관리</div>
                </a>
              </div>
            </div>
            )}

            {/* 공지사항 및 메시지 카드 */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                <Bell size={18} color="#3b82f6" /> 사내 공지 및 메시지
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div onClick={() => navigate('/notice')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                  {empNotifications.hasNotice && <div className="badge-new" style={{ top: '8px', right: '8px', position: 'absolute' }}>NEW !</div>}
                  <File size={28} />
                  <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>공지사항</div>
                </div>
                <div onClick={() => navigate('/messages')} style={{ backgroundColor: '#3b82f6', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '8px', cursor: 'pointer', position: 'relative' }}>
                  {empNotifications.hasMessage && <div className="badge-new" style={{ top: '8px', right: '8px', position: 'absolute' }}>NEW !</div>}
                  <MessageSquare size={28} />
                  <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.3' }}>메시지</div>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* --- COMPANY_ADMIN (회사 관리자) View --- */}
        {currentUser.roleCode === 'COMPANY_ADMIN' && (
          <>
            {useWorkFeature && (adminPendingCount > 0 || pendingAttendanceRequestsCount > 0) && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
                {adminPendingCount > 0 && (
                  <div className="alert-banner" style={{backgroundColor: '#e0e7ff', color: '#4338ca', marginBottom: 0}}>
                    <Bell size={16} />
                    결재 대기 중인 요청이 {adminPendingCount}건 있습니다.
                  </div>
                )}
                {pendingAttendanceRequestsCount > 0 && (
                  <div className="alert-banner" style={{backgroundColor: '#fef9c3', color: '#854d0e', marginBottom: 0}}>
                    <Bell size={16} />
                    근태 수정 요청이 {pendingAttendanceRequestsCount}건 있습니다.
                  </div>
                )}
              </div>
            )}

            <section className="section">
              <div className="section-header">
                <div className="section-title"><User size={18} className="section-icon" /> 전사 근태/인사 관리</div>
              </div>
              <div className="grid-cards">
                {useWorkFeature && (
                  <>
                    <a className="action-card" onClick={() => navigate('/admin/attendance')}>
                      {pendingAttendanceRequestsCount > 0 && <div className="badge-new">{pendingAttendanceRequestsCount}</div>}
                      <Clock className="action-card-icon" />
                      <div className="action-card-title">전사 근태 현황</div>
                    </a>
                    <a className="action-card" onClick={() => navigate('/admin/approvals')}>
                      {adminPendingCount > 0 && <div className="badge-new">{adminPendingCount}</div>}
                      <Briefcase className="action-card-icon" />
                      <div className="action-card-title">결재 대기함</div>
                    </a>
                    <a className="action-card" onClick={() => navigate('/admin/payroll')}><FileText className="action-card-icon" /><div className="action-card-title">급여 정산</div></a>
                  </>
                )}
                <a className="action-card" onClick={() => navigate('/admin/hr')}>
                  {companyPendingUsersCount > 0 && <div className="badge-new">{companyPendingUsersCount}</div>}
                  <Users className="action-card-icon" />
                  <div className="action-card-title">인사·노무 관리</div>
                </a>
                {useEduFeature && (
                  <a className="action-card" style={{backgroundColor: '#4b5563'}} onClick={() => navigate('/admin/education')}><BookOpen className="action-card-icon" /><div className="action-card-title">직원 교육 현황</div></a>
                )}
                {useSafetyFeature && (
                  <a className="action-card" style={{backgroundColor: '#3b82f6'}} onClick={() => navigate('/admin/safety')}>
                    {adminSafetyCount > 0 && <div className="badge-new" style={{ backgroundColor: '#ef4444' }}>{adminSafetyCount}</div>}
                    <ShieldCheck className="action-card-icon" />
                    <div className="action-card-title">안전 점검 현황</div>
                  </a>
                )}
              </div>
            </section>
          </>
        )}

        {/* --- SUPER_ADMIN (최고 관리자) View --- */}
        {currentUser.roleCode === 'SUPER_ADMIN' && (
          <>
            <section className="section">
              <div className="section-header">
                <div className="section-title"><Monitor size={18} className="section-icon" /> 플랫폼 통합 관리 (SaaS)</div>
              </div>
              <div className="card" style={{marginBottom: '12px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontWeight:'bold'}}>총 가입 고객사</span>
                  <span style={{color:'var(--primary)', fontSize:'20px', fontWeight:'800'}}>{companies?.length || 0}개사</span>
                </div>
              </div>
              <div className="grid-cards">
                <a className="action-card" onClick={() => navigate('/super/companies')}><Briefcase className="action-card-icon" /><div className="action-card-title">고객사 관리</div></a>
                <a className="action-card" style={{backgroundColor:'#1f2937'}} onClick={() => navigate('/super/subscriptions')}><Calendar className="action-card-icon" /><div className="action-card-title">구독/결제 현황</div></a>
              </div>
            </section>
          </>
        )}

        {/* 공통 섹션 (공지 및 알림 - EMPLOYEE는 새 UI에서 별도로 처리함) */}
        {currentUser.roleCode !== 'EMPLOYEE' && (
          <section className="section">
            <div className="section-header">
              <div className="section-title"><Bell size={18} className="section-icon" /> {currentUser.roleCode === 'SUPER_ADMIN' ? '시스템 공지' : '사내 공지 및 알림'}</div>
            </div>
            <div className="grid-cards">
              <a className="action-card" style={{ backgroundColor: '#ffffff', color: '#1a1a1a', border: '1px solid #efefef' }} onClick={() => navigate('/notice')}>
                {empNotifications.hasNotice && <div className="badge-new">NEW</div>}
                <Bell className="action-card-icon" style={{ color: 'var(--primary)' }} />
                <div className="action-card-title">공지사항</div>
              </a>
              <a className="action-card" onClick={() => navigate('/messages')}>
                {empNotifications.hasMessage && <div className="badge-new">NEW</div>}
                <MessageSquare className="action-card-icon" />
                <div className="action-card-title">메시지</div>
              </a>
            </div>
          </section>
        )}
      </main>

      {/* 출근 확인 모달 */}
      {showClockInModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '360px', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>
            
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setShowClockInModal(false)}
              style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', backgroundColor: '#60a5fa', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            <div style={{ padding: '32px 24px 24px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #eab308', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <HelpCircle size={28} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px', color: '#334155', marginBottom: '24px' }}>
                <Smartphone size={18} /> 수집된 정보 (실제 GPS 연동)
              </div>

              {isLocating ? (
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', padding: '20px 0' }}>
                  현재 위치를 확인하고 있습니다...<br />(위치 권한을 허용해주세요)
                </div>
              ) : locationError ? (
                <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '24px', fontWeight: 'bold', padding: '20px 0' }}>
                  {locationError}
                </div>
              ) : clockInLocation ? (
                <>
                  <div style={{ width: '100%', textAlign: 'left', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                      <MapPin size={14} /> [테스트용] 현재 측정된 내 기기 좌표
                    </div>
                    <div style={{ fontSize: '16px', color: '#334155', lineHeight: '1.5', fontFamily: 'monospace' }}>
                      위도: {clockInLocation.lat.toFixed(6)}<br />
                      경도: {clockInLocation.lng.toFixed(6)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>* 이 숫자를 복사해 고객사 관리의 위/경도에 넣으시면 거리가 0m가 됩니다.</div>
                  </div>
                  <div style={{ width: '100%', textAlign: 'center', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                      <Briefcase size={16} /> 회사와의 직선 거리:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: clockInDistance <= 50 ? '#10b981' : '#ef4444' }}>
                      {clockInDistance.toFixed(1)} m
                    </div>
                    {clockInDistance > 50 ? (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>
                        ※ 출근 허용 반경(50m)을 벗어나 출근할 수 없습니다.
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 'bold' }}>
                        ※ 정상 출근 가능 거리입니다.
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>
                이 정보로 출근을 진행하시겠습니까?
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button 
                  onClick={confirmClockIn}
                  disabled={isLocating || !!locationError || clockInDistance > 50}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: (isLocating || !!locationError || clockInDistance > 50) ? '#94a3b8' : '#60a5fa', color: 'white', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: (isLocating || !!locationError || clockInDistance > 50) ? 'not-allowed' : 'pointer' }}
                >
                  확인
                </button>
                <button 
                  onClick={() => setShowClockInModal(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: '#94a3b8', color: 'white', fontSize: '15px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                >
                  취소
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 조직도 모달 */}
      {showOrgChart && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Network size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', margin: 0 }}>회사 조직도</h3>
              </div>
              <button onClick={() => setShowOrgChart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {(() => {
                // Get user's actual company name from context if possible
                const myCompany = companies?.find(c => c.id === currentUser.companyId);
                const myCompanyName = myCompany ? myCompany.name : (currentUser.companyName || '스마트컴퍼니');
                const myCompanyId = currentUser.companyId || myCompanyName;

                const myCompanyUsers = users.filter(u => {
                  const uCompany = u.companyId || u.companyName || '스마트컴퍼니';
                  return uCompany === currentUser.companyId || uCompany === myCompanyId;
                });

                const grouped = myCompanyUsers.reduce((acc, user) => {
                  const dept = user.department || '미소속';
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(user);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([dept, members], idx) => (
                  <div key={idx} style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0' }}>
                      {dept} <span style={{ fontSize: '16px', color: '#888', fontWeight: 'normal' }}>({members.length}명)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {members.map(member => {
                        const memberCompany = companies?.find(c => c.id === member.companyId);
                        const displayCompanyName = memberCompany ? memberCompany.name : (member.companyName || '스마트컴퍼니');
                        
                        return (
                          <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 'bold', fontSize: '16px' }}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111' }}>{member.name} {member.role}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{displayCompanyName}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 출퇴근 기록 수정 요청 모달 */}
      {showAttendanceRequestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>
            <button onClick={() => setShowAttendanceRequestModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
              출퇴근 기록 수정 요청
            </h3>
            <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>
              누락되거나 잘못된 출퇴근 시간을 관리자에게 수정 요청합니다.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>대상 날짜</label>
                <input type="date" value={attendanceRequestForm.date} onChange={e => setAttendanceRequestForm({...attendanceRequestForm, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>구분</label>
                  <select value={attendanceRequestForm.type} onChange={e => setAttendanceRequestForm({...attendanceRequestForm, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <option value="clockIn">출근</option>
                    <option value="clockOut">퇴근</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>요청 시간</label>
                  <input type="time" value={attendanceRequestForm.requestTime} onChange={e => setAttendanceRequestForm({...attendanceRequestForm, requestTime: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>수정 사유</label>
                <textarea value={attendanceRequestForm.reason} onChange={e => setAttendanceRequestForm({...attendanceRequestForm, reason: e.target.value})} placeholder="예: 핸드폰 배터리 방전으로 인한 클릭 누락" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }} />
              </div>
              
              <button onClick={handleAttendanceRequestSubmit} style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}>
                수정 요청 전송하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 리마인드 알림 모달 */}
      {showReminderModal.show && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '16px', animation: 'slideUp 0.3s ease-out', borderLeft: '4px solid #3b82f6' }}>
            <Bell size={24} color="#3b82f6" />
            <div style={{ fontWeight: 'bold', color: '#111' }}>{showReminderModal.message}</div>
            <button onClick={() => setShowReminderModal({ show: false, message: '' })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default Dashboard;

import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function AttendanceRecord() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { attendances, leaves } = useContext(DataContext);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 현재 유저의 출퇴근 및 휴가 기록 필터링
  const myAttendances = useMemo(() => attendances.filter(a => a.userId === currentUser?.id), [attendances, currentUser]);
  const myLeaves = useMemo(() => leaves.filter(l => l.userId === currentUser?.id && (l.status === '승인' || l.status === '대기')), [leaves, currentUser]);

  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const selectedRecord = useMemo(() => myAttendances.find(a => a.date === selectedDateStr), [myAttendances, selectedDateStr]);
  const selectedLeave = useMemo(() => {
    return myLeaves.find(leave => {
      // startDate와 endDate 사이에 selectedDateStr이 포함되는지 확인 (문자열 비교)
      return selectedDateStr >= leave.startDate && selectedDateStr <= leave.endDate;
    });
  }, [myLeaves, selectedDateStr]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDate(new Date(year, month, day));
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>내 출퇴근 기록</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{year}년 {month + 1}월</h2>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#888' }}>
            <div style={{ color: '#ef4444' }}>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div style={{ color: '#3b82f6' }}>토</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '4px' }}>
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} style={{ padding: '10px 0' }}></div>;
              
              const currentCellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDateStr === currentCellDateStr;
              const isToday = todayStr === currentCellDateStr;
              const hasRecord = myAttendances.some(a => a.date === currentCellDateStr);
              const leaveOnDate = myLeaves.find(l => currentCellDateStr >= l.startDate && currentCellDateStr <= l.endDate);
              const isLeaveApproved = leaveOnDate?.status === '승인';
              const isLeavePending = leaveOnDate?.status === '대기';

              return (
                <div 
                  key={day} 
                  onClick={() => handleDayClick(day)}
                  style={{ 
                    padding: '8px 0', 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'var(--primary)' : (isLeaveApproved ? '#f3e8ff' : (isLeavePending ? '#fef3c7' : 'transparent')),
                    color: isSelected ? 'white' : (isLeaveApproved ? '#9333ea' : (isLeavePending ? '#d97706' : (idx % 7 === 0 ? '#ef4444' : idx % 7 === 6 ? '#3b82f6' : 'var(--text-main)'))),
                    fontWeight: isSelected || isToday || leaveOnDate ? 'bold' : 'normal',
                    border: isToday && !isSelected ? '1px solid var(--primary)' : (isLeavePending && !isSelected ? '1px dashed #f59e0b' : '1px solid transparent'),
                    position: 'relative',
                    height: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {day}
                  {hasRecord && !isSelected && !leaveOnDate && (
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary-light)' }}></div>
                  )}
                  {leaveOnDate && !isSelected && (
                    <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: isLeaveApproved ? '#9333ea' : '#f59e0b' }}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid #efefef', paddingBottom: '12px' }}>
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 기록
          </h3>

          {selectedLeave ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: selectedLeave.status === '승인' ? '#faf5ff' : '#fffbeb', padding: '16px', borderRadius: '12px', border: selectedLeave.status === '승인' ? '1px solid #dbeafe' : '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedLeave.status === '승인' ? '#9333ea' : '#d97706', fontWeight: 'bold', fontSize: '16px' }}>
                  <Calendar size={18} /> {selectedLeave.status === '승인' ? '승인된 휴가' : '휴가 신청 (대기중)'} ({selectedLeave.type})
                </div>
                <span style={{ backgroundColor: selectedLeave.status === '승인' ? '#d4edda' : '#fff3cd', color: selectedLeave.status === '승인' ? '#155724' : '#856404', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {selectedLeave.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>사유: {selectedLeave.reason}</div>
            </div>
          ) : selectedRecord ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                  <CheckCircle size={18} color="#10b981" /> 출근 시간
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedRecord.clockIn}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                  <Clock size={18} color="#f59e0b" /> 퇴근 시간
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedRecord.clockOut ? 'var(--text-main)' : '#888' }}>
                  {selectedRecord.clockOut || '미등록'}
                </div>
              </div>

              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px dashed #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#888' }}>상태</span>
                {(() => {
                  let displayStatus = selectedRecord.status;
                  const isPastDate = selectedRecord.date < todayStr;
                  if (!selectedRecord.clockOut) {
                    if (isPastDate) {
                      displayStatus = '퇴근미처리';
                    } else if (displayStatus === '지각') {
                      displayStatus = '지각(근무중)';
                    }
                  } else {
                    if (displayStatus === '근무중') {
                      displayStatus = '퇴근';
                    } else if (displayStatus === '지각') {
                      displayStatus = '지각/퇴근';
                    } else {
                      displayStatus = displayStatus.replace(/정상퇴근/g, '퇴근');
                    }
                  }
                  
                  return (
                    <span style={{ 
                      backgroundColor: displayStatus.includes('지각') || displayStatus.includes('조퇴') || displayStatus.includes('퇴근미처리') ? '#fee2e2' : displayStatus.includes('정상') ? '#dcfce7' : '#fef3c7', 
                      color: displayStatus.includes('지각') || displayStatus.includes('조퇴') || displayStatus.includes('퇴근미처리') ? '#ef4444' : displayStatus.includes('정상') ? '#10b981' : '#d97706', 
                      padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' 
                    }}>
                      {displayStatus}
                    </span>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} color="#ccc" />
              해당 날짜의 기록이 없습니다.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default AttendanceRecord;

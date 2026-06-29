import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { MOCK_USERS } from '../../mockData';
import { Search, ArrowLeft, Download, Filter, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X as XIcon, Clock, Coffee, Briefcase } from 'lucide-react';

function AdminAttendance() {
  const navigate = useNavigate();
  const { currentUser, users } = useContext(AuthContext);
  const { attendances, leaves, overtimes, attendanceRequests, approveAttendanceChange, rejectAttendanceChange } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('현황'); // '현황', '수정요청'
  const [collapsedDates, setCollapsedDates] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // 선택된 사원 ID

  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
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

  // 사용자 정보와 근태 기록 매핑
  const enrichedAttendances = attendances
    .map(record => {
      const user = users.find(u => u.id === record.userId) || {};
      return {
        ...record,
        companyId: user.companyId || user.companyName || '스마트컴퍼니',
        name: user.name || record.userId,
        department: user.department || '미지정',
        role: user.role || '-'
      };
    })
    .filter(record => {
       const myCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '스마트컴퍼니') : '스마트컴퍼니';
       return record.companyId === myCompanyId;
    });

  // 검색 및 월 필터링
  const filteredRecords = enrichedAttendances.filter(record => 
    record.date.startsWith(selectedMonth) &&
    (record.name.includes(searchTerm) || 
    record.department.includes(searchTerm) ||
    record.date.includes(searchTerm))
  );

  // 날짜 기준 내림차순 정렬
  const sortedRecords = [...filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 날짜별 그룹핑 로직 추가
  const groupedRecords = sortedRecords.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => new Date(b) - new Date(a));

  const toggleDate = (date) => {
    setCollapsedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // 선택된 사원의 상세 데이터 추출
  const getSelectedUserDetails = () => {
    if (!selectedUser) return null;
    const user = users.find(u => u.id === selectedUser);
    const userAttendances = attendances
      .filter(a => a.userId === selectedUser && a.date.startsWith(selectedMonth))
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    const userLeaves = leaves
      .filter(l => l.userId === selectedUser && l.startDate.startsWith(selectedMonth))
      .sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    const userOvertimes = overtimes
      .filter(o => o.userId === selectedUser && o.date.startsWith(selectedMonth))
      .sort((a,b) => new Date(b.date) - new Date(a.date));

    // 총 근무시간 계산 (단순화: 퇴근-출근)
    let totalWorkHours = 0;
    userAttendances.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const [inH, inM] = record.clockIn.split(':').map(Number);
        const [outH, outM] = record.clockOut.split(':').map(Number);
        const diff = (outH + outM / 60) - (inH + inM / 60);
        if (diff > 0) totalWorkHours += diff;
      }
    });

    const totalOvertimeHours = userOvertimes.filter(o => o.status === '승인').reduce((sum, o) => sum + (Number(o.hours)||0), 0);
    const usedLeavesCount = userLeaves.filter(l => l.status === '승인').reduce((sum, l) => sum + (Number(l.days)||0), 0);

    return { user, userAttendances, userLeaves, userOvertimes, totalWorkHours: totalWorkHours.toFixed(1), totalOvertimeHours, usedLeavesCount };
  };

  const details = getSelectedUserDetails();

  const handleExcelDownload = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "날짜,이름,부서,직급,출근시간,퇴근시간,상태\n";
    sortedRecords.forEach(record => {
      const row = [
        record.date,
        record.name,
        record.department,
        record.role,
        record.clockIn || '',
        record.clockOut || '',
        record.status.replace(/정상퇴근/g, '퇴근')
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `근태현황_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>전사 근태 현황</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('현황')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === '현황' ? '#1e293b' : '#f1f5f9', color: activeTab === '현황' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}>
            근태 현황
          </button>
          <button 
            onClick={() => setActiveTab('수정요청')}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === '수정요청' ? '#1e293b' : '#f1f5f9', color: activeTab === '수정요청' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
            수정 요청
            {attendanceRequests?.filter(r => r.status === '대기' && r.companyId === currentUser.companyId).length > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '16px', backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px' }}>
                {attendanceRequests.filter(r => r.status === '대기' && r.companyId === currentUser.companyId).length}
              </span>
            )}
          </button>
        </div>

        {activeTab === '현황' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={16} color="#64748b" />
                </button>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', minWidth: '76px', textAlign: 'center' }}>
                  {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월
                </div>
                <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={16} color="#64748b" />
                </button>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="직원 이름, 부서 검색" 
              style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#4b5563' }}>
            <Filter size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>총 {sortedRecords.length}건</div>
          <button onClick={handleExcelDownload} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10b981', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Download size={14} /> 엑셀 다운로드
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedDates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색 결과가 없습니다.</div>
          ) : (
            sortedDates.map(date => (
              <div key={date}>
                <div 
                  onClick={() => toggleDate(date)}
                  style={{ fontSize: '15px', fontWeight: 'bold', color: '#4b5563', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="var(--primary)" /> {date}
                  </div>
                  {collapsedDates[date] ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronUp size={18} color="#94a3b8" />}
                </div>
                
                {!collapsedDates[date] && (
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', animation: 'popIn 0.2s ease-out' }}>
                    {groupedRecords[date].map((record, index) => (
                      <div 
                        key={record.id} 
                        onClick={() => setSelectedUser(record.userId)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: index < groupedRecords[date].length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)', fontSize: '15px' }}>
                            {record.name.substring(0,1)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>
                              {record.name} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>{record.role}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              {record.department} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span> 출근 {record.clockIn || '-'} · 퇴근 {record.clockOut || '-'}
                            </div>
                          </div>
                        </div>
                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                          backgroundColor: record.status.includes('지각') || record.status.includes('조퇴') ? '#fee2e2' : record.status.includes('정상') ? '#dcfce7' : '#fef3c7',
                          color: record.status.includes('지각') || record.status.includes('조퇴') ? '#dc2626' : record.status.includes('정상') ? '#16a34a' : '#d97706'
                        }}>
                          {record.status.replace(/정상퇴근/g, '퇴근')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        </>
        )}

        {activeTab === '수정요청' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {attendanceRequests?.filter(r => r.companyId === currentUser.companyId).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>수정 요청 내역이 없습니다.</div>
            ) : (
              attendanceRequests?.filter(r => r.companyId === currentUser.companyId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(req => {
                const reqUser = users.find(u => u.id === req.userId);
                return (
                  <div key={req.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)', fontSize: '15px' }}>
                          {reqUser?.name?.substring(0,1) || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>
                            {reqUser?.name} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>{reqUser?.department}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            {req.date} | {req.type === 'clockIn' ? '출근' : '퇴근'} 시간 변경 요청
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', backgroundColor: req.status === '대기' ? '#fef3c7' : req.status === '승인' ? '#dcfce7' : '#fee2e2', color: req.status === '대기' ? '#d97706' : req.status === '승인' ? '#16a34a' : '#ef4444' }}>
                        {req.status}
                      </span>
                    </div>
                    
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', color: '#333', marginBottom: '8px' }}><strong>요청 시간:</strong> {req.requestTime}</div>
                      <div style={{ fontSize: '13px', color: '#333' }}><strong>사유:</strong> {req.reason}</div>
                    </div>

                    {req.status === '대기' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => approveAttendanceChange(req.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>승인</button>
                        <button onClick={() => rejectAttendanceChange(req.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>반려</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* 사원 근태 상세정보 모달 */}
      {selectedUser && details && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f7f8fa', width: '100%', maxWidth: '480px', height: '85vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
            {/* Header */}
            <div style={{ padding: '20px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {details.user.name.substring(0,1)}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{details.user.name} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>{details.user.role}</span></div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{details.user.department}</div>
                </div>
              </div>
              <div onClick={() => setSelectedUser(null)} style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '50%', cursor: 'pointer' }}>
                <XIcon size={20} color="#64748b" />
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              
              {/* 월 선택기 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                <button onClick={handlePrevMonth} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <ChevronLeft size={20} color="#64748b" />
                </button>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', minWidth: '100px', textAlign: 'center' }}>
                  {selectedMonth.split('-')[0]}년 {selectedMonth.split('-')[1]}월
                </div>
                <button onClick={handleNextMonth} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <ChevronRight size={20} color="#64748b" />
                </button>
              </div>
              {/* 요약 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'white', padding: '16px 12px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <Briefcase size={20} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>누적 근무</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{details.totalWorkHours}h</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '16px 12px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <Clock size={20} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>연장 승인</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{details.totalOvertimeHours}h</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '16px 12px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <Coffee size={20} color="#10b981" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>휴가 사용</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{details.usedLeavesCount}일</div>
                </div>
              </div>

              {/* 최근 출퇴근 기록 */}
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>출퇴근 기록</h3>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
                {details.userAttendances.length === 0 ? <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>기록이 없습니다.</div> : 
                  details.userAttendances.map((a, i) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isPastDate = a.date < todayStr;
                    let displayStatus = a.status;
                    
                    if (!a.clockOut) {
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
                    <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 0', borderBottom: i < details.userAttendances.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: '600', color: '#333' }}>{a.date}</div>
                        <div style={{ color: '#64748b', fontSize: '14px' }}>{a.clockIn || '-'} ~ {a.clockOut || '-'}</div>
                        <div style={{ color: displayStatus.includes('지각') || displayStatus.includes('조퇴') || displayStatus.includes('퇴근미처리') ? '#dc2626' : displayStatus.includes('정상') ? '#16a34a' : '#d97706', fontSize: '13px', fontWeight: 'bold' }}>
                          {displayStatus}
                        </div>
                      </div>
                      {a.reason && (
                        <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'right' }}>사유: {a.reason}</div>
                      )}
                    </div>
                  )})
                }
              </div>

              {/* 승인된 연장근로 기록 */}
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>연장근로 내역</h3>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
                {details.userOvertimes.length === 0 ? <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>기록이 없습니다.</div> : 
                  details.userOvertimes.map((o, i) => (
                    <div key={o.id} style={{ padding: '12px 0', borderBottom: i < details.userOvertimes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600', color: '#333' }}>{o.date}</div>
                        <div style={{ color: o.status === '승인' ? '#16a34a' : o.status === '반려' ? '#dc2626' : '#d97706', fontSize: '13px', fontWeight: 'bold' }}>{o.status}</div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>{o.startTime} ~ {o.endTime} ({o.hours}h)</div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>사유: {o.reason}</div>
                    </div>
                  ))
                }
              </div>

              {/* 휴가 내역 */}
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>휴가 내역</h3>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {details.userLeaves.length === 0 ? <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>기록이 없습니다.</div> : 
                  details.userLeaves.map((l, i) => (
                    <div key={l.id} style={{ padding: '12px 0', borderBottom: i < details.userLeaves.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600', color: '#333' }}>{l.type} <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '13px' }}>({l.days}일)</span></div>
                        <div style={{ color: l.status === '승인' ? '#16a34a' : l.status === '반려' ? '#dc2626' : '#d97706', fontSize: '13px', fontWeight: 'bold' }}>{l.status}</div>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '13px' }}>{l.startDate} ~ {l.endDate}</div>
                    </div>
                  ))
                }
              </div>
              
              <div style={{ height: '40px' }}></div> {/* 하단 여백 */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminAttendance;

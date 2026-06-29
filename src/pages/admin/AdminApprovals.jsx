import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { ArrowLeft, Check, X, Clock, Calendar as CalendarIcon, Search, ChevronDown, ChevronUp } from 'lucide-react';

function AdminApprovals() {
  const navigate = useNavigate();
  const { currentUser, users } = useContext(AuthContext);
  const { leaves, overtimes, updateLeaveStatus, updateOvertimeStatus } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState('휴가');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [expandedCards, setExpandedCards] = useState({});

  // Multi-tenant: 현재 관리자와 동일한 회사의 직원 목록 가져오기
  const companyUsers = users.filter(u => u.companyId === currentUser.companyId);
  const companyUserIds = companyUsers.map(u => u.id);

  // 같은 회사의 휴가 내역 가져오기
  const companyLeaves = leaves
    .filter(leave => companyUserIds.includes(leave.userId))
    .map(leave => {
      const user = companyUsers.find(u => u.id === leave.userId) || {};
      return { ...leave, name: user.name, department: user.department, role: user.role };
    })
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // 최신순

  // 같은 회사의 연장근로 내역 가져오기
  const companyOvertimes = overtimes
    .filter(ot => companyUserIds.includes(ot.userId))
    .map(ot => {
      const user = companyUsers.find(u => u.id === ot.userId) || {};
      return { ...ot, name: user.name, department: user.department, role: user.role };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleApproveLeave = (id) => updateLeaveStatus(id, '승인');
  const handleRejectLeave = (id) => updateLeaveStatus(id, '반려');
  
  const handleApproveOvertime = (id) => updateOvertimeStatus(id, '승인');
  const handleRejectOvertime = (id) => updateOvertimeStatus(id, '반려');

  // 부서 목록 (중복 제거)
  const departments = ['전체', ...new Set(companyUsers.map(u => u.department).filter(Boolean))];

  // 필터링된 결과
  const filteredLeaves = companyLeaves.filter(leave => {
    const matchName = (leave.name || '').includes(searchTerm) || (leave.reason || '').includes(searchTerm);
    const matchDept = selectedDept === '전체' || leave.department === selectedDept;
    return matchName && matchDept;
  });

  const filteredOvertimes = companyOvertimes.filter(ot => {
    const matchName = (ot.name || '').includes(searchTerm) || (ot.reason || '').includes(searchTerm);
    const matchDept = selectedDept === '전체' || ot.department === selectedDept;
    return matchName && matchDept;
  });

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 대기 중인 건수 계산 (전체 기준)
  const pendingLeavesCount = companyLeaves.filter(l => l.status === '대기').length;
  const pendingOvertimesCount = companyOvertimes.filter(o => o.status === '대기').length;

  const renderStatusBadge = (status) => {
    if (status === '대기') return <span style={{backgroundColor:'#fef3c7', color:'#d97706', padding:'4px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>대기중</span>;
    if (status === '반려') return <span style={{backgroundColor:'#fee2e2', color:'#dc2626', padding:'4px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>반려됨</span>;
    if (status === '승인') return <span style={{backgroundColor:'#dcfce7', color:'#16a34a', padding:'4px 10px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>승인됨</span>;
    return null;
  };

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>결재 대기함</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 60px)' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#e2e8f0', padding: '4px' }}>
          <div 
            onClick={() => setActiveTab('휴가')}
            style={{ position: 'relative', flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '휴가' ? 'white' : 'transparent', color: activeTab === '휴가' ? 'var(--primary)' : '#64748b', fontWeight: 'bold', borderRadius: '8px', transition: 'all 0.2s', boxShadow: activeTab === '휴가' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            휴가 결재 {pendingLeavesCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px', verticalAlign: 'middle' }}>{pendingLeavesCount}</span>}
          </div>
          <div 
            onClick={() => setActiveTab('연장근로')}
            style={{ position: 'relative', flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '연장근로' ? 'white' : 'transparent', color: activeTab === '연장근로' ? 'var(--primary)' : '#64748b', fontWeight: 'bold', borderRadius: '8px', transition: 'all 0.2s', boxShadow: activeTab === '연장근로' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            연장근로 결재 {pendingOvertimesCount > 0 && <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px', verticalAlign: 'middle' }}>{pendingOvertimesCount}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="이름, 사유 검색" 
              style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '0 12px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#4b5563', fontSize: '14px', outline: 'none' }}
          >
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === '휴가' && (
            filteredLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색된 결재 내역이 없습니다.</div>
            ) : (
              filteredLeaves.map(leave => (
                <div key={leave.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                  {/* Clickable Header */}
                  <div onClick={() => toggleCard(`leave-${leave.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <CalendarIcon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{leave.name} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>{leave.role}</span></div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{leave.department} <span style={{color:'#cbd5e1', margin:'0 4px'}}>|</span> {leave.type}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusBadge(leave.status)}
                      {expandedCards[`leave-${leave.id}`] ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </div>
                  </div>
                  
                  {/* Expandable Body */}
                  {expandedCards[`leave-${leave.id}`] && (
                    <div style={{ marginTop: '16px', animation: 'popIn 0.2s ease-out' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <span style={{ color: '#64748b' }}>일시</span>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{leave.startDate} ~ {leave.endDate} ({leave.days}일)</span>
                        </div>
                        <div style={{ fontSize: '14px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ color: '#64748b', marginBottom: '6px' }}>사유</div>
                          <div style={{ color: '#1e293b', lineHeight: '1.4' }}>{leave.reason}</div>
                        </div>
                      </div>

                      {leave.status === '대기' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectLeave(leave.id); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                            <X size={16} /> 반려
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleApproveLeave(leave.id); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                            <Check size={16} /> 승인
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {activeTab === '연장근로' && (
            filteredOvertimes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색된 결재 내역이 없습니다.</div>
            ) : (
              filteredOvertimes.map(ot => (
                <div key={ot.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                  {/* Clickable Header */}
                  <div onClick={() => toggleCard(`ot-${ot.id}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{ot.name} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>{ot.role}</span></div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{ot.department}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStatusBadge(ot.status)}
                      {expandedCards[`ot-${ot.id}`] ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                    </div>
                  </div>
                  
                  {/* Expandable Body */}
                  {expandedCards[`ot-${ot.id}`] && (
                    <div style={{ marginTop: '16px', animation: 'popIn 0.2s ease-out' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <span style={{ color: '#64748b' }}>일자</span>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{ot.date}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <span style={{ color: '#64748b' }}>시간</span>
                          <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{ot.startTime} ~ {ot.endTime} ({ot.hours}시간)</span>
                        </div>
                        <div style={{ fontSize: '14px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <div style={{ color: '#64748b', marginBottom: '6px' }}>사유</div>
                          <div style={{ color: '#1e293b', lineHeight: '1.4' }}>{ot.reason}</div>
                        </div>
                      </div>

                      {ot.status === '대기' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectOvertime(ot.id); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                            <X size={16} /> 반려
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleApproveOvertime(ot.id); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                            <Check size={16} /> 승인
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </main>
    </>
  );
}

export default AdminApprovals;

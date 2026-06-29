import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus, Filter, Clock, XCircle, Calendar as CalendarIcon, Type, AlignLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function LeaveManagement() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { leaves, applyLeave } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState('신청내역');
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    type: '연차',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // 현재 유저의 휴가 내역만 필터링
  const myLeaves = leaves.filter(leave => leave.userId === currentUser?.id);

  // 휴가 계산 로직
  const totalLeaves = currentUser?.totalLeaves || 15;
  const approvedLeaves = myLeaves.filter(l => l.status === '승인');
  const usedLeaves = approvedLeaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
  const remainingLeaves = totalLeaves - usedLeaves;

  const renderStatusBadge = (status) => {
    if (status === '대기') return <span style={{backgroundColor:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>대기</span>;
    if (status === '반려') return <span style={{backgroundColor:'#f8d7da', color:'#721c24', padding:'2px 8px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>반려</span>;
    if (status === '승인') return <span style={{backgroundColor:'#d4edda', color:'#155724', padding:'2px 8px', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>승인</span>;
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    // 일수 계산 (간단하게 구현)
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (formData.type.includes('반차')) diffDays = 0.5;

    applyLeave({
      userId: currentUser.id,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: diffDays,
      reason: formData.reason
    });

    alert('휴가 신청이 완료되었습니다.');
    setShowForm(false);
    setActiveTab('신청내역');
    setFormData({ type: '연차', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>휴가관리</div>
        <div style={{ width: '24px' }}></div> {/* spacer */}
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 12px', border:'1px solid #ccc', borderRadius:'8px', backgroundColor:'white', cursor:'pointer' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 12px', border:'none', borderRadius:'8px', backgroundColor:'var(--primary)', color:'white', fontWeight:'bold', cursor:'pointer' }}>
            <Plus size={14} /> {showForm ? '취소' : '휴가신청'}
          </button>
        </div>
        
        {showForm ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>휴가 신청서 작성</h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 휴가 종류 (Chip 형태) */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
                  휴가 종류
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['연차', '반차(오전)', '반차(오후)', '병가', '경조휴가'].map(type => (
                    <div 
                      key={type}
                      onClick={() => setFormData({...formData, type})}
                      style={{ 
                        padding: '10px 16px', 
                        borderRadius: '20px', 
                        fontSize: '14px', 
                        fontWeight: formData.type === type ? 'bold' : 'normal',
                        backgroundColor: formData.type === type ? 'var(--primary)' : '#f3f4f6',
                        color: formData.type === type ? 'white' : '#555',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              {/* 날짜 선택 (상하 배치) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                    시작일
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="date" 
                      style={{ width: '100%', padding: '16px', paddingLeft: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                      value={formData.startDate} 
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                      required 
                    />
                    <CalendarIcon size={20} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                    종료일
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="date" 
                      style={{ width: '100%', padding: '16px', paddingLeft: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', boxSizing: 'border-box', WebkitAppearance: 'none' }}
                      value={formData.endDate} 
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                      required 
                    />
                    <CalendarIcon size={20} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* 사유 입력 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  사유
                </label>
                <textarea 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', minHeight: '120px', boxSizing: 'border-box', resize: 'none' }}
                  placeholder="구체적인 휴가 사유를 입력해주세요." 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                  required
                ></textarea>
              </div>

              {/* 하단 고정 느낌의 버튼 */}
              <div style={{ marginTop: '8px' }}>
                <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  결재 상신하기
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', border:'none', borderRadius:'8px', backgroundColor:'#e0f2fe', color:'var(--primary)', fontWeight:'bold', cursor:'pointer' }}>
              <Filter size={14} /> 필터
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary)' }}>
          <div 
            onClick={() => setActiveTab('보유휴가')}
            style={{ flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '보유휴가' ? 'var(--primary)' : 'white', color: activeTab === '보유휴가' ? 'white' : 'var(--primary)', fontWeight: 'bold' }}>
            보유휴가
          </div>
          <div 
            onClick={() => setActiveTab('신청내역')}
            style={{ flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '신청내역' ? 'var(--primary)' : 'white', color: activeTab === '신청내역' ? 'white' : 'var(--primary)', fontWeight: 'bold' }}>
            신청내역
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === '신청내역' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>신청 내역이 없습니다.</div>
            ) : (
              myLeaves.map(leave => (
                <div key={leave.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #efefef', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: leave.status === '반려' ? '#e11d48' : '#eab308' }}>
                      {leave.status === '반려' ? <XCircle size={16} /> : <Clock size={16} />}
                      {leave.type}
                    </div>
                    {renderStatusBadge(leave.status)}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '14px' }}>
                    <div style={{ color: '#888' }}>신청자:</div>
                    <div style={{ textAlign: 'right' }}>{currentUser.name}</div>
                    
                    <div style={{ color: '#888' }}>휴가기간:</div>
                    <div style={{ textAlign: 'right' }}>{leave.startDate} ~ {leave.endDate}</div>
                    
                    <div style={{ color: '#888' }}>휴가일수:</div>
                    <div style={{ textAlign: 'right' }}>{leave.days}일</div>
                    
                    <div style={{ color: '#888' }}>사유:</div>
                    <div style={{ textAlign: 'right' }}>{leave.reason}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === '보유휴가' && (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px', color: '#555' }}>{new Date().getFullYear()}년 총 발생 연차</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '24px' }}>{totalLeaves}일</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>사용 연차</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{usedLeaves}일</div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#ddd' }}></div>
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>잔여 연차</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{remainingLeaves}일</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LeaveManagement;

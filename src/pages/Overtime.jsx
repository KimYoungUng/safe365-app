import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus, CheckCircle, Clock, XCircle, List, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function Overtime() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);
  const { overtimes, applyOvertime } = useContext(DataContext);
  const [filter, setFilter] = useState('전체');
  const [showForm, setShowForm] = useState(location.state?.autoOpen || false);

  // 폼 상태
  const [formData, setFormData] = useState({
    type: '연장근로',
    date: location.state?.date || '',
    startTime: location.state?.startTime || '',
    endTime: location.state?.endTime || '',
    reason: location.state?.reason || ''
  });

  // 라우트 state 초기화 (새로고침 시 폼이 계속 열리는 현상 방지)
  useEffect(() => {
    if (location.state?.autoOpen) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 현재 유저의 데이터 필터링
  const myOvertimes = overtimes.filter(ot => ot.userId === currentUser?.id);
  
  // 상태별 데이터 갯수
  const stats = {
    전체: myOvertimes.length,
    승인: myOvertimes.filter(ot => ot.status === '승인').length,
    대기: myOvertimes.filter(ot => ot.status === '대기').length,
    반려: myOvertimes.filter(ot => ot.status === '반려').length,
  };

  const filteredData = filter === '전체' ? myOvertimes : myOvertimes.filter(ot => ot.status === filter);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    // 시작/종료 시간에서 hours 계산
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    const hours = Math.max(0, (endH + endM / 60) - (startH + startM / 60)).toFixed(1);

    applyOvertime({
      userId: currentUser.id,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      hours: parseFloat(hours),
      reason: formData.reason
    });

    alert('연장근로 신청이 완료되었습니다.');
    setShowForm(false);
    setFormData({ type: '연장근로', date: '', startTime: '', endTime: '', reason: '' });
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>연장근로 목록</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
          <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 12px', border:'1px solid #ccc', borderRadius:'8px', backgroundColor:'white', cursor:'pointer' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 12px', border:'none', borderRadius:'8px', backgroundColor:'var(--primary)', color:'white', fontWeight:'bold', cursor:'pointer' }}>
            <Plus size={14} /> {showForm ? '취소' : '연장근로 신청'}
          </button>
        </div>

        {showForm ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '24px' }}>연장근로 신청서 작성</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 근무 종류 (Chip) */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>근무 종류</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['연장근로', '휴일근로', '야간근로'].map(type => (
                    <div 
                      key={type} onClick={() => setFormData({...formData, type})}
                      style={{ padding: '10px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: formData.type === type ? 'bold' : 'normal', backgroundColor: formData.type === type ? 'var(--primary)' : '#f3f4f6', color: formData.type === type ? 'white' : '#555', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              {/* 일자 선택 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>근무 일자</label>
                <div style={{ position: 'relative' }}>
                  <input type="date" style={{ width: '100%', padding: '16px', paddingLeft: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', boxSizing: 'border-box', WebkitAppearance: 'none' }} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                  <CalendarIcon size={20} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* 시간 선택 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>시작 시간</label>
                  <div style={{ position: 'relative' }}>
                    <input type="time" style={{ width: '100%', padding: '16px', paddingLeft: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required />
                    <Clock size={20} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>종료 시간</label>
                  <div style={{ position: 'relative' }}>
                    <input type="time" style={{ width: '100%', padding: '16px', paddingLeft: '44px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required />
                    <Clock size={20} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* 사유 */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>사유</label>
                <textarea style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', minHeight: '100px', boxSizing: 'border-box', resize: 'none' }} placeholder="업무 내용 및 사유를 입력해주세요." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required></textarea>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>결재 상신하기</button>
              </div>
            </form>
          </div>
        ) : (
          <>
        {/* Stats */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>전체</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.전체}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>승인</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{stats.승인}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>대기</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.대기}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>반려</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{stats.반려}</div>
          </div>
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button onClick={() => setFilter('전체')} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'16px', border:'none', backgroundColor: filter === '전체' ? 'var(--primary)' : '#e5e7eb', color: filter === '전체' ? 'white' : '#4b5563', cursor:'pointer' }}><List size={14}/> 전체</button>
          <button onClick={() => setFilter('승인')} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'16px', border:'none', backgroundColor: filter === '승인' ? '#10b981' : '#e5e7eb', color: filter === '승인' ? 'white' : '#4b5563', cursor:'pointer' }}><CheckCircle size={14}/> 승인</button>
          <button onClick={() => setFilter('대기')} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'16px', border:'none', backgroundColor: filter === '대기' ? '#f59e0b' : '#e5e7eb', color: filter === '대기' ? 'white' : '#4b5563', cursor:'pointer' }}><Clock size={14}/> 대기</button>
          <button onClick={() => setFilter('반려')} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px', borderRadius:'16px', border:'none', backgroundColor: filter === '반려' ? '#ef4444' : '#e5e7eb', color: filter === '반려' ? 'white' : '#4b5563', cursor:'pointer' }}><XCircle size={14}/> 반려</button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>해당하는 내역이 없습니다.</div>
          ) : (
            filteredData.map(ot => (
              <div key={ot.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <span style={{ 
                    backgroundColor: ot.status === '승인' ? '#d1fae5' : ot.status === '반려' ? '#ffe4e6' : '#fef3c7', 
                    color: ot.status === '승인' ? '#059669' : ot.status === '반려' ? '#e11d48' : '#d97706', 
                    padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {ot.status}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
                  <div style={{ color: '#888' }}>생성일:</div>
                  <div style={{ textAlign: 'right' }}>{ot.date}</div>
                  
                  <div style={{ color: '#888' }}>사용자명:</div>
                  <div style={{ textAlign: 'right' }}>{currentUser.name}</div>
                  
                  <div style={{ color: '#888' }}>부서명:</div>
                  <div style={{ textAlign: 'right' }}>{currentUser.department}</div>
                  
                  <div style={{ color: '#888' }}>신청일:</div>
                  <div style={{ textAlign: 'right' }}>{ot.date}</div>
                  
                  <div style={{ color: '#888' }}>근로시간:</div>
                  <div style={{ textAlign: 'right' }}>{ot.startTime} ~ {ot.endTime}</div>
                  
                  <div style={{ color: '#888' }}>연장근로 잔여시간:</div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold' }}>14:00</div>
                </div>

                <div style={{ borderTop: '1px solid #efefef', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {ot.status === '승인' ? <CheckCircle size={14} color="#10b981"/> : <XCircle size={14} color="#ef4444"/>}
                    {ot.status}
                  </div>
                  <div>{ot.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

export default Overtime;

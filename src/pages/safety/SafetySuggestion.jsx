import { useState, useContext, useEffect } from 'react';
import { ArrowLeft, Plus, MessageSquare, MapPin, CheckCircle2, Clock, Camera, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';

function SafetySuggestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);
  const { safetySuggestions, addSafetySuggestion } = useContext(DataContext);
  
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && safetySuggestions) {
      const item = safetySuggestions.find(m => m.id.toString() === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedItem(item);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode('detail');
      }
    }
  }, [location.search, safetySuggestions]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: '',
    isAnonymous: false,
    isPublic: true,
    photo: null
  });

  const myCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '스마트컴퍼니') : '스마트컴퍼니';
  
  const mySuggestions = safetySuggestions.filter(s => {
    if (s.companyId !== myCompanyId) return false;
    if (s.isPublic === false) {
      return currentUser?.roleCode === 'COMPANY_ADMIN' || s.userId === currentUser?.id;
    }
    return true;
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setFormData({ ...formData, photo: compressedDataUrl });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    addSafetySuggestion(
      currentUser.id,
      currentUser.name,
      myCompanyId,
      formData.title,
      formData.content,
      formData.location,
      formData.isAnonymous,
      formData.photo,
      formData.isPublic
    );

    alert('안전의견이 접수되었습니다.');
    setFormData({ title: '', content: '', location: '', isAnonymous: false, isPublic: true, photo: null });
    setViewMode('list');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '접수대기': return '#f59e0b';
      case '처리중': return '#3b82f6';
      case '조치완료': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => {
            if (viewMode === 'create' || viewMode === 'detail') {
              navigate(location.pathname, { replace: true });
              setViewMode('list');
              setSelectedItem(null);
            } else navigate('/dashboard');
          }} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>안전의견 접수</div>
          <div style={{ width: '24px' }}></div>
        </div>
      </header>

      <main style={{ padding: '16px' }}>
        {viewMode === 'list' && (
          <>
            {/* List View */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>사내 안전의견</h2>
              <button 
                onClick={() => setViewMode('create')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                <Plus size={16} /> 새 의견 등록
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mySuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p>등록된 안전의견이 없습니다.</p>
                </div>
              ) : (
                mySuggestions.map(suggestion => (
                  <div 
                    key={suggestion.id} 
                    onClick={() => { 
                      navigate(`?id=${suggestion.id}`, { replace: true });
                      setSelectedItem(suggestion); 
                      setViewMode('detail'); 
                    }}
                    style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: `${getStatusColor(suggestion.status)}20`, color: getStatusColor(suggestion.status) }}>
                          {suggestion.status === '접수대기' && <Clock size={12} />}
                          {suggestion.status === '조치완료' && <CheckCircle2 size={12} />}
                          {suggestion.status}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                          {suggestion.isAnonymous ? '익명' : suggestion.userName}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {(() => {
                          try {
                            const d = new Date(suggestion.createdAt);
                            return isNaN(d.getTime()) ? suggestion.createdAt : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          } catch { return suggestion.createdAt; }
                        })()}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
                      {suggestion.title}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {viewMode === 'create' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' }}>새 의견 작성</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>제목</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="예: 휴게실 환풍구 소음 발생"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>발생 장소 (선택)</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  placeholder="예: 3층 직원 휴게실"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>내용</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="발견하신 위험 요소나 개선 의견을 상세히 적어주세요."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box', minHeight: '120px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>사진 첨부 (선택)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px dashed #cbd5e1', cursor: 'pointer' }}>
                    <Camera size={24} color="#64748b" />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>사진 추가</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                  {formData.photo && (
                    <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={formData.photo} alt="첨부" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      <button 
                        onClick={() => setFormData({...formData, photo: null})}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="anonymous" 
                    checked={formData.isAnonymous} 
                    onChange={e => setFormData({...formData, isAnonymous: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                  />
                  <label htmlFor="anonymous" style={{ fontSize: '14px', color: '#334155', cursor: 'pointer', flex: 1 }}>익명으로 제보하기</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="public" 
                    checked={formData.isPublic} 
                    onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                  />
                  <label htmlFor="public" style={{ fontSize: '14px', color: '#334155', cursor: 'pointer', flex: 1 }}>전직원에게 내용 공개하기 <span style={{fontSize: '12px', color: '#94a3b8'}}>(체크 해제시 관리자에게만 보입니다)</span></label>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '8px' }}
              >
                안전의견 제출하기
              </button>
            </div>
          </div>
        )}

        {viewMode === 'detail' && selectedItem && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: `${getStatusColor(selectedItem.status)}20`, color: getStatusColor(selectedItem.status) }}>
                  {selectedItem.status === '접수대기' && <Clock size={14} />}
                  {selectedItem.status === '조치완료' && <CheckCircle2 size={14} />}
                  {selectedItem.status}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                  {selectedItem.isAnonymous ? '익명' : selectedItem.userName}
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                {(() => {
                  try {
                    const d = new Date(selectedItem.createdAt);
                    return isNaN(d.getTime()) ? selectedItem.createdAt : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  } catch { return selectedItem.createdAt; }
                })()}
              </span>
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>{selectedItem.title}</h2>
            
            {selectedItem.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <MapPin size={16} /> <span style={{ fontWeight: 'bold' }}>장소:</span> {selectedItem.location}
              </div>
            )}
            
            <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {selectedItem.content}
            </div>

            {selectedItem.photo && (
              <div style={{ marginBottom: '24px' }}>
                <img src={selectedItem.photo} alt="첨부 사진" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
              </div>
            )}
            
            {selectedItem.feedback && (
              <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0d9488', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> 관리자 답변
                </div>
                <div style={{ fontSize: '14px', color: '#115e59', lineHeight: '1.5' }}>{selectedItem.feedback}</div>
                {selectedItem.feedbackImage && (
                  <div style={{ marginTop: '12px' }}>
                    <img src={selectedItem.feedbackImage} alt="답변 첨부" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default SafetySuggestion;

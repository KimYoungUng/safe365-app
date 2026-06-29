import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Eye, Edit3, X, Plus, Trash2, Camera, Paperclip, FileText, Download } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function Notice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);
  const { notices, addNotice, deleteNotice, editNotice, companies } = useContext(DataContext);

  const [mode, setMode] = useState('list'); // 'list', 'detail', 'write'
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && notices) {
      const item = notices.find(m => m.id.toString() === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedNotice(item);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode('detail');
      }
    }
  }, [location.search, notices]);

  const [formData, setFormData] = useState({ title: '', content: '', targetCompanyId: '', image: null, file: null, fileName: '' });

  const isSuper = currentUser?.roleCode === 'SUPER_ADMIN';
  const isAdmin = currentUser?.roleCode === 'COMPANY_ADMIN' || isSuper;

  // 필터링: SUPER는 모든 공지 확인 가능, 그 외는 targetCompanyId가 'ALL'이거나 소속 회사와 일치하는 것만.
  const filteredNotices = notices.filter(n => {
    if (isSuper) return true;
    return n.targetCompanyId === 'ALL' || n.targetCompanyId === currentUser?.companyId || !n.targetCompanyId; // 기본 모의데이터 호환성 위해 !n.targetCompanyId 허용
  });

  const openNotice = (notice) => {
    const isUnread = !notice.readBy || !notice.readBy.includes(currentUser.id);
    const updatedReadBy = notice.readBy ? [...notice.readBy] : [];
    if (isUnread) {
      updatedReadBy.push(currentUser.id);
    }
    
    const updatedNotice = { ...notice, views: (notice.views || 0) + 1, readBy: updatedReadBy };
    if(editNotice) {
      editNotice(notice.id, { views: updatedNotice.views, readBy: updatedReadBy });
    }
    navigate(`?id=${notice.id}`, { replace: true });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedNotice(updatedNotice);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode('detail');
  };

  const handleWriteClick = () => {
    setFormData({ 
      title: '', 
      content: '', 
      targetCompanyId: isSuper ? 'ALL' : currentUser.companyId,
      image: null,
      file: null,
      fileName: ''
    });
    navigate(location.pathname, { replace: true });
    setMode('write');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 150 * 1024 * 1024) {
        alert('파일 크기는 150MB 이하만 가능합니다.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) { height *= maxDim / width; width = maxDim; }
          } else {
            if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setFormData(prev => ({ ...prev, image: compressedDataUrl }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 150 * 1024 * 1024) {
        alert('첨부파일 크기는 150MB 이하만 가능합니다.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, file: event.target.result, fileName: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    addNotice({
      title: formData.title,
      content: formData.content,
      author: currentUser.name,
      companyId: currentUser.companyId,
      targetCompanyId: formData.targetCompanyId,
      image: formData.image,
      file: formData.file,
      fileName: formData.fileName
    });
    setMode('list');
    alert('공지사항이 등록되었습니다.');
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteNotice(id);
      setMode('list');
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', position: 'relative' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => {
          if (mode !== 'list') setMode('list');
          else navigate(-1);
        }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>
          {mode === 'list' ? '공지사항' : mode === 'write' ? '공지사항 작성' : '공지사항 상세'}
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        {mode === 'list' && (
          <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={handleWriteClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px', border: 'none', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                  <Edit3 size={16} /> 글쓰기
                </button>
              </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredNotices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>등록된 공지사항이 없습니다.</div>
              ) : (
                filteredNotices.map(notice => {
                  const isUnread = !notice.readBy || !notice.readBy.includes(currentUser.id);
                  return (
                  <div key={notice.id} onClick={() => openNotice(notice)} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontWeight: isUnread ? 'bold' : 'normal', fontSize: '16px', color: isUnread ? '#111' : '#666', flex: 1 }}>
                        <span style={{ color: 'var(--primary)', marginRight: '8px' }}>
                          {notice.targetCompanyId === 'ALL' ? '[전체]' : 
                           (companies && companies.find(c => c.id === notice.targetCompanyId)?.name) ? `[${companies.find(c => c.id === notice.targetCompanyId).name}]` : ''}
                        </span>
                        {notice.title}
                        {isUnread && <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', verticalAlign: 'middle' }}>N</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} /> {notice.author}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {(notice.date || '').substring(0, 10)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {notice.views || 0}</div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {mode === 'write' && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isSuper && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>대상 회사</label>
                  <select 
                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb' }}
                    value={formData.targetCompanyId} 
                    onChange={(e) => setFormData({...formData, targetCompanyId: e.target.value})}
                  >
                    <option value="ALL">전체 회사</option>
                    {companies?.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제목</label>
                <input type="text" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} placeholder="공지사항 제목" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>내용</label>
                <textarea style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', minHeight: '200px', boxSizing: 'border-box', resize: 'none' }} placeholder="공지사항 내용" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>첨부 파일 및 이미지</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #cbd5e1', cursor: 'pointer', flexShrink: 0 }}>
                    <Camera size={24} color="#64748b" />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>사진 추가</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #cbd5e1', cursor: 'pointer', flexShrink: 0 }}>
                    <Paperclip size={24} color="#64748b" />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>파일 첨부</span>
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>

                  {formData.image && (
                    <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                      <img src={formData.image} alt="첨부 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      <button type="button" onClick={() => setFormData({...formData, image: null})} style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {formData.file && (
                    <div style={{ position: 'relative', width: '80px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', boxSizing: 'border-box', flexShrink: 0 }}>
                      <FileText size={20} color="#475569" />
                      <span style={{ fontSize: '10px', color: '#475569', marginTop: '4px', textAlign: 'center', wordBreak: 'break-all', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {formData.fileName}
                      </span>
                      <button type="button" onClick={() => setFormData({...formData, file: null, fileName: ''})} style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                등록하기
              </button>
            </form>
          </div>
        )}

        {mode === 'detail' && selectedNotice && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #efefef', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--primary)', fontSize: '12px' }}>i</span> 정보
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(selectedNotice.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                  <Trash2 size={14} /> 삭제
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {(selectedNotice.date || '').substring(0, 10)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={14} color="var(--primary)" /> {selectedNotice.author}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} color="var(--primary)" /> {selectedNotice.views}</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>제목</div>
              <div style={{ padding: '12px', border: '1px solid #efefef', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }}>{selectedNotice.title}</div>
            </div>
            
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>내용</div>
              <div style={{ padding: '16px', border: '1px solid #efefef', borderRadius: '8px', minHeight: '200px', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '15px' }}>
                {selectedNotice.content}
                
                {selectedNotice.image && (
                  <div style={{ marginTop: '20px' }}>
                    <img src={selectedNotice.image} alt="첨부 이미지" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  </div>
                )}
              </div>
            </div>

            {selectedNotice.file && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>첨부파일</div>
                <a href={selectedNotice.file} download={selectedNotice.fileName} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f1f5f9', borderRadius: '8px', textDecoration: 'none', color: '#334155', fontWeight: 'bold', fontSize: '14px' }}>
                  <FileText size={18} /> {selectedNotice.fileName} <Download size={16} color="#64748b" style={{ marginLeft: '8px' }} />
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notice;

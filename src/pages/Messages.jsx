import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Filter, Search, User, Calendar, Edit3, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, users } = useContext(AuthContext);
  const { messages, sendMessage, readMessage } = useContext(DataContext);
  
  const [activeTab, setActiveTab] = useState('받은메시지');
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && messages) {
      const item = messages.find(m => m.id.toString() === id);
      if (item) {
        setSelectedMessage(item);
        if (item.receiverId === currentUser?.id && !item.read) {
          readMessage(item.id);
        }
      }
    }
  }, [location.search, messages, currentUser?.id, readMessage]);

  const [formData, setFormData] = useState({
    receiverId: '',
    title: '',
    content: ''
  });

  const receivedMessages = messages.filter(m => m.receiverId === currentUser?.id);
  const sentMessages = messages.filter(m => m.senderId === currentUser?.id);
  const displayMessages = activeTab === '받은메시지' ? receivedMessages : sentMessages;

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : id;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.receiverId || !formData.title || !formData.content) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    sendMessage(currentUser.id, currentUser.name, formData.receiverId, formData.title, formData.content);
    alert('메시지를 성공적으로 보냈습니다.');
    setShowForm(false);
    setActiveTab('보낸메시지');
    setFormData({ receiverId: '', title: '', content: '' });
  };

  const openMessage = (msg) => {
    if (activeTab === '받은메시지' && !msg.read) {
      readMessage(msg.id);
    }
    navigate(`?id=${msg.id}`, { replace: true });
    setSelectedMessage(msg);
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', position: 'relative' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => {
          if (selectedMessage || showForm) {
            navigate(location.pathname, { replace: true });
            setSelectedMessage(null);
            setShowForm(false);
          } else {
            navigate(-1);
          }
        }} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>메시지</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
        {!showForm && !selectedMessage && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setShowForm(true)} style={{ flex: 1, display:'flex', justifyContent:'center', alignItems:'center', gap:'4px', padding:'12px', border:'none', borderRadius:'12px', backgroundColor:'var(--primary)', color:'white', fontWeight:'bold', cursor:'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
              <Edit3 size={16} /> 메시지 보내기
            </button>
          </div>
        )}

        {showForm ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>새 메시지 작성</h3>
              <X size={20} color="#888" style={{ cursor: 'pointer' }} onClick={() => setShowForm(false)} />
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>받는 사람</label>
                <select 
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                  value={formData.receiverId || ''} 
                  onChange={(e) => setFormData({...formData, receiverId: e.target.value})} 
                  required
                >
                  <option value="" disabled>수신자를 선택해주세요</option>
                  {users
                    .filter(u => {
                      if (u.id === currentUser?.id) return false;
                      if (currentUser?.roleCode === 'SUPER_ADMIN') {
                        return u.roleCode === 'COMPANY_ADMIN';
                      } else if (currentUser?.roleCode === 'COMPANY_ADMIN') {
                        return u.roleCode === 'SUPER_ADMIN' || u.companyId === currentUser?.companyId;
                      } else {
                        return u.companyId === currentUser?.companyId;
                      }
                    })
                    .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.department} / {user.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>제목</label>
                <input type="text" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} placeholder="메시지 제목을 입력하세요" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>내용</label>
                <textarea style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', backgroundColor: '#f9fafb', minHeight: '120px', boxSizing: 'border-box', resize: 'none' }} placeholder="메시지 내용을 입력하세요" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required></textarea>
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                <Send size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 보내기
              </button>
            </form>
          </div>
        ) : selectedMessage ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #efefef', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', margin: 0, lineHeight: 1.4 }}>{selectedMessage.title}</h3>
              <X size={20} color="#888" style={{ cursor: 'pointer', minWidth: '20px' }} onClick={() => { navigate(location.pathname, { replace: true }); setSelectedMessage(null); }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#888' }}>{activeTab === '받은메시지' ? '보낸 사람:' : '받는 사람:'}</span>
                <span style={{ fontWeight: 'bold' }}>
                  {activeTab === '받은메시지' 
                    ? `${getUserName(selectedMessage.senderId)} (${selectedMessage.senderId})`
                    : `${getUserName(selectedMessage.receiverId)} (${selectedMessage.receiverId})`
                  }
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#888' }}>보낸 시간:</span>
                <span>{selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleDateString() : selectedMessage.date}</span>
              </div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', fontSize: '15px', lineHeight: 1.6, color: '#333', minHeight: '150px', whiteSpace: 'pre-wrap' }}>
              {selectedMessage.content}
            </div>
            <button onClick={() => { navigate(location.pathname, { replace: true }); setSelectedMessage(null); }} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#555', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '24px' }}>
              목록으로 돌아가기
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#e5e7eb', padding: '4px' }}>
              <div onClick={() => setActiveTab('받은메시지')} style={{ flex: 1, textAlign: 'center', padding: '12px', cursor: 'pointer', backgroundColor: activeTab === '받은메시지' ? 'white' : 'transparent', color: activeTab === '받은메시지' ? '#111' : '#666', fontWeight: activeTab === '받은메시지' ? 'bold' : 'normal', borderRadius: '10px', transition: 'all 0.2s', boxShadow: activeTab === '받은메시지' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                받은메시지
              </div>
              <div onClick={() => setActiveTab('보낸메시지')} style={{ flex: 1, textAlign: 'center', padding: '12px', cursor: 'pointer', backgroundColor: activeTab === '보낸메시지' ? 'white' : 'transparent', color: activeTab === '보낸메시지' ? '#111' : '#666', fontWeight: activeTab === '보낸메시지' ? 'bold' : 'normal', borderRadius: '10px', transition: 'all 0.2s', boxShadow: activeTab === '보낸메시지' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                보낸메시지
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>메시지가 없습니다.</div>
              ) : (
                displayMessages.map(msg => (
                  <div key={msg.id} onClick={() => openMessage(msg)} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer', border: activeTab === '받은메시지' && !msg.read ? '2px solid #d8b4fe' : '2px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontWeight: activeTab === '받은메시지' && !msg.read ? 'bold' : 'normal', fontSize: '16px', color: '#111', flex: 1, paddingRight: '12px' }}>{msg.title}</div>
                      {activeTab === '받은메시지' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', color: msg.read ? '#9ca3af' : 'var(--primary)' }}>
                          {!msg.read && <div style={{width:'6px', height:'6px', borderRadius:'50%', backgroundColor:'var(--primary)'}}></div>}
                          {msg.read ? '읽음' : '안읽음'}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} /> {activeTab === '받은메시지' ? getUserName(msg.senderId) : getUserName(msg.receiverId)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : msg.date}
                      </div>
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

export default Messages;

import { useState, useContext, useEffect, useRef } from 'react';
import { ArrowLeft, User, Phone, MapPin, Lock, Save, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';

function Profile() {
  const navigate = useNavigate();
  const { currentUser, updateEmployee } = useContext(AuthContext);
  const { companies } = useContext(DataContext);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    password: '',
    companyName: '',
    department: '',
    role: ''
  });

  useEffect(() => {
    if (currentUser) {
      const myCompany = companies.find(c => c.id === currentUser.companyId);
      const actualCompanyName = (myCompany ? myCompany.name : null) || currentUser.companyName || currentUser.companyId || '스마트컴퍼니';

      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        password: currentUser.password || '',
        companyName: actualCompanyName,
        department: currentUser.department || '',
        role: currentUser.role || ''
      });
      if (currentUser.savedSignature) {
        setSavedSignature(currentUser.savedSignature);
      }
    }
  }, [currentUser, companies]);

  const getCoordinates = (nativeEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      return { 
        offsetX: nativeEvent.touches[0].clientX - rect.left, 
        offsetY: nativeEvent.touches[0].clientY - rect.top 
      };
    } else {
      return { 
        offsetX: nativeEvent.clientX - rect.left, 
        offsetY: nativeEvent.clientY - rect.top 
      };
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!canvasRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !canvasRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleClearSavedSignature = () => {
    setSavedSignature(null);
    setHasSigned(false);
  };

  if (!currentUser) return null;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (!formData.password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    const updates = { ...formData };
    if (savedSignature) {
      updates.savedSignature = savedSignature;
    } else if (hasSigned && canvasRef.current) {
      updates.savedSignature = canvasRef.current.toDataURL('image/png');
    } else {
      updates.savedSignature = null;
    }

    updateEmployee(currentUser.id, updates);
    alert('내 정보가 성공적으로 변경되었습니다.');
    navigate('/dashboard');
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate('/dashboard')} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>내 정보 수정</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '24px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', marginBottom: '12px' }}>
              <User size={40} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>{currentUser.name}</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>{currentUser.department} · {currentUser.role}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>아이디: {currentUser.id}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <User size={16} /> 이름
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Lock size={16} /> 비밀번호
              </label>
              <input 
                type="text" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Phone size={16} /> 연락처
              </label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="예: 010-1234-5678"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <MapPin size={16} /> 주소
              </label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="주소를 입력해주세요"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Briefcase size={16} /> 회사명
              </label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                disabled={true}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', fontSize: '15px', boxSizing: 'border-box', color: '#64748b' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Briefcase size={16} /> 부서명
              </label>
              <input 
                type="text" 
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={currentUser.roleCode !== 'COMPANY_ADMIN'}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: currentUser.roleCode !== 'COMPANY_ADMIN' ? '#f1f5f9' : '#f8fafc', fontSize: '15px', boxSizing: 'border-box', color: currentUser.roleCode !== 'COMPANY_ADMIN' ? '#64748b' : '#333' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Briefcase size={16} /> 직급
              </label>
              <input 
                type="text" 
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={currentUser.roleCode !== 'COMPANY_ADMIN'}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: currentUser.roleCode !== 'COMPANY_ADMIN' ? '#f1f5f9' : '#f8fafc', fontSize: '15px', boxSizing: 'border-box', color: currentUser.roleCode !== 'COMPANY_ADMIN' ? '#64748b' : '#333' }}
              />
            </div>

            {/* 나의 서명 관리 영역 */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                <Save size={16} /> 나의 서명 관리
              </label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                {savedSignature ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <img src={savedSignature} alt="저장된 서명" style={{ height: '100px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    <button 
                      onClick={handleClearSavedSignature} 
                      style={{ padding: '8px 16px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      등록된 서명 삭제 후 새로 그리기
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white' }}>
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={150}
                        style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button 
                        onClick={clearCanvas} 
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
                      >
                        지우기
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
                      위 영역에 서명을 그리고 하단의 [변경사항 저장]을 누르시면 안전하게 보관됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <button 
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            <Save size={20} /> 변경사항 저장
          </button>
        </div>
      </main>
    </div>
  );
}

export default Profile;

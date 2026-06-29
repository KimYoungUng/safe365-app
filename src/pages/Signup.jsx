import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { ArrowLeft, Search, Building2 } from 'lucide-react';

function Signup() {
  const navigate = useNavigate();
  const { addPendingUser } = useContext(AuthContext);
  const { companies } = useContext(DataContext);

  const [formData, setFormData] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    name: '',
    birthDate: '',
    phone: '',
    address: '',
    companyId: '',
    companyName: ''
  });

  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyResults, setShowCompanyResults] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // 회사 검색 로직 (입력값이 있을 때만 필터링)
  const filteredCompanies = companySearchTerm.trim() !== '' 
    ? companies.filter(c => c.name.toLowerCase().includes(companySearchTerm.toLowerCase()))
    : [];

  const handleCompanySelect = (company) => {
    setFormData({
      ...formData,
      companyId: company.id,
      companyName: company.name
    });
    setCompanySearchTerm(company.name);
    setShowCompanyResults(false);
  };

  const handleSignup = () => {
    if (!formData.id || !formData.password || !formData.passwordConfirm || !formData.name || !formData.birthDate || !formData.phone || !formData.address) {
      setErrorMsg('모든 정보를 입력해주세요.');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!formData.companyId) {
      setErrorMsg('소속 회사를 검색 후 선택해주세요.');
      return;
    }

    try {
      const { passwordConfirm, ...userData } = formData;
      addPendingUser(userData);
      setSuccessMsg(true);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (successMsg) {
    return (
      <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px 24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '320px', width: '100%' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#d1fae5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>가입 요청 완료</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
            입력하신 정보로 회원가입 요청이 접수되었습니다.<br/>
            소속 회사의 관리자가 승인한 후 로그인하실 수 있습니다.
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            로그인 화면으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header className="header" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => navigate('/')} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>회원가입</div>
          <div style={{ width: '24px' }}></div>
        </div>
      </header>

      <main style={{ padding: '24px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>기본 정보 입력</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>아이디</label>
              <input 
                type="text" 
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
                placeholder="사용할 아이디를 입력하세요"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>비밀번호</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="비밀번호를 입력하세요"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>비밀번호 확인</label>
              <input 
                type="password" 
                value={formData.passwordConfirm}
                onChange={e => setFormData({...formData, passwordConfirm: e.target.value})}
                placeholder="비밀번호를 다시 한 번 입력하세요"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>이름</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="본인 이름을 입력하세요"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>생년월일</label>
              <input 
                type="date" 
                value={formData.birthDate}
                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>전화번호</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="예: 010-1234-5678"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>주소</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="예: 서울특별시 강남구 테헤란로 123"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>소속 회사 검색</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={companySearchTerm}
                  onChange={e => {
                    setCompanySearchTerm(e.target.value);
                    setShowCompanyResults(true);
                    if (formData.companyId) {
                      setFormData({...formData, companyId: '', companyName: ''});
                    }
                  }}
                  onFocus={() => {
                    if (companySearchTerm.trim() !== '') setShowCompanyResults(true);
                  }}
                  placeholder="회사명을 일부 입력하여 검색하세요"
                  style={{ width: '100%', padding: '14px', paddingLeft: '40px', borderRadius: '12px', border: formData.companyId ? '1px solid #10b981' : '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                />
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {showCompanyResults && companySearchTerm.trim() !== '' && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '8px', zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => handleCompanySelect(c)}
                        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                      >
                        <Building2 size={16} color="#64748b" />
                        <span style={{ fontSize: '14px', color: '#334155' }}>{c.name}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
              {formData.companyId && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {formData.companyName} 선택됨
                </div>
              )}
            </div>
          </div>

          {errorMsg && <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>{errorMsg}</div>}

          <button 
            onClick={handleSignup}
            style={{ width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '24px' }}
          >
            가입 요청하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default Signup;

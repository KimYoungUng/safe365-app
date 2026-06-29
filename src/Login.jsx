import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { DataContext } from './context/DataContext';
import mainLogo from './assets/logo_wide.png';
import { CheckSquare, Square } from 'lucide-react';

function Login() {
  const [showPopup, setShowPopup] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem('savedLoginId');
    if (savedId) {
      setId(savedId);
      setRememberId(true);
    }
    const savedAutoLogin = localStorage.getItem('autoLogin') === 'true';
    if (savedAutoLogin) {
      setAutoLogin(true);
    }
  }, []);
  
  const { login, users, pendingUsers } = useContext(AuthContext);
  const { companies } = useContext(DataContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!id || !password) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const user = users.find(u => u.id === id && u.password === password);
    if (user) {
      // 최고관리자가 아닌 경우 고객사 상태 확인
      if (user.roleCode !== 'SUPER_ADMIN') {
        const uCompanyId = user.companyId || user.companyName || '스마트컴퍼니';
        const company = companies.find(c => c.id === uCompanyId || c.name === uCompanyId);
        
        if (company && company.status === '정지') {
          setErrorMsg('해당 소속 회사는 이용이 정지되었습니다. 플랫폼 관리자에게 문의하세요.');
          return;
        }
      }

      const success = login(id, password);
      if (success) {
        if (rememberId) {
          localStorage.setItem('savedLoginId', id);
        } else {
          localStorage.removeItem('savedLoginId');
        }
        if (autoLogin) {
          localStorage.setItem('autoLogin', 'true');
        } else {
          localStorage.setItem('autoLogin', 'false');
        }
        navigate('/dashboard'); // 메인 화면으로 이동
      }
    } else {
      const pendingUser = pendingUsers?.find(u => u.id === id && u.password === password);
      if (pendingUser) {
        setErrorMsg('가입 승인 중입니다. 소속 회사의 관리자 승인 후 로그인할 수 있습니다.');
      } else {
        setErrorMsg('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    }
  };

  return (
    <div className="app-container">
      <div className="login-container">
        <div className="login-header" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={mainLogo} alt="세이프 365" style={{ width: '280px', objectFit: 'contain', margin: '40px auto 20px' }} />
        </div>

        <div className="login-form">
          <div className="input-group">
            <input 
              type="text" 
              placeholder="아이디를 입력하세요" 
              value={id}
              onChange={e => setId(e.target.value)}
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="비밀번호를 입력하세요" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</p>}

          <div className="login-options" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div className="checkbox-group" style={{ display: 'flex', gap: '16px' }}>
              <div 
                onClick={() => setRememberId(!rememberId)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: rememberId ? '#2563eb' : '#64748b', fontSize: '14px', fontWeight: rememberId ? '600' : '400', userSelect: 'none' }}
              >
                {rememberId ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
                아이디 저장
              </div>
              <div 
                onClick={() => setAutoLogin(!autoLogin)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: autoLogin ? '#2563eb' : '#64748b', fontSize: '14px', fontWeight: autoLogin ? '600' : '400', userSelect: 'none' }}
              >
                {autoLogin ? <CheckSquare size={18} color="#2563eb" /> : <Square size={18} color="#94a3b8" />}
                자동 로그인
              </div>
            </div>
            <button 
              className="find-link" 
              onClick={() => setShowPopup(true)}
            >
              아이디/비밀번호 찾기
            </button>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            로그인
          </button>
          <button className="signup-btn" onClick={() => navigate('/signup')} style={{ width: '100%', padding: '16px', backgroundColor: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px', transition: 'all 0.2s' }}>
            회원가입
          </button>
        </div>
      </div>

      {/* Find ID/PW Popup Modal */}
      {showPopup && (
        <div className="modal-overlay" onClick={() => setShowPopup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">계정 찾기 안내</div>
            <div className="modal-desc">
              아이디 또는 비밀번호를 잊으셨나요?<br />
              아래 연락처로 문의해 주시기 바랍니다.<br /><br />
              <strong>📞 02-1234-5678</strong> (인사팀)
            </div>
            <button className="modal-btn" onClick={() => setShowPopup(false)}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

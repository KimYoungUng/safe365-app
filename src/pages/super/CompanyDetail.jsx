import { useState, useContext, useEffect } from 'react';
import { ArrowLeft, Building2, Users, MapPin, Phone, User, FileText, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';

function CompanyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { companies } = useContext(DataContext);
  const { users, addEmployee, pendingUsers, resetPassword, resetPendingUserPassword } = useContext(AuthContext);

  const [company, setCompany] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [companyPendingUsers, setCompanyPendingUsers] = useState([]);
  const [showEmployees, setShowEmployees] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ id: '', password: '', name: '', phone: '', department: '인사팀' });

  const handleAddAdmin = () => {
    if (!adminForm.id || !adminForm.password || !adminForm.name) {
      alert('아이디, 비밀번호, 이름은 필수입니다.');
      return;
    }
    try {
      addEmployee({
        id: adminForm.id,
        password: adminForm.password,
        name: adminForm.name,
        companyId: company.id,
        companyName: company.name,
        role: '관리자',
        roleCode: 'COMPANY_ADMIN',
        department: adminForm.department,
        phone: adminForm.phone || '010-0000-0000',
        companyAddress: company.address || '',
        ceoName: company.representative || '',
        companyPhone: company.contact || ''
      });
      alert('임직원(관리자) 계정이 성공적으로 생성되었습니다.');
      setShowAddAdminModal(false);
      setAdminForm({ id: '', password: '', name: '', phone: '', department: '인사팀' });
      setShowEmployees(true); // 새로 생성한 계정을 보여주기 위해 확장
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    const foundCompany = companies.find(c => c.id === id);
    if (foundCompany) {
      setCompany(foundCompany);
      // 직원 수 계산 (users 데이터에서 companyId가 같은 사용자 수)
      const cUsers = users ? users.filter(u => u.companyId === id) : [];
      setCompanyUsers(cUsers);
      setEmployeeCount(cUsers.length);
      const cPending = pendingUsers ? pendingUsers.filter(u => u.companyId === id) : [];
      setCompanyPendingUsers(cPending);
    }
  }, [id, companies, users, pendingUsers]);

  if (!company) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>고객사를 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px' }}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', margin: 0 }}>고객사 상세 정보</h1>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 기본 정보 */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {company.logo ? (
                <img src={company.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={28} color="#64748b" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#111' }}>{company.name}</h2>
                <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', backgroundColor: company.status === '활성' ? '#dcfce7' : '#fee2e2', color: company.status === '활성' ? '#16a34a' : '#ef4444' }}>
                  {company.status}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>회사 ID: {company.id} | 가입일: {company.joinedAt}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>대표자</div>
                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{company.representative}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>대표 연락처</div>
                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{company.contact}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>담당자</div>
                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{company.managerName || '-'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>담당자 연락처</div>
                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{company.managerPhone || '-'}</div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <MapPin size={16} color="#94a3b8" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>회사 주소</div>
              <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{company.address || '-'}</div>
            </div>
          </div>
        </div>

        {/* 연동된 직원 수 */}
        <div 
          onClick={() => setShowEmployees(!showEmployees)}
          style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={24} color="#3b82f6" />
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>연동된 직원 수</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
                {employeeCount} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>명</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowAddAdminModal(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', color: '#3b82f6', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Plus size={14} /> 계정 생성
              </button>
              {showEmployees ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
            </div>
          </div>
          
          {showEmployees && companyUsers.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {companyUsers.map(u => (
                <div 
                  key={u.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedUserId(expandedUserId === u.id ? null : u.id);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        {u.name.substring(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.department} | {u.role}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      {u.roleCode === 'COMPANY_ADMIN' ? '관리자' : '사원'}
                    </div>
                  </div>
                  
                  {expandedUserId === u.id && (
                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '13px', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#64748b', marginRight: '8px' }}>로그인 아이디:</span>
                        <strong>{u.id}</strong>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`${u.name}님의 비밀번호를 'password'로 초기화하시겠습니까?`)) {
                            resetPassword(u.id);
                            alert('초기화되었습니다.');
                          }
                        }}
                        style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        비밀번호 초기화
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 가입 승인 대기 목록 */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => setShowPending(!showPending)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#d97706" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#111' }}>가입 승인 대기</h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>대기 중인 사용자: {companyPendingUsers.length}명</div>
              </div>
            </div>
            {showPending ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
          </div>
          
          {showPending && companyPendingUsers.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {companyPendingUsers.map(u => (
                <div 
                  key={u.id} 
                  style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        {u.name.substring(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>아이디: {u.id}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`${u.name}님의 비밀번호를 'password'로 초기화하시겠습니까?`)) {
                          resetPendingUserPassword(u.id);
                          alert('초기화되었습니다.');
                        }
                      }}
                      style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      비밀번호 초기화
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사업자등록증 이미지 */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FileText size={24} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#111' }}>사업자등록증</h3>
          </div>
          
          {company.businessRegImage ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={company.businessRegImage} alt="사업자등록증" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#94a3b8' }}>
              <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <div>등록된 사업자등록증 이미지가 없습니다.</div>
            </div>
          )}
        </div>

      </main>

      {/* 임직원 계정 생성 모달 */}
      {showAddAdminModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>
            <button onClick={() => setShowAddAdminModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>
              임직원(관리자) 계정 생성
            </h3>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              해당 고객사를 관리할 임직원 계정을 생성합니다.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>로그인 아이디 *</label>
                <input type="text" value={adminForm.id} onChange={e => setAdminForm({...adminForm, id: e.target.value})} placeholder="예: admin_a" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>비밀번호 *</label>
                <input type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="비밀번호 입력" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>담당자 이름 *</label>
                <input type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} placeholder="예: 홍길동" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>부서 / 직책</label>
                <input type="text" value={adminForm.department} onChange={e => setAdminForm({...adminForm, department: e.target.value})} placeholder="예: 인사팀 / 팀장" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>연락처</label>
                <input type="text" value={adminForm.phone} onChange={e => setAdminForm({...adminForm, phone: e.target.value})} placeholder="예: 010-1234-5678" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              
              <button onClick={handleAddAdmin} style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}>
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDetail;

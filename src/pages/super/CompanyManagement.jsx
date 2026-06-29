import { useState, useContext } from 'react';
import { ArrowLeft, Search, Plus, Edit2, Building2, MoreVertical, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';

function CompanyManagement() {
  const navigate = useNavigate();
  const { companies, subscriptions, addCompany, updateCompany } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: '', representative: '', contact: '', status: '활성', managerName: '', managerPhone: '', address: '', businessRegImage: null, logo: null, latitude: '', longitude: '', workStartTime: '09:00', workEndTime: '18:00', useSafetyFeature: true, useWorkFeature: true, useEduFeature: true });

  const filteredCompanies = companies.filter(c => 
    c.name.includes(searchTerm) || c.representative.includes(searchTerm) || c.id.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({ name: '', representative: '', contact: '', status: '활성', managerName: '', managerPhone: '', address: '', businessRegImage: null, logo: null, latitude: '', longitude: '', workStartTime: '09:00', workEndTime: '18:00', useSafetyFeature: true, useWorkFeature: true, useEduFeature: true });
    setShowModal(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setFormData({ 
      name: company.name, representative: company.representative, contact: company.contact, status: company.status,
      managerName: company.managerName || '', managerPhone: company.managerPhone || '', address: company.address || '', businessRegImage: company.businessRegImage || null, logo: company.logo || null,
      latitude: company.latitude || '', longitude: company.longitude || '',
      workStartTime: company.workStartTime || '09:00', workEndTime: company.workEndTime || '18:00',
      useSafetyFeature: company.useSafetyFeature !== false,
      useWorkFeature: company.useWorkFeature !== false,
      useEduFeature: company.useEduFeature !== false
    });
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, businessRegImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.representative || !formData.contact) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    if (editingCompany) {
      updateCompany(editingCompany.id, formData);
    } else {
      addCompany({
        ...formData,
        joinedAt: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(false);
  };

  const toggleStatus = (company) => {
    const newStatus = company.status === '활성' ? '정지' : '활성';
    if (window.confirm(`[${company.name}] 고객사의 상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) {
      updateCompany(company.id, { status: newStatus });
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>고객사 관리</div>
          <div style={{ width: '24px' }}></div>
        </div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
        {/* Search and Action Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="고객사 이름, 대표명 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            style={{ backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '12px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <Plus size={18} /> 추가
          </button>
        </div>

        {/* Company List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCompanies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', backgroundColor: 'white', borderRadius: '12px' }}>검색 결과가 없습니다.</div>
          ) : (
            filteredCompanies.map(company => {
              const sub = subscriptions ? subscriptions.find(s => s.companyId === company.id) : null;
              const plan = sub ? sub.plan : '구독 없음';
              return (
              <div key={company.id} onClick={() => navigate(`/super/companies/${company.id}`)} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {company.logo ? (
                      <img src={company.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building2 size={24} color="#64748b" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#111' }}>{company.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {plan}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', backgroundColor: company.status === '활성' ? '#dcfce7' : '#fee2e2', color: company.status === '활성' ? '#16a34a' : '#ef4444' }}>
                        {company.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      대표: {company.representative} | 연락처: {company.contact}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      가입일: {company.joinedAt} | ID: {company.id}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(company); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={16} color="#475569" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleStatus(company); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MoreVertical size={16} color="#475569" />
                  </button>
                </div>
              </div>
            )})
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
              <X size={24} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '20px' }}>
              {editingCompany ? '고객사 정보 수정' : '새 고객사 등록'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>회사 로고 (선택)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      {formData.logo ? (
                        <img src={formData.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>로고</span>
                      )}
                    </div>
                    <label style={{ cursor: 'pointer', backgroundColor: '#e2e8f0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      업로드
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                    {formData.logo && (
                      <button onClick={() => setFormData({...formData, logo: null})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: '0' }}>삭제</button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>회사명</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="예: 미래소프트" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>대표자명</label>
                <input type="text" value={formData.representative} onChange={e => setFormData({...formData, representative: e.target.value})} placeholder="예: 홍길동" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>대표 연락처</label>
                <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="예: 010-1234-5678" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>담당자명</label>
                <input type="text" value={formData.managerName} onChange={e => setFormData({...formData, managerName: e.target.value})} placeholder="예: 김담당" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>담당자 연락처</label>
                <input type="text" value={formData.managerPhone} onChange={e => setFormData({...formData, managerPhone: e.target.value})} placeholder="예: 010-9876-5432" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>주소</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="회사 주소 입력" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>기본 출근 시간</label>
                  <input type="time" value={formData.workStartTime} onChange={e => setFormData({...formData, workStartTime: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>기본 퇴근 시간</label>
                  <input type="time" value={formData.workEndTime} onChange={e => setFormData({...formData, workEndTime: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>위도 (Latitude)</label>
                  <input type="number" step="0.000001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || ''})} placeholder="예: 37.4979" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>경도 (Longitude)</label>
                  <input type="number" step="0.000001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || ''})} placeholder="예: 127.0276" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>안전 관리 기능 사용</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>해당 고객사 직원의 대시보드에 안전 관리 탭 표시</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, useSafetyFeature: !formData.useSafetyFeature})}
                    style={{ 
                      width: '44px', height: '24px', backgroundColor: formData.useSafetyFeature ? '#10b981' : '#cbd5e1', 
                      borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', 
                      position: 'absolute', top: '2px', left: formData.useSafetyFeature ? '22px' : '2px', 
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>내 근무 관리 기능 사용</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>해당 고객사 직원의 대시보드에 출퇴근 및 근무 관리 탭 표시</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, useWorkFeature: !formData.useWorkFeature})}
                    style={{ 
                      width: '44px', height: '24px', backgroundColor: formData.useWorkFeature ? '#10b981' : '#cbd5e1', 
                      borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', 
                      position: 'absolute', top: '2px', left: formData.useWorkFeature ? '22px' : '2px', 
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>내 교육 관리 기능 사용</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>해당 고객사 직원의 대시보드에 교육 관리 탭 표시</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, useEduFeature: !formData.useEduFeature})}
                    style={{ 
                      width: '44px', height: '24px', backgroundColor: formData.useEduFeature ? '#10b981' : '#cbd5e1', 
                      borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' 
                    }}
                  >
                    <div style={{ 
                      width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', 
                      position: 'absolute', top: '2px', left: formData.useEduFeature ? '22px' : '2px', 
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>사업자등록증 업로드 (이미지)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
                {formData.businessRegImage && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>이미지 첨부 완료</div>
                )}
              </div>
              
              <button onClick={handleSave} style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}>
                {editingCompany ? '수정 완료' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyManagement;

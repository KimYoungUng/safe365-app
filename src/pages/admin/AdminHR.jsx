import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import SignatureCanvas from 'react-signature-canvas';
import ContractDocument from '../../components/ContractDocument';
import html2canvas from 'html2canvas';
import { ArrowLeft, Search, Filter, Mail, CheckCircle, Clock, FileSignature, X, PenTool, ExternalLink, Download, UserPlus, UserCheck, UserX } from 'lucide-react';

function AdminHR() {
  const navigate = useNavigate();
  const { currentUser, users, addEmployee, updateEmployee, pendingUsers, approvePendingUser, rejectPendingUser, removeEmployee } = useContext(AuthContext);
  const { contracts, requestSignature, companies } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('직원목록');
  const companyPendingUsers = pendingUsers?.filter(u => u.companyId === currentUser.companyId) || [];
  
  // 상태: 프로필 보기 / 계약서 작성 / 계약서 열람 / 직원 추가 / 프로필 수정
  const [selectedUser, setSelectedUser] = useState(null); 
  const [draftingUser, setDraftingUser] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // 프로필 수정 폼
  const [editProfileForm, setEditProfileForm] = useState({
    department: '',
    role: '',
    baseSalary: 0,
    phone: '',
    address: '',
    totalLeaves: 15
  });

  // 직원 추가 폼
  const [newUserForm, setNewUserForm] = useState({
    id: '',
    password: 'password', // 초기 비밀번호 기본값
    name: '',
    department: '',
    role: '사원',
    baseSalary: 3000000,
    phone: '',
    address: '',
    workStartTime: '', // 개별 출근시간
    workEndTime: '', // 개별 퇴근시간
    totalLeaves: 15
  });

  // 템플릿 기본값 (표준근로계약서 기반)
  const DEFAULT_CLAUSES = [
    { id: 1, title: '연차유급휴가', content: '근로기준법에서 정하는 바에 따라 부여함' },
    { id: 2, title: '사회보험 적용여부', content: '고용보험, 산재보험, 국민연금, 건강보험 적용' },
    { id: 3, title: '근로계약서 교부', content: '"갑"은 근로계약을 체결함과 동시에 본 계약서를 사본하여 "을"에게 교부함\n(교부요구가 없더라도 "갑"은 교부함(근로기준법 제17조 참조))' },
    { id: 4, title: '성실한 이행의무', content: '사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 함' },
    { id: 5, title: '기 타', content: '이 계약에 정함이 없는 사항은 근로기준법령에 의함' }
  ];

  // 계약서 폼 상태
  const [contractForm, setContractForm] = useState({
    startDate: '',
    endDate: '',
    workplace: '',
    jobDescription: '',
    workStart: '09:00',
    workEnd: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: '5',
    holiday: '일',
    baseSalary: '',
    bonus: '',
    extraPay: '',
    payDay: '25',
    payMethod: '예금통장에 입금',
    wageProvision: '', // 임금 관련 특약사항
    allowances: [], // 세부 수당 목록: [{ id, name, amount }]
    additionalClauses: []
  });

  // 사업주 서명 캔버스
  const canvasRef = useRef(null);
  const documentRef = useRef(null); // 계약서 캡처용 Ref
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  
  const [signType, setSignType] = useState('signature'); // 'signature' | 'stamp'
  const [stampImage, setStampImage] = useState(null);
  const stampInputRef = useRef(null);

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampImage(reader.result);
        setHasSigned(true);
      };
      reader.readAsDataURL(file);
    }
  };



  if (!currentUser) return null;

  // 동적 users 배열에서 필터링
  const companyEmployees = users.filter(
    u => u.companyId === currentUser.companyId && u.roleCode === 'EMPLOYEE'
  );

  const filteredEmployees = companyEmployees.filter(emp => 
    (emp.name && emp.name.includes(searchTerm)) || 
    (emp.department && emp.department.includes(searchTerm)) ||
    (searchTerm === '')
  );

  const getContractStatus = (userId) => {
    const userContracts = contracts.filter(c => c.userId === userId).sort((a,b) => b.id - a.id);
    if (userContracts.length === 0) return { status: '미작성', contract: null };
    return { status: userContracts[0].status, contract: userContracts[0] };
  };

  const openDraftForm = (user, e, existingContract = null) => {
    e?.stopPropagation();
    setSelectedUser(null);
    setDraftingUser(user);
    if (existingContract) {
      const isRenewal = existingContract.status === '서명완료';
      
      // 구버전(clause7, 8, 9) 데이터를 신버전(additionalClauses)으로 자동 마이그레이션
      let clauses = existingContract.additionalClauses;
      if (!clauses) {
        clauses = [];
        let idCounter = 1;
        if (existingContract.clause7) clauses.push({ id: idCounter++, title: '연차유급휴가', content: existingContract.clause7 });
        if (existingContract.clause8) clauses.push({ id: idCounter++, title: '근로계약서 교부', content: existingContract.clause8 });
        if (existingContract.clause9) clauses.push({ id: idCounter++, title: '기 타', content: existingContract.clause9 });
      }

      setContractForm({
        startDate: isRenewal ? new Date().toISOString().split('T')[0] : (existingContract.startDate || ''),
        endDate: isRenewal ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] : (existingContract.endDate || ''),
        workplace: existingContract.workplace || '',
        jobDescription: existingContract.jobDescription || '',
        workStart: existingContract.workStart || '',
        workEnd: existingContract.workEnd || '',
        breakStart: existingContract.breakStart || '',
        breakEnd: existingContract.breakEnd || '',
        workDays: existingContract.workDays || '',
        holiday: existingContract.holiday || '',
        baseSalary: existingContract.baseSalary || '',
        bonus: existingContract.bonus || '',
        extraPay: existingContract.extraPay || '',
        payDay: existingContract.payDay || '',
        payMethod: existingContract.payMethod || '',
        wageProvision: existingContract.wageProvision || '',
        allowances: existingContract.allowances || [],
        additionalClauses: clauses
      });
    } else {
      // 회사 템플릿 불러오기
      const savedTemplateStr = localStorage.getItem(`contractTemplate_${currentUser.companyId}`);
      let template = null;
      if (savedTemplateStr) {
        try { template = JSON.parse(savedTemplateStr); } catch(e){}
      }

      // 기본값 세팅
      const myCompany = companies.find(c => c.id === currentUser.companyId);
      const companyName = myCompany?.name || currentUser.companyId;

      setContractForm(prev => ({
        ...prev,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        workplace: `${companyName} 본사`,
        jobDescription: `${user.department} 소관 업무`,
        baseSalary: '',
        workStart: user.workStartTime || template?.workStart || '09:00',
        workEnd: user.workEndTime || template?.workEnd || '18:00',
        breakStart: template?.breakStart || '12:00',
        breakEnd: template?.breakEnd || '13:00',
        workDays: template?.workDays || '5',
        holiday: template?.holiday || '일',
        payDay: template?.payDay || '25',
        payMethod: template?.payMethod || '예금통장에 입금',
        wageProvision: template?.wageProvision || '',
        allowances: template?.allowances || [],
        additionalClauses: template?.additionalClauses || DEFAULT_CLAUSES
      }));
    }
  };

  useEffect(() => {
    if (draftingUser) {
      const savedSigStr = localStorage.getItem(`employerSignature_${currentUser.companyId}`);
      if (savedSigStr) {
        try {
          const savedSig = JSON.parse(savedSigStr);
          setSignType(savedSig.type);
          if (savedSig.type === 'stamp') {
            setStampImage(savedSig.data);
            setHasSigned(true);
          } else if (savedSig.type === 'signature') {
            setTimeout(() => {
              if (canvasRef.current) {
                canvasRef.current.fromDataURL(savedSig.data);
                setHasSigned(true);
              }
            }, 100);
          }
        } catch(e) {
          setHasSigned(false);
        }
      } else {
        setHasSigned(false);
        setSignType('signature');
        setStampImage(null);
      }
    }
  }, [draftingUser, currentUser.companyId]);

  const handleSaveTemplate = () => {
    const template = {
      workStart: contractForm.workStart,
      workEnd: contractForm.workEnd,
      breakStart: contractForm.breakStart,
      breakEnd: contractForm.breakEnd,
      workDays: contractForm.workDays,
      holiday: contractForm.holiday,
      payDay: contractForm.payDay,
      payMethod: contractForm.payMethod,
      wageProvision: contractForm.wageProvision,
      allowances: contractForm.allowances,
      additionalClauses: contractForm.additionalClauses
    };
    localStorage.setItem(`contractTemplate_${currentUser.companyId}`, JSON.stringify(template));
    alert('기본 템플릿이 저장되었습니다.');
  };

  const handleSaveEmployerSignature = () => {
    let dataUrl = '';
    if (signType === 'signature') {
      if (!canvasRef.current || canvasRef.current.isEmpty()) {
        alert('서명을 먼저 입력해주세요.');
        return;
      }
      dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL('image/png');
    } else {
      if (!stampImage) {
        alert('도장을 먼저 등록해주세요.');
        return;
      }
      dataUrl = stampImage;
    }
    
    localStorage.setItem(`employerSignature_${currentUser.companyId}`, JSON.stringify({
      type: signType,
      data: dataUrl
    }));
    alert('현재 서명/도장이 기본값으로 저장되었습니다.\n이후 계약서 작성 시 자동으로 불러옵니다.');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setContractForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClause = (templateId) => {
    if (!templateId) return;
    const template = DEFAULT_CLAUSES.find(c => c.id === parseInt(templateId));
    
    setContractForm(prev => ({
      ...prev,
      additionalClauses: [
        ...prev.additionalClauses,
        template 
          ? { id: Date.now(), title: template.title, content: template.content }
          : { id: Date.now(), title: '새 조항', content: '' }
      ]
    }));
  };

  const handleRemoveClause = (id) => {
    setContractForm(prev => ({
      ...prev,
      additionalClauses: prev.additionalClauses.filter(c => c.id !== id)
    }));
  };

  const handleClauseChange = (id, field, value) => {
    setContractForm(prev => ({
      ...prev,
      additionalClauses: prev.additionalClauses.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const handleMoveClause = (index, direction) => {
    setContractForm(prev => {
      const newClauses = [...prev.additionalClauses];
      if (direction === 'up' && index > 0) {
        [newClauses[index - 1], newClauses[index]] = [newClauses[index], newClauses[index - 1]];
      } else if (direction === 'down' && index < newClauses.length - 1) {
        [newClauses[index + 1], newClauses[index]] = [newClauses[index], newClauses[index + 1]];
      }
      return { ...prev, additionalClauses: newClauses };
    });
  };

  const handleAddAllowance = () => {
    setContractForm(prev => ({
      ...prev,
      allowances: [...(prev.allowances || []), { id: Date.now(), name: '', amount: '' }]
    }));
  };

  const handleRemoveAllowance = (id) => {
    setContractForm(prev => ({
      ...prev,
      allowances: prev.allowances.filter(a => a.id !== id)
    }));
  };

  const handleAllowanceChange = (id, field, value) => {
    setContractForm(prev => ({
      ...prev,
      allowances: prev.allowances.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      )
    }));
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      setHasSigned(false);
    }
  };

  const handleSubmitContract = async () => {
    if (!hasSigned) {
      alert('사업주 서명 또는 도장을 먼저 입력해주세요.');
      return;
    }
    if (window.confirm(`${draftingUser.name} 사원에게 이 내용으로 계약서 서명을 요청하시겠습니까?`)) {
      let employerSignature = '';
      if (signType === 'signature') {
        employerSignature = canvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      } else {
        employerSignature = stampImage;
      }
      
      const myCompany = companies.find(c => c.id === currentUser.companyId);
      const snapshot = {
        employer: {
          companyName: myCompany?.name || '',
          companyId: myCompany?.id || '',
          companyPhone: myCompany?.contact || '',
          companyAddress: myCompany?.address || '',
          ceoName: myCompany?.representative || ''
        },
        employee: {
          name: draftingUser.name || '',
          address: draftingUser.address || '',
          phone: draftingUser.contact || draftingUser.phone || ''
        }
      };

      const fullContractData = {
        ...contractForm,
        employerSignature,
        snapshot
      };

      await requestSignature(draftingUser.id, currentUser.companyId, fullContractData);
      alert('서명 요청이 발송되었습니다.');
      setDraftingUser(null);
    }
  };

  const handleAddEmployee = () => {
    if (!newUserForm.id || !newUserForm.name || !newUserForm.department) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }
    
    try {
      addEmployee({
        id: newUserForm.id,
        password: newUserForm.password,
        name: newUserForm.name,
        companyId: currentUser.companyId,
        department: newUserForm.department,
        role: newUserForm.role,
        roleCode: 'EMPLOYEE',
        phone: newUserForm.phone || '입력 대기',
        address: newUserForm.address || '주소 대기',
        workStartTime: newUserForm.workStartTime || '',
        workEndTime: newUserForm.workEndTime || '',
        totalLeaves: newUserForm.totalLeaves
      });
      alert(`[${newUserForm.name}] 사원 계정이 성공적으로 등록되었습니다.`);
      setIsAddingUser(false);
      setNewUserForm({ id: '', password: 'password', name: '', department: '', role: '사원', phone: '', address: '', workStartTime: '', workEndTime: '', totalLeaves: 15 });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleEditProfileClick = () => {
    setEditProfileForm({
      department: selectedUser.department || '',
      role: selectedUser.role || '',
      baseSalary: selectedUser.baseSalary || 0,
      phone: selectedUser.phone || '',
      address: selectedUser.address || '',
      totalLeaves: selectedUser.totalLeaves || 15
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    try {
      const updatedInfo = {
        department: editProfileForm.department,
        role: editProfileForm.role,
        phone: editProfileForm.phone,
        address: editProfileForm.address,
        total_leaves: editProfileForm.totalLeaves,
        totalLeaves: editProfileForm.totalLeaves
      };
      updateEmployee(selectedUser.id, updatedInfo);
      setSelectedUser({ ...selectedUser, ...updatedInfo });
      setIsEditingProfile(false);
      alert('직원 정보가 수정되었습니다.');
    } catch (e) {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadImage = async () => {
    if (!documentRef.current) return;
    try {
      const canvas = await html2canvas(documentRef.current, { scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `근로계약서_${selectedUser?.name}_${viewingContract?.issuedAt}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount) => (amount || 0).toLocaleString() + '원';

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>인사·노무 관리</div>
        <UserPlus className="header-icon" onClick={() => setIsAddingUser(true)} style={{ color: 'var(--primary)', cursor: 'pointer' }} />
      </header>

      <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div 
          onClick={() => setActiveTab('직원목록')}
          style={{ flex: 1, textAlign: 'center', padding: '14px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '직원목록' ? '#3b82f6' : '#64748b', borderBottom: activeTab === '직원목록' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}
        >
          직원 목록
        </div>
        <div 
          onClick={() => setActiveTab('가입승인대기')}
          style={{ flex: 1, textAlign: 'center', padding: '14px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '가입승인대기' ? '#3b82f6' : '#64748b', borderBottom: activeTab === '가입승인대기' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', position: 'relative' }}
        >
          가입 승인 대기
          {companyPendingUsers.length > 0 && (
            <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{companyPendingUsers.length}</span>
          )}
        </div>
      </div>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 110px)' }}>
        
        {activeTab === '직원목록' && (
          <>
            {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>총 사원 수</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{companyEmployees.length}명</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>계약 완료 비율</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {companyEmployees.length > 0 ? Math.round((companyEmployees.filter(emp => getContractStatus(emp.id).status === '서명완료').length / companyEmployees.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div className="search-bar" style={{ flex: 1, margin: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px' }}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="사원명 또는 부서 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '8px', fontSize: '15px' }}
            />
          </div>
          <button style={{ padding: '0 16px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Filter size={18} />
          </button>
        </div>

        {/* 직원 명부 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
          {filteredEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색 결과가 없습니다.</div>
          ) : (
            filteredEmployees.map(emp => {
              const { status, contract } = getContractStatus(emp.id);
              return (
                <div key={emp.id} onClick={() => setSelectedUser(emp)} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      {emp.name.substring(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {emp.name} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>{emp.role}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{emp.department}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {status === '서명완료' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                        <CheckCircle size={12} /> 서명완료
                      </div>
                    ) : status === '서명대기' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                        <Clock size={12} /> 서명대기
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                        <FileSignature size={12} /> 미작성
                      </div>
                    )}
                    
                    {status === '미작성' && (
                      <button onClick={(e) => openDraftForm(emp, e)} style={{ border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                        <PenTool size={12} /> 계약서 작성
                      </button>
                    )}
                    {status === '서명대기' && (
                      <button onClick={(e) => openDraftForm(emp, e, contract)} style={{ border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                        <PenTool size={12} /> 수정 및 재발송
                      </button>
                    )}
                    {status === '서명완료' && (
                      <button onClick={(e) => openDraftForm(emp, e, contract)} style={{ border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', marginTop: '4px' }}>
                        <PenTool size={12} /> 갱신 (재계약)
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('이 직원을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
                          removeEmployee(emp.id);
                        }
                      }}
                      style={{ border: '1px solid #fee2e2', backgroundColor: 'white', color: '#ef4444', fontSize: '12px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', marginTop: '4px' }}
                    >
                      직원 삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}

        {activeTab === '가입승인대기' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
            {companyPendingUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>대기 중인 가입 요청이 없습니다.</div>
            ) : (
              companyPendingUsers.map(user => (
                <div key={user.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                      {user.name.substring(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>아이디: {user.id}</span>
                        <span>생년월일: {user.birthDate || '미입력'}</span>
                        <span>연락처: {user.phone}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>요청일: {new Date(user.requestDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => approvePendingUser(user.id)}
                      style={{ border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                    >
                      <UserCheck size={14} /> 승인
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('가입 요청을 거절하시겠습니까?')) {
                          rejectPendingUser(user.id);
                        }
                      }}
                      style={{ border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#ef4444', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                    >
                      <UserX size={14} /> 거절
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* 1. 계약서 작성 폼 (Full Screen Modal) */}
      {draftingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
          <header style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>표준근로계약서 작성</div>
            <X size={24} onClick={() => setDraftingUser(null)} style={{ cursor: 'pointer' }} />
          </header>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8fafc' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: '900', borderBottom: '2px solid #333', paddingBottom: '16px', marginBottom: '20px' }}>표준근로계약서</div>
              <div style={{ fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                <strong>{companies.find(c => c.id === currentUser.companyId)?.name || currentUser.companyId}</strong> (이하 "갑"이라 함)과(와) <strong>{draftingUser.name}</strong> (이하 "을"이라 함)은 다음과 같이 근로계약을 체결한다.
              </div>

              {/* 1. 근로계약기간 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>1. 근로계약기간</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" name="startDate" value={contractForm.startDate} onChange={handleFormChange} style={{ flex: 1, minWidth: '130px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span>~</span>
                  <input type="date" name="endDate" value={contractForm.endDate} onChange={handleFormChange} style={{ flex: 1, minWidth: '130px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              {/* 2. 근무장소 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>2. 근무장소</label>
                <input type="text" name="workplace" value={contractForm.workplace} onChange={handleFormChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              {/* 3. 업무의 내용 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>3. 업무의 내용</label>
                <input type="text" name="jobDescription" value={contractForm.jobDescription} onChange={handleFormChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              {/* 4. 소정근로시간 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>4. 소정근로시간</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <input type="time" name="workStart" value={contractForm.workStart} onChange={handleFormChange} style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span>부터</span>
                  <input type="time" name="workEnd" value={contractForm.workEnd} onChange={handleFormChange} style={{ flex: 1, minWidth: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <span>까지</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>(휴게시간: </span>
                  <input type="time" name="breakStart" value={contractForm.breakStart} onChange={handleFormChange} style={{ width: '90px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                  <span>~</span>
                  <input type="time" name="breakEnd" value={contractForm.breakEnd} onChange={handleFormChange} style={{ width: '90px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>)</span>
                </div>
              </div>

              {/* 5. 근무일/휴일 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>5. 근무일/휴일</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', flexWrap: 'wrap' }}>
                  매주 <input type="number" name="workDays" value={contractForm.workDays} onChange={handleFormChange} style={{ width: '50px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }} /> 일 근무, 주휴일 매주 <input type="text" name="holiday" value={contractForm.holiday} onChange={handleFormChange} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }} /> 요일
                </div>
              </div>

              {/* 6. 임금 */}
              <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '12px' }}>6. 임금</label>
                
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ width: '80px', fontSize: '14px' }}>- 월(일)급: </span>
                  <input type="number" name="baseSalary" value={contractForm.baseSalary} onChange={handleFormChange} style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> <span style={{ marginLeft: '4px' }}>원</span>
                </div>
                
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ width: '80px', fontSize: '14px' }}>- 상여금: </span>
                  <input type="number" name="bonus" value={contractForm.bonus} onChange={handleFormChange} placeholder="없음(0)" style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> <span style={{ marginLeft: '4px' }}>원</span>
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ width: '80px', fontSize: '14px' }}>- 기타수당: </span>
                  <input type="number" name="extraPay" value={contractForm.extraPay} onChange={handleFormChange} placeholder="없음(0)" style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /> <span style={{ marginLeft: '4px' }}>원</span>
                </div>

                {/* 세부 기타수당 추가 영역 */}
                <div style={{ paddingLeft: '80px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(contractForm.allowances || []).map((allowance) => (
                    <div key={allowance.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>·</span>
                      <input 
                        type="text" 
                        placeholder="항목명(예: 식대)" 
                        value={allowance.name} 
                        onChange={(e) => handleAllowanceChange(allowance.id, 'name', e.target.value)} 
                        style={{ flex: 1, minWidth: '90px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} 
                      />
                      <input 
                        type="number" 
                        placeholder="금액" 
                        value={allowance.amount} 
                        onChange={(e) => handleAllowanceChange(allowance.id, 'amount', e.target.value)} 
                        style={{ flex: 1, minWidth: '90px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} 
                      />
                      <span style={{ fontSize: '13px' }}>원</span>
                      <button onClick={() => handleRemoveAllowance(allowance.id)} style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={handleAddAllowance} style={{ alignSelf: 'flex-start', padding: '4px 8px', fontSize: '12px', color: '#3b82f6', backgroundColor: '#eff6ff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      + 세부 수당 내역 추가
                    </button>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>💡 식대는 월 20만원까지 비과세 처리됩니다.</div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px' }}>- 임금지급일: 매월 </span>
                  <input type="number" name="payDay" value={contractForm.payDay} onChange={handleFormChange} style={{ width: '50px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', margin: '0 8px' }} /> 일
                </div>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px' }}>- 지급방법: </span>
                  <input type="text" name="payMethod" value={contractForm.payMethod} onChange={handleFormChange} style={{ flex: 1, minWidth: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginLeft: '8px' }} />
                </div>

                {/* 임금 관련 특약사항 (선택) */}
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#475569' }}>- 임금 관련 특약사항 (선택 입력)</label>
                  <textarea 
                    name="wageProvision" 
                    value={contractForm.wageProvision} 
                    onChange={handleFormChange} 
                    placeholder="임금 산정 및 지급에 대한 추가 조항이나 세부 조건을 자유롭게 작성하세요."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', minHeight: '60px' }} 
                  />
                </div>
              </div>

              {/* 7~ 추가 조항 텍스트 영역 (동적 추가/삭제 가능) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>추가 조항 (자유롭게 추가/삭제 가능)</strong>
                  <select 
                    onChange={(e) => {
                      handleAddClause(e.target.value);
                      e.target.value = ''; // 선택 후 초기화
                    }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #111', backgroundColor: '#111', color: 'white', fontSize: '13px', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <option value="">+ 새 조항 추가하기</option>
                    {DEFAULT_CLAUSES.map(c => (
                      <option key={c.id} value={c.id}>[{c.title}] 템플릿</option>
                    ))}
                    <option value="custom">직접 작성하기 (빈칸)</option>
                  </select>
                </div>
                
                {contractForm.additionalClauses.map((clause, index) => (
                  <div key={clause.id} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
                        <strong style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{index + 7}.</strong>
                        <input 
                          type="text" 
                          value={clause.title} 
                          onChange={(e) => handleClauseChange(clause.id, 'title', e.target.value)} 
                          placeholder="조항 제목 (예: 연차유급휴가)"
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                        <button 
                          onClick={() => handleMoveClause(index, 'up')}
                          disabled={index === 0}
                          style={{ padding: '4px 8px', backgroundColor: index === 0 ? '#f1f5f9' : '#e2e8f0', color: index === 0 ? '#94a3b8' : '#475569', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: index === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => handleMoveClause(index, 'down')}
                          disabled={index === contractForm.additionalClauses.length - 1}
                          style={{ padding: '4px 8px', backgroundColor: index === contractForm.additionalClauses.length - 1 ? '#f1f5f9' : '#e2e8f0', color: index === contractForm.additionalClauses.length - 1 ? '#94a3b8' : '#475569', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: index === contractForm.additionalClauses.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                          ▼
                        </button>
                        <button 
                          onClick={() => handleRemoveClause(clause.id)}
                          style={{ marginLeft: '4px', padding: '4px 8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={clause.content} 
                      onChange={(e) => handleClauseChange(clause.id, 'content', e.target.value)} 
                      placeholder="조항 내용을 입력하세요"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }} 
                    />
                  </div>
                ))}
                
                {contractForm.additionalClauses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    추가 조항이 없습니다. 우측 상단의 버튼을 눌러 양식을 추가해주세요.
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button 
                    onClick={handleSaveTemplate}
                    style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={16} /> 현재 양식을 기본 템플릿으로 저장하기
                  </button>
                </div>
              </div>

              {/* 서명 영역 (사업주만 서명) */}
              <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>{new Date().toISOString().split('T')[0].replace(/-/g, ' . ')}</div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>(갑) 사업주 서명/도장 (먼저 입력하세요)</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => { setSignType('signature'); setHasSigned(canvasRef.current && !canvasRef.current.isEmpty()); }}
                        style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '4px', border: signType === 'signature' ? '1px solid #111' : '1px solid #e2e8f0', backgroundColor: signType === 'signature' ? '#111' : 'white', color: signType === 'signature' ? 'white' : '#64748b', cursor: 'pointer' }}
                      >서명하기</button>
                      <button 
                        onClick={() => { setSignType('stamp'); setHasSigned(!!stampImage); }}
                        style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '4px', border: signType === 'stamp' ? '1px solid #111' : '1px solid #e2e8f0', backgroundColor: signType === 'stamp' ? '#111' : 'white', color: signType === 'stamp' ? 'white' : '#64748b', cursor: 'pointer' }}
                      >도장 등록</button>
                    </div>
                  </div>
                  
                  {signType === 'signature' ? (
                    <div style={{ border: '2px solid #333', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', position: 'relative' }}>
                      <SignatureCanvas
                        ref={canvasRef}
                        penColor="black"
                        canvasProps={{ style: { width: '100%', height: '150px', cursor: 'crosshair', display: 'block', touchAction: 'none' } }}
                        onEnd={() => setHasSigned(true)}
                      />
                      <button onClick={clearCanvas} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>지우기</button>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed #94a3b8', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => stampInputRef.current?.click()}>
                      <input type="file" ref={stampInputRef} accept="image/*" onChange={handleStampUpload} style={{ display: 'none' }} />
                      {stampImage ? (
                        <>
                          <img src={stampImage} alt="도장" style={{ maxHeight: '100px', maxWidth: '80%', objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: 8, fontSize: '12px', color: '#64748b', backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '4px' }}>클릭하여 다른 이미지로 변경</div>
                        </>
                      ) : (
                        <>
                          <FileSignature size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>클릭하여 도장 이미지 업로드</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>PNG, JPG 파일 가능</div>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                    <button 
                      onClick={handleSaveEmployerSignature}
                      style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={14} /> 현재 서명/도장을 기본값으로 저장하기
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>(을) 근로자 서명</div>
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', fontSize: '13px' }}>
                    발송 후 사원이 직접 서명합니다
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0' }}>
            <button 
              onClick={handleSubmitContract}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none' }}>
              사업주 서명 및 계약서 발송
            </button>
          </div>
        </div>
      )}

      {/* 2. 기존 프로필 조회 모달 (유지) */}
      {selectedUser && !draftingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f7f8fa', width: '100%', maxWidth: '480px', height: '80vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '24px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px' }}>
                  {selectedUser.name.substring(0, 1)}
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedUser.department} | {selectedUser.role}</div>
                </div>
              </div>
              <div onClick={() => setSelectedUser(null)} style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>인사 정보</h3>
                  {!isEditingProfile ? (
                    <button onClick={handleEditProfileClick} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>정보 수정</button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: 0 }}>취소</button>
                      <button onClick={handleSaveProfile} style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>저장</button>
                    </div>
                  )}
                </div>

                {!isEditingProfile ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>사번</span><span style={{ fontWeight: 'bold', color: '#333' }}>EMP-{selectedUser.id}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>부서명</span><span style={{ fontWeight: 'bold', color: '#333' }}>{selectedUser.department}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>직급</span><span style={{ fontWeight: 'bold', color: '#333' }}>{selectedUser.role}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>연락처</span><span style={{ fontWeight: 'bold', color: '#333' }}>{selectedUser.phone}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>총 휴가 일수</span><span style={{ fontWeight: 'bold', color: '#333' }}>{selectedUser.totalLeaves || 15}일</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}><span style={{ color: '#64748b' }}>주소</span><span style={{ fontWeight: 'bold', color: '#333', textAlign: 'right', wordBreak: 'keep-all', maxWidth: '60%' }}>{selectedUser.address}</span></div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', width: '80px' }}>부서명</span>
                      <input type="text" value={editProfileForm.department} onChange={e => setEditProfileForm(p => ({...p, department: e.target.value}))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', width: '80px' }}>직급</span>
                      <input type="text" value={editProfileForm.role} onChange={e => setEditProfileForm(p => ({...p, role: e.target.value}))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', width: '80px' }}>연락처</span>
                      <input type="text" value={editProfileForm.phone} onChange={e => setEditProfileForm(p => ({...p, phone: e.target.value}))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', width: '80px' }}>휴가일수</span>
                      <input type="number" value={editProfileForm.totalLeaves} onChange={e => setEditProfileForm(p => ({...p, totalLeaves: parseInt(e.target.value) || 0}))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', width: '80px' }}>주소</span>
                      <input type="text" value={editProfileForm.address} onChange={e => setEditProfileForm(p => ({...p, address: e.target.value}))} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>근로계약서</h3>
                
                {(() => {
                  const { status, contract } = getContractStatus(selectedUser.id);
                  if (status === '미작성') {
                    return (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <FileSignature size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>아직 등록된 근로계약서가 없습니다.</div>
                        <button 
                          onClick={(e) => openDraftForm(selectedUser, e)}
                          style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                          계약서 작성 및 발송
                        </button>
                      </div>
                    );
                  } else if (status === '서명대기' || status === '서명완료') {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>표준근로계약서</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                              {status === '서명대기' ? `발송일: ${contract.issuedAt}` : `계약기간: ${contract.startDate} ~ ${contract.endDate}`}
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: status === '서명완료' ? '#16a34a' : '#d97706', backgroundColor: status === '서명완료' ? '#dcfce7' : '#fef3c7', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                            {status}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button 
                            onClick={() => setViewingContract(contract)}
                            style={{ flex: 1, padding: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#475569', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                            <ExternalLink size={16} /> {status === '서명완료' ? '기존 계약서 열람' : '작성된 계약서 열람'}
                          </button>
                          {status === '서명대기' && (
                            <button 
                              onClick={(e) => openDraftForm(selectedUser, e, contract)}
                              style={{ flex: 1, padding: '12px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                              <PenTool size={16} /> 수정 / 재발송
                            </button>
                          )}
                          {status === '서명완료' && (
                            <button 
                              onClick={(e) => openDraftForm(selectedUser, e, contract)}
                              style={{ flex: 1, padding: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '12px', color: '#475569', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                              <PenTool size={16} /> 갱신 / 재계약
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. 계약서 열람 모달 (관리자용) */}
      {viewingContract && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#e2e8f0', width: '100%', maxWidth: '640px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', backgroundColor: 'white', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>근로계약서 문서 열람</div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button 
                  onClick={handleDownloadImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Download size={16} /> 이미지 저장
                </button>
                <X size={24} onClick={() => setViewingContract(null)} style={{ cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div ref={documentRef}>
                <ContractDocument 
                  contract={viewingContract} 
                  employer={{
                    ...currentUser,
                    companyName: companies.find(c => c.id === currentUser.companyId)?.name || currentUser.companyId,
                    companyPhone: companies.find(c => c.id === currentUser.companyId)?.contact || currentUser.companyPhone,
                    companyAddress: companies.find(c => c.id === currentUser.companyId)?.address || currentUser.companyAddress,
                    ceoName: companies.find(c => c.id === currentUser.companyId)?.representative || currentUser.ceoName
                  }} 
                  employee={{
                    ...selectedUser,
                    address: selectedUser?.address || '(상세 주소 입력 요망)',
                    phone: selectedUser?.phone || '(연락처 입력 요망)'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 신규 사원 등록 모달 */}
      {isAddingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 30000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '480px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>신규 사원 등록</div>
              <X size={20} color="#64748b" onClick={() => setIsAddingUser(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>로그인 아이디 *</label>
                <input type="text" value={newUserForm.id} onChange={e => setNewUserForm(p => ({...p, id: e.target.value}))} placeholder="예: user3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>이름 *</label>
                  <input type="text" value={newUserForm.name} onChange={e => setNewUserForm(p => ({...p, name: e.target.value}))} placeholder="사원명" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>부서 *</label>
                  <input type="text" value={newUserForm.department} onChange={e => setNewUserForm(p => ({...p, department: e.target.value}))} placeholder="예: 디자인팀" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>초기 비밀번호</label>
                <input type="text" value={newUserForm.password} onChange={e => setNewUserForm(p => ({...p, password: e.target.value}))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>연락처</label>
                  <input type="text" value={newUserForm.phone} onChange={e => setNewUserForm(p => ({...p, phone: e.target.value}))} placeholder="010-0000-0000" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>주소</label>
                  <input type="text" value={newUserForm.address} onChange={e => setNewUserForm(p => ({...p, address: e.target.value}))} placeholder="시/군/구 동/면/읍" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>개별 출근 시간 (선택)</label>
                  <input type="time" value={newUserForm.workStartTime} onChange={e => setNewUserForm(p => ({...p, workStartTime: e.target.value}))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>개별 퇴근 시간 (선택)</label>
                  <input type="time" value={newUserForm.workEndTime} onChange={e => setNewUserForm(p => ({...p, workEndTime: e.target.value}))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>총 휴가 일수 (연차)</label>
                  <input type="number" value={newUserForm.totalLeaves} onChange={e => setNewUserForm(p => ({...p, totalLeaves: parseInt(e.target.value) || 0}))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '-8px', marginBottom: '4px' }}>
                * 비워둘 경우 회사의 기본 출퇴근 시간이 적용됩니다.
              </div>
            </div>

            <button 
              onClick={handleAddEmployee}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              사원 계정 생성하기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminHR;

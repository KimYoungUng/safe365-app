import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { MOCK_USERS } from '../../mockData';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle, Calculator, FileText, Edit3, X, Settings } from 'lucide-react';

function AdminPayroll() {
  const navigate = useNavigate();
  const { currentUser, users } = useContext(AuthContext);
  const { overtimes, payrolls, confirmPayroll, payrollSettings, updatePayrollSettings, contracts } = useContext(DataContext);
  
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [expandedCards, setExpandedCards] = useState({});
  
  // 사원별 수정된 급여 데이터 저장소: { [monthStr]: { [userId]: { ...editedFields } } }
  const [overrides, setOverrides] = useState({});

  // 모달 상태
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('global'); // 'global' | 'employees'
  
  // 회사 설정 가져오기 및 초기 설정값 폼
  const myCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '스마트컴퍼니') : '스마트컴퍼니';
  const myCompanySettings = payrollSettings[myCompanyId] || { global: { nationalPension: 4.5, healthInsurance: 3.545, employmentInsurance: 0.9, incomeTax: 3.0, localTax: 10.0 }, employees: {} };
  
  const [settingsForm, setSettingsForm] = useState(myCompanySettings);
  const [selectedSettingUser, setSelectedSettingUser] = useState('');

  if (!currentUser) return null;

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const currentMonthOverrides = overrides[monthStr] || {};

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isConfirmed = payrolls.some(p => p.companyId === currentUser.companyId && p.month === monthStr);

  const companyEmployees = users.filter(u => {
    const myCompanyId = currentUser.companyId || currentUser.companyName || '스마트컴퍼니';
    const uCompanyId = u.companyId || u.companyName || '스마트컴퍼니';
    return uCompanyId === myCompanyId && u.roleCode === 'EMPLOYEE';
  }).filter(emp => {
    // 계약서 존재 여부 확인 (서명완료된 계약서만 급여정산 대상)
    const empContracts = contracts ? contracts.filter(c => c.userId === emp.id && (c.status === '서명완료' || c.status === '완료')) : [];
    const latestContract = empContracts.length > 0 ? empContracts[empContracts.length - 1] : null;
    
    // 근로계약서에 기본급이 정상적으로 설정되어 있는 직원만 급여정산 목록에 띄움
    return latestContract && Number(latestContract.baseSalary) > 0;
  });

  const HOURLY_WAGE = 15000; 
  const OVERTIME_MULTIPLIER = 1.5;

  // 급여 데이터 생성 (기본 자동계산 + 수동 수정값 병합)
  const payrollData = useMemo(() => {
    // 확정된 급여 내역이 있다면 그 데이터를 그대로 보여줌 (과거 기록 보존)
    const confirmedRecord = payrolls.find(p => p.companyId === currentUser.companyId && p.month === monthStr);
    if (confirmedRecord && confirmedRecord.data) {
      return confirmedRecord.data;
    }

    // 확정 전이라면 최신 근로계약서 기반으로 실시간 계산
    return companyEmployees.map(emp => {
      const manual = currentMonthOverrides[emp.id] || {};

      // 1. 기본급 및 수당 자동 계산 (근로계약서 기반)
      const empContracts = contracts ? contracts.filter(c => c.userId === emp.id && (c.status === '서명완료' || c.status === '완료')) : [];
      const latestContract = empContracts.length > 0 ? empContracts[empContracts.length - 1] : null;

      const autoBaseSalary = latestContract ? Number(latestContract.baseSalary) || 0 : 0;
      const autoContractBonus = latestContract ? Number(latestContract.bonus) || 0 : 0;
      const autoContractExtra = latestContract ? Number(latestContract.extraPay) || 0 : 0;
      
      const empOvertimes = overtimes.filter(
        ot => ot.userId === emp.id && ot.status === '승인' && ot.date.startsWith(monthStr)
      );
      const totalOvertimeHours = empOvertimes.reduce((sum, ot) => sum + (Number(ot.hours) || 0), 0);
      const autoOvertimePay = totalOvertimeHours * HOURLY_WAGE * OVERTIME_MULTIPLIER;
      
      // 지급 항목 병합
      const baseSalary = manual.baseSalary ?? autoBaseSalary;
      const overtimePay = manual.overtimePay ?? autoOvertimePay;
      const bonus = manual.bonus ?? autoContractBonus;
      const extraPay = manual.extraPay ?? autoContractExtra; // 직무/기타수당

      // 식대: 근로계약서 allowances에서 '식대' 항목을 찾아 연동 (없으면 0원)
      const contractAllowances = latestContract?.allowances || [];
      const mealAllowance = contractAllowances.find(a => a.name && a.name.includes('식대'));
      const autoMeals = mealAllowance ? Number(mealAllowance.amount) || 0 : 0;
      const meals = manual.meals ?? autoMeals;

      const grossPay = baseSalary + overtimePay + bonus + extraPay + meals;

      // 2. 공제 항목 자동 계산 (설정된 요율 반영)
      // 식대 비과세 한도: 월 20만원까지 비과세, 초과분은 과세
      const MEAL_TAX_EXEMPT_LIMIT = 200000;
      const taxExemptMeals = Math.min(meals, MEAL_TAX_EXEMPT_LIMIT);
      const taxableMeals = meals - taxExemptMeals; // 20만원 초과분만 과세
      const taxable = baseSalary + overtimePay + bonus + extraPay + taxableMeals;
      const empRates = myCompanySettings.employees[emp.id] || {};
      const globalRates = myCompanySettings.global;

      const rateNP = (empRates.nationalPension ?? globalRates.nationalPension) / 100;
      const rateHI = (empRates.healthInsurance ?? globalRates.healthInsurance) / 100;
      const rateEI = (empRates.employmentInsurance ?? globalRates.employmentInsurance) / 100;
      const rateIT = (empRates.incomeTax ?? globalRates.incomeTax) / 100;
      const rateLT = (empRates.localTax ?? globalRates.localTax) / 100;

      const autoNationalPension = Math.floor(taxable * rateNP);
      const autoHealthInsurance = Math.floor(taxable * rateHI);
      const autoEmploymentInsurance = Math.floor(taxable * rateEI);
      const autoIncomeTax = Math.floor(taxable * rateIT);
      const autoLocalTax = Math.floor(autoIncomeTax * rateLT);

      // 공제 항목 병합
      const nationalPension = manual.nationalPension ?? autoNationalPension;
      const healthInsurance = manual.healthInsurance ?? autoHealthInsurance;
      const employmentInsurance = manual.employmentInsurance ?? autoEmploymentInsurance;
      const incomeTax = manual.incomeTax ?? autoIncomeTax;
      const localTax = manual.localTax ?? autoLocalTax;

      const totalDeductions = nationalPension + healthInsurance + employmentInsurance + incomeTax + localTax;
      const netPay = grossPay - totalDeductions;

      return {
        userId: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        totalOvertimeHours,
        baseSalary,
        overtimePay,
        bonus,
        extraPay,
        meals,
        nationalPension,
        healthInsurance,
        employmentInsurance,
        incomeTax,
        localTax,
        grossPay,
        totalDeductions,
        netPay
      };
    });
  }, [companyEmployees, monthStr, overtimes, currentMonthOverrides, contracts, myCompanySettings, payrolls, currentUser]);

  const handleConfirm = () => {
    if (window.confirm(`${selectedYear}년 ${selectedMonth}월 전체 직원의 급여 정산을 최종 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.`)) {
      confirmPayroll(currentUser.companyId, monthStr, payrollData);
      alert('정산이 완료되었습니다. 사원들이 급여 명세서를 열람할 수 있습니다.');
    }
  };

  const openEditModal = (empData) => {
    setEditingUserId(empData.userId);
    setEditForm({
      baseSalary: empData.baseSalary,
      overtimePay: empData.overtimePay,
      bonus: empData.bonus,
      extraPay: empData.extraPay || 0,
      meals: empData.meals,
      nationalPension: empData.nationalPension,
      healthInsurance: empData.healthInsurance,
      employmentInsurance: empData.employmentInsurance,
      incomeTax: empData.incomeTax,
      localTax: empData.localTax,
    });
  };

  const saveEditModal = () => {
    setOverrides(prev => ({
      ...prev,
      [monthStr]: {
        ...(prev[monthStr] || {}),
        [editingUserId]: {
          baseSalary: Number(editForm.baseSalary) || 0,
          overtimePay: Number(editForm.overtimePay) || 0,
          bonus: Number(editForm.bonus) || 0,
          extraPay: Number(editForm.extraPay) || 0,
          meals: Number(editForm.meals) || 0,
          nationalPension: Number(editForm.nationalPension) || 0,
          healthInsurance: Number(editForm.healthInsurance) || 0,
          employmentInsurance: Number(editForm.employmentInsurance) || 0,
          incomeTax: Number(editForm.incomeTax) || 0,
          localTax: Number(editForm.localTax) || 0,
        }
      }
    }));
    setEditingUserId(null);
  };

  const handleSettingsSave = () => {
    updatePayrollSettings(myCompanyId, settingsForm);
    setIsSettingsModalOpen(false);
    alert('공제 요율 설정이 저장되었습니다. 반영을 확인하세요.');
  };

  const handleGlobalRateChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [name]: Number(value)
      }
    }));
  };

  const handleEmployeeRateChange = (userId, e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => {
      const empRates = prev.employees[userId] || {};
      if (value === '') {
        const newEmpRates = { ...empRates };
        delete newEmpRates[name];
        return { ...prev, employees: { ...prev.employees, [userId]: newEmpRates } };
      } else {
        return { ...prev, employees: { ...prev.employees, [userId]: { ...empRates, [name]: Number(value) } } };
      }
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount) => amount.toLocaleString() + '원';

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>급여 정산</div>
        <Settings className="header-icon" onClick={() => setIsSettingsModalOpen(true)} style={{ color: '#64748b' }} />
      </header>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 60px)', paddingBottom: '120px' }}>
        
        {/* Month Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
            {selectedYear}년 {selectedMonth}월
          </div>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Status Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
            정산 대상자 ({payrollData.length}명)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: isConfirmed ? '#16a34a' : '#d97706', backgroundColor: isConfirmed ? '#dcfce7' : '#fef3c7', padding: '6px 12px', borderRadius: '12px' }}>
            {isConfirmed ? <><CheckCircle size={14} /> 확정 완료</> : <><Calculator size={14} /> 정산 대기</>}
          </div>
        </div>

        {/* Employee Payroll List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {payrollData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>해당하는 사원이 없습니다.</div>
          ) : (
            payrollData.map(emp => (
              <div key={emp.userId} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                {/* Header (Clickable) */}
                <div onClick={() => toggleCard(emp.userId)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold', fontSize: '16px' }}>
                      {emp.name.substring(0, 1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{emp.name} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>{emp.role}</span></div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{emp.department}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '17px', color: 'var(--primary)' }}>{formatCurrency(emp.netPay)}</div>
                    {expandedCards[emp.userId] ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCards[emp.userId] && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e2e8f0', animation: 'popIn 0.2s ease-out' }}>
                    
                    {!isConfirmed && (
                      <button onClick={() => openEditModal(emp)} style={{ width: '100%', padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                        <Edit3 size={14} /> 급여 내역 상세 수정
                      </button>
                    )}

                    {/* 지급 항목 */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>지급 항목 ({formatCurrency(emp.grossPay)})</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>기본급</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(emp.baseSalary)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>연장수당 ({emp.totalOvertimeHours}h)</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(emp.overtimePay)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>상여/성과급</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(emp.bonus)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>직무/기타수당</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(emp.extraPay)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>식대</span>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(emp.meals)}</span>
                      </div>
                    </div>

                    {/* 공제 항목 */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>공제 항목 (-{formatCurrency(emp.totalDeductions)})</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>국민연금</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(emp.nationalPension)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>건강보험</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(emp.healthInsurance)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>고용보험</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(emp.employmentInsurance)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>소득세</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(emp.incomeTax)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                        <span style={{ color: '#475569' }}>지방소득세</span>
                        <span style={{ color: '#ef4444' }}>{formatCurrency(emp.localTax)}</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569' }}>실수령액</span>
                      <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--primary)' }}>{formatCurrency(emp.netPay)}</span>
                    </div>
                    
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Scrollable Bottom Action */}
        {!isConfirmed && payrollData.length > 0 && (
          <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
              수정이 완료되었다면 아래 버튼을 눌러주세요.<br/>확정 후 사원들에게 명세서가 발송됩니다.
            </div>
            <button 
              onClick={handleConfirm}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FileText size={18} /> {selectedMonth}월 전체 급여 확정
            </button>
          </div>
        )}
      </main>

      {/* 급여 상세 수정 모달 */}
      {editingUserId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f7f8fa', width: '100%', maxWidth: '480px', height: '90vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '20px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>급여 내역 직접 수정</div>
              <div onClick={() => setEditingUserId(null)} style={{ padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>지급 항목 (+)</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>기본급</label>
                  <input type="number" name="baseSalary" value={editForm.baseSalary} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>연장근로수당</label>
                  <input type="number" name="overtimePay" value={editForm.overtimePay} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>상여금/성과급 (직접 입력)</label>
                  <input type="number" name="bonus" value={editForm.bonus} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>직무/기타수당 (직접 입력)</label>
                  <input type="number" name="extraPay" value={editForm.extraPay} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>식대 (비과세)</label>
                  <input type="number" name="meals" value={editForm.meals} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>공제 항목 (-)</h3>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>국민연금</label>
                  <input type="number" name="nationalPension" value={editForm.nationalPension} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>건강보험</label>
                  <input type="number" name="healthInsurance" value={editForm.healthInsurance} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>고용보험</label>
                  <input type="number" name="employmentInsurance" value={editForm.employmentInsurance} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>소득세</label>
                  <input type="number" name="incomeTax" value={editForm.incomeTax} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#ef4444', marginBottom: '4px' }}>지방소득세</label>
                  <input type="number" name="localTax" value={editForm.localTax} onChange={handleFormChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ height: '20px' }}></div>
            </div>

            <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', paddingBottom: '40px' }}>
              <button 
                onClick={saveEditModal}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                수정 사항 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {isSettingsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f7f8fa', width: '100%', maxWidth: '480px', height: '80vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ padding: '24px', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>공제 요율 설정 (%)</div>
              <X size={24} onClick={() => setIsSettingsModalOpen(false)} style={{ cursor: 'pointer', color: '#64748b' }} />
            </div>

            <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setSettingsTab('global')}
                style={{ flex: 1, padding: '16px', border: 'none', borderBottom: settingsTab === 'global' ? '2px solid var(--primary)' : '2px solid transparent', backgroundColor: 'transparent', fontWeight: settingsTab === 'global' ? 'bold' : 'normal', color: settingsTab === 'global' ? 'var(--primary)' : '#64748b', cursor: 'pointer' }}>
                전체 일괄 적용
              </button>
              <button 
                onClick={() => setSettingsTab('employees')}
                style={{ flex: 1, padding: '16px', border: 'none', borderBottom: settingsTab === 'employees' ? '2px solid var(--primary)' : '2px solid transparent', backgroundColor: 'transparent', fontWeight: settingsTab === 'employees' ? 'bold' : 'normal', color: settingsTab === 'employees' ? 'var(--primary)' : '#64748b', cursor: 'pointer' }}>
                개별 예외 설정
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {settingsTab === 'global' ? (
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
                    회사 전체 직원의 기본 공제 요율을 설정합니다. (단위: %)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>국민연금</label>
                      <input type="number" step="0.01" name="nationalPension" value={settingsForm.global.nationalPension} onChange={handleGlobalRateChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>건강보험</label>
                      <input type="number" step="0.01" name="healthInsurance" value={settingsForm.global.healthInsurance} onChange={handleGlobalRateChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>고용보험</label>
                      <input type="number" step="0.01" name="employmentInsurance" value={settingsForm.global.employmentInsurance} onChange={handleGlobalRateChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>소득세</label>
                      <input type="number" step="0.01" name="incomeTax" value={settingsForm.global.incomeTax} onChange={handleGlobalRateChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>지방소득세</label>
                      <input type="number" step="0.01" name="localTax" value={settingsForm.global.localTax} onChange={handleGlobalRateChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', padding: '0 4px' }}>
                    특정 직원의 요율을 예외적으로 설정할 수 있습니다. 비워둘 경우 전체 일괄 요율이 적용됩니다.
                  </div>
                  <select 
                    value={selectedSettingUser} 
                    onChange={e => setSelectedSettingUser(e.target.value)}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}>
                    <option value="">직원을 선택하세요</option>
                    {companyEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department} / {emp.role})</option>
                    ))}
                  </select>

                  {selectedSettingUser && (
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>국민연금</label>
                          <input type="number" step="0.01" name="nationalPension" value={settingsForm.employees[selectedSettingUser]?.nationalPension ?? ''} onChange={(e) => handleEmployeeRateChange(selectedSettingUser, e)} placeholder={settingsForm.global.nationalPension.toString()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>건강보험</label>
                          <input type="number" step="0.01" name="healthInsurance" value={settingsForm.employees[selectedSettingUser]?.healthInsurance ?? ''} onChange={(e) => handleEmployeeRateChange(selectedSettingUser, e)} placeholder={settingsForm.global.healthInsurance.toString()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>고용보험</label>
                          <input type="number" step="0.01" name="employmentInsurance" value={settingsForm.employees[selectedSettingUser]?.employmentInsurance ?? ''} onChange={(e) => handleEmployeeRateChange(selectedSettingUser, e)} placeholder={settingsForm.global.employmentInsurance.toString()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>소득세</label>
                          <input type="number" step="0.01" name="incomeTax" value={settingsForm.employees[selectedSettingUser]?.incomeTax ?? ''} onChange={(e) => handleEmployeeRateChange(selectedSettingUser, e)} placeholder={settingsForm.global.incomeTax.toString()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ fontSize: '14px', fontWeight: 'bold', width: '100px' }}>지방소득세</label>
                          <input type="number" step="0.01" name="localTax" value={settingsForm.employees[selectedSettingUser]?.localTax ?? ''} onChange={(e) => handleEmployeeRateChange(selectedSettingUser, e)} placeholder={settingsForm.global.localTax.toString()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '20px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', paddingBottom: '40px' }}>
              <button 
                onClick={handleSettingsSave}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminPayroll;

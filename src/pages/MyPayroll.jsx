import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, AlertCircle } from 'lucide-react';

function MyPayroll() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { overtimes, payrolls } = useContext(DataContext);
  
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`; // e.g., 2025-08

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

  if (!currentUser) return null; // 로딩 중 에러 방지

  // 해당 월의 급여가 관리자에 의해 확정되었는지 확인
  const confirmedPayroll = payrolls.find(p => p.companyId === currentUser.companyId && p.month === monthStr);
  const isConfirmed = !!confirmedPayroll;

  // 확정된 데이터에서 내 명세서 찾기
  const myRecord = isConfirmed ? confirmedPayroll.records?.find(r => r.userId === currentUser.id) : null;

  const formatCurrency = (amount) => (amount || 0).toLocaleString() + '원';

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>내 급여 명세서</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 60px)' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
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

        {!isConfirmed || !myRecord ? (
          // 미확정 상태
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '16px', padding: '40px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>급여 정산 진행 중</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              아직 {selectedMonth}월 급여 정산이 완료되지 않았습니다.<br />
              관리자의 확정 처리가 완료되면 명세서를 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          // 확정 상태: 영수증 형태의 명세서 UI
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', paddingBottom: '40px' }}>
            {/* 영수증 톱니바퀴 무늬 효과를 위한 상단 장식 */}
            <div style={{ position: 'absolute', top: '-10px', left: 0, right: 0, height: '20px', background: 'radial-gradient(circle, transparent, transparent 10px, white 10px)', backgroundSize: '20px 20px', zIndex: 1 }}></div>

            <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px dashed #e2e8f0', paddingBottom: '20px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', marginBottom: '12px' }}>
                <FileText size={24} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>{selectedYear}년 {selectedMonth}월 급여 명세서</h2>
              <div style={{ fontSize: '14px', color: '#64748b' }}>{currentUser.department} | {currentUser.name} {currentUser.role}</div>
            </div>

            {/* 지급 내역 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>지급 항목 (+)</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>기본급</span>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(myRecord.baseSalary)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>시간외 수당 <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>({myRecord.totalOvertimeHours}시간)</span></span>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(myRecord.overtimePay)}</span>
              </div>
              {myRecord.bonus > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#475569' }}>상여/성과급</span>
                  <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{formatCurrency(myRecord.bonus)}</span>
                </div>
              )}
              {myRecord.meals > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: '#475569' }}>식대 (비과세)</span>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(myRecord.meals)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '15px' }}>
                <span style={{ color: '#333', fontWeight: 'bold' }}>지급 총계</span>
                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{formatCurrency(myRecord.grossPay)}</span>
              </div>
            </div>

            {/* 공제 내역 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>공제 항목 (-)</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>국민연금</span>
                <span style={{ color: '#ef4444' }}>{formatCurrency(myRecord.nationalPension)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>건강보험</span>
                <span style={{ color: '#ef4444' }}>{formatCurrency(myRecord.healthInsurance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>고용보험</span>
                <span style={{ color: '#ef4444' }}>{formatCurrency(myRecord.employmentInsurance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>소득세</span>
                <span style={{ color: '#ef4444' }}>{formatCurrency(myRecord.incomeTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: '#475569' }}>지방소득세</span>
                <span style={{ color: '#ef4444' }}>{formatCurrency(myRecord.localTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '15px' }}>
                <span style={{ color: '#333', fontWeight: 'bold' }}>공제 총계</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(myRecord.totalDeductions)}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--primary-bg)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e7ff' }}>
              <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}>실수령액</span>
              <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>{formatCurrency(myRecord.netPay)}</span>
            </div>
            
          </div>
        )}
      </main>
    </>
  );
}

export default MyPayroll;

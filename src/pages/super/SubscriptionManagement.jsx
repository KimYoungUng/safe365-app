import { useState, useContext } from 'react';
import { ArrowLeft, Search, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';

function SubscriptionManagement() {
  const navigate = useNavigate();
  const { subscriptions, companies, sendMessage } = useContext(DataContext);
  const { currentUser, users } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');

  const mergedData = companies.map(company => {
    const sub = subscriptions.find(s => s.companyId === company.id);
    return { 
      companyId: company.id,
      companyName: company.name,
      plan: sub ? sub.plan : '구독 없음',
      amount: sub ? sub.amount : 0,
      nextBillingDate: sub ? sub.nextBillingDate : '-',
      status: sub ? sub.status : '미납'
    };
  });

  const filteredSubs = mergedData.filter(s => 
    s.companyName.includes(searchTerm) || s.plan.includes(searchTerm)
  );

  const totalRevenue = mergedData.filter(s => s.status === '결제완료').reduce((sum, s) => sum + s.amount, 0);

  const handleSendReminder = async (e, companyId, companyName) => {
    e.stopPropagation();
    const adminUser = users.find(u => u.companyId === companyId && u.roleCode === 'COMPANY_ADMIN');
    if (!adminUser) {
      alert('해당 회사의 어드민 계정을 찾을 수 없습니다.');
      return;
    }
    
    const success = await sendMessage(
      currentUser.id,
      currentUser.name,
      adminUser.id,
      '[시스템] 결제 미납 안내',
      `안녕하세요, ${companyName} 관리자님. 시스템 사용료 결제가 미납되었습니다. 빠른 시일 내에 결제를 완료해 주시기 바랍니다.`
    );
    
    if (success) {
      alert(`${companyName} 관리자에게 미납 안내 메시지를 발송했습니다.`);
    } else {
      alert('메시지 발송에 실패했습니다.');
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>구독/결제 현황 관리</div>
          <div style={{ width: '24px' }}></div>
        </div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
        {/* Dashboard Cards */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>이달의 예상 수익</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
              {totalRevenue.toLocaleString()}원
            </div>
          </div>
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>활성 구독자 수</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111' }}>
              {mergedData.filter(s => s.status === '결제완료').length}개사
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="고객사 이름, 요금제 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Subscription List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', backgroundColor: 'white', borderRadius: '12px' }}>검색 결과가 없습니다.</div>
          ) : (
            filteredSubs.map(sub => (
              <div key={sub.companyId} onClick={() => navigate(`/super/billing/${sub.companyId}`)} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={24} color="#64748b" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#111' }}>{sub.companyName}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {sub.plan}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {sub.amount.toLocaleString()}원 <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>/ 월</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      다음 결제일: {sub.nextBillingDate}
                    </div>
                  </div>
                </div>
                
                <div>
                  {sub.status === '결제완료' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={24} color="#22c55e" />
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold' }}>결제완료</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={24} color="#ef4444" />
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>미납</span>
                      <button 
                        onClick={(e) => handleSendReminder(e, sub.companyId, sub.companyName)}
                        style={{ marginTop: '4px', padding: '4px 8px', fontSize: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        안내 발송
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default SubscriptionManagement;

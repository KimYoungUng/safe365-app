import { useState, useContext, useEffect } from 'react';
import { ArrowLeft, Building2, CreditCard, Save, History, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';

function CompanyBilling() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { companies, subscriptions, paymentHistory, updateSubscription, addPaymentHistory, addSubscription } = useContext(DataContext);
  
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [formData, setFormData] = useState({ plan: 'Basic', amount: 50000, status: '결제완료', nextBillingDate: '' });
  const [history, setHistory] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('신용카드');

  useEffect(() => {
    const foundCompany = companies.find(c => c.id === id);
    if (foundCompany) {
      setCompany(foundCompany);
      const foundSub = subscriptions.find(s => s.companyId === id);
      if (foundSub) {
        setSubscription(foundSub);
        setFormData({ plan: foundSub.plan, amount: foundSub.amount, status: foundSub.status, nextBillingDate: foundSub.nextBillingDate });
      }
      
      if (paymentHistory) {
        const foundHistory = paymentHistory.filter(h => h.companyId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(foundHistory);
      }
    }
  }, [id, companies, subscriptions, paymentHistory]);

  const handleSave = async () => {
    if (subscription) {
      await updateSubscription(subscription.id, formData);
      alert('저장되었습니다.');
      navigate(-1);
    } else {
      await addSubscription(id, formData);
      alert('구독 정보가 추가되었습니다.');
      navigate(-1);
    }
  };

  const handleManualPayment = () => {
    if (window.confirm('결제를 처리하시겠습니까?\n\n(결제 내역 추가, 다음 결제일 1개월 연장, 상태 활성 복구)')) {
      addPaymentHistory(id, subscription.amount, paymentMethod);
      alert('결제 처리 및 내역이 추가되었습니다.');
    }
  };

  if (!company) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>고객사를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', paddingBottom: '80px' }}>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>결제 상세 관리</div>
          <div style={{ width: '24px' }}></div>
        </div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
        {/* Company Info */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Building2 size={24} color="#3b82f6" />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#111' }}>{company.name}</h2>
            <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', backgroundColor: company.status === '활성' ? '#dcfce7' : '#fee2e2', color: company.status === '활성' ? '#16a34a' : '#ef4444' }}>
              {company.status}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><span style={{ fontWeight: 'bold', width: '80px', display: 'inline-block' }}>대표자:</span> {company.representative}</div>
            <div><span style={{ fontWeight: 'bold', width: '80px', display: 'inline-block' }}>연락처:</span> {company.contact}</div>
            <div><span style={{ fontWeight: 'bold', width: '80px', display: 'inline-block' }}>가입일:</span> {company.joinedAt}</div>
          </div>
        </div>

        {/* Billing Info */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <CreditCard size={24} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#111' }}>구독 및 결제 설정</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>요금제</label>
                <select 
                  value={formData.plan} 
                  onChange={e => setFormData({...formData, plan: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                >
                  <option value="Basic">Basic (소규모)</option>
                  <option value="Pro">Pro (중소기업)</option>
                  <option value="Enterprise">Enterprise (대기업)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>결제 금액 (원/월)</label>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>다음 결제 예정일</label>
                <input 
                  type="date" 
                  value={formData.nextBillingDate} 
                  onChange={e => setFormData({...formData, nextBillingDate: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  결제 상태
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'normal', marginTop: '4px' }}>* '미납' 처리 시 즉시 고객사의 이용이 정지됩니다.</div>
                </label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                >
                  <option value="결제완료">결제완료</option>
                  <option value="미납">미납</option>
                </select>
              </div>
              
              <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', backgroundColor: '#111', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '16px' }}>
                <Save size={18} /> 설정 저장하기
              </button>
            </div>
          </div>

        {/* Manual Payment */}
        {subscription && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CreditCard size={24} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#111' }}>수동 결제 등록</h3>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              납부를 확인하고 수동으로 결제를 처리합니다. <br/>(결제 내역 추가, 기한 1개월 연장, 상태 활성 복구)
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>결제 수단</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                >
                  <option value="신용카드">신용카드</option>
                  <option value="계좌이체">계좌이체</option>
                  <option value="가상계좌">가상계좌</option>
                </select>
              </div>
              <button onClick={handleManualPayment} style={{ height: '43px', padding: '0 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                결제 처리
              </button>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <History size={24} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#111' }}>결제 내역</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', backgroundColor: '#f8fafc', borderRadius: '8px' }}>결제 내역이 없습니다.</div>
            ) : (
              history.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: idx < history.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginBottom: '4px' }}>{item.date}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>결제수단: {item.method}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#111', marginBottom: '4px' }}>{item.amount.toLocaleString()}원</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <CheckCircle2 size={12} color="#22c55e" />
                      <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold' }}>{item.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default CompanyBilling;

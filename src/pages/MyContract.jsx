import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DataContext } from '../context/DataContext';
import ContractDocument from '../components/ContractDocument';
import html2canvas from 'html2canvas';
import { ArrowLeft, PenTool, CheckCircle, AlertCircle, Download } from 'lucide-react';

function MyContract() {
  const navigate = useNavigate();
  const { currentUser, users } = useContext(AuthContext);
  const { contracts, signContract, companies } = useContext(DataContext);
  
  const documentRef = useRef(null); // 이미지 저장을 위한 Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  if (!currentUser) return null;

  const userContracts = contracts.filter(c => c.userId === currentUser.id).sort((a,b) => b.id - a.id);
  const activeContract = userContracts[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeContract?.status === '서명완료') return;
    canvas.style.touchAction = 'none';
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, [activeContract]);

  const getCoordinates = (nativeEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      return { offsetX: nativeEvent.touches[0].clientX - rect.left, offsetY: nativeEvent.touches[0].clientY - rect.top };
    } else {
      return { offsetX: nativeEvent.clientX - rect.left, offsetY: nativeEvent.clientY - rect.top };
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!canvasRef.current || activeContract?.status === '서명완료') return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !canvasRef.current || activeContract?.status === '서명완료') return;
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
    if (!canvasRef.current || activeContract?.status === '서명완료') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = () => {
    if (!hasSigned) {
      alert('근로자 서명을 먼저 입력해주세요.');
      return;
    }
    if (window.confirm('서명을 완료하시겠습니까? 완료 후에는 계약이 체결되며 수정할 수 없습니다.')) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      signContract(activeContract.id, dataUrl);
      alert('전자 근로계약 체결이 완료되었습니다.');
    }
  };

  const handleDownloadImage = async () => {
    if (!documentRef.current) return;
    try {
      const canvas = await html2canvas(documentRef.current, { scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `근로계약서_${currentUser.name}_${activeContract.issuedAt}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount) => (Number(amount) || 0).toLocaleString() + '원';

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>내 근로계약서</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 60px)' }}>
        
        {!activeContract ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '16px', padding: '40px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'center' }}>
            <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>등록된 계약서가 없습니다</h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>인사팀에서 전자 근로계약서를 발송하면 이곳에서 확인하고 서명할 수 있습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
            
            {activeContract.status === '서명대기' ? (
              <div style={{ backgroundColor: '#fffbe8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px' }}>
                <PenTool size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '14px', color: '#854d0e', lineHeight: '1.4' }}>
                  <strong>서명이 필요합니다.</strong><br/>
                  아래 근로조건을 꼼꼼히 확인하신 후, 사업주 서명을 확인하고 맨 하단의 (을)근로자 란에 자필로 사인해 주세요.
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '14px', color: '#15803d', fontWeight: 'bold' }}>
                    양측 서명이 완료된 전자 근로계약서입니다.
                  </div>
                </div>
                <button 
                  onClick={handleDownloadImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', color: '#16a34a', border: '1px solid #16a34a', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Download size={14} /> 저장
                </button>
              </div>
            )}

            {/* 고용노동부 표준 근로계약서 뷰 컴포넌트 */}
            <div ref={documentRef} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <ContractDocument 
                contract={activeContract} 
                employer={{
                  ...users.find(u => u.companyId === activeContract.companyId && u.roleCode === 'COMPANY_ADMIN'),
                  companyName: companies.find(c => c.id === activeContract.companyId)?.name || activeContract.companyId,
                  companyPhone: companies.find(c => c.id === activeContract.companyId)?.contact || users.find(u => u.companyId === activeContract.companyId && u.roleCode === 'COMPANY_ADMIN')?.companyPhone,
                  companyAddress: companies.find(c => c.id === activeContract.companyId)?.address || users.find(u => u.companyId === activeContract.companyId && u.roleCode === 'COMPANY_ADMIN')?.companyAddress,
                  ceoName: companies.find(c => c.id === activeContract.companyId)?.representative || users.find(u => u.companyId === activeContract.companyId && u.roleCode === 'COMPANY_ADMIN')?.ceoName
                }} 
                employee={{
                  ...currentUser,
                  address: currentUser.address || '(상세 주소 입력 요망)',
                  phone: currentUser.phone || '(연락처 입력 요망)'
                }} 
              />
            </div>

            {/* (을) 근로자 서명 패드 (서명대기 상태일 때만 노출) */}
            {activeContract.status === '서명대기' && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>근로자 전자 서명</h3>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', overflow: 'hidden', position: 'relative', backgroundColor: '#f8fafc' }}>
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={150}
                    style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <button onClick={clearCanvas} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>지우기</button>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>위 계약서 내용을 모두 확인하였으며, 이에 동의하여 서명합니다.</div>

                <button 
                  onClick={handleSubmit}
                  style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
                  근로계약 체결 동의
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export default MyContract;

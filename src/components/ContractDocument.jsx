import React from 'react';

// 고용노동부 표준근로계약서 양식을 100% 재현하는 컴포넌트
function ContractDocument({ contract, employer, employee }) {
  if (!contract) return null;

  const formatDate = (dateString) => {
    if (!dateString) return { y: '    ', m: '  ', d: '  ' };
    const [y, m, d] = dateString.split('-');
    return { y, m, d };
  };

  const start = formatDate(contract.startDate);
  const end = formatDate(contract.endDate);
  const issued = formatDate(contract.issuedAt);

  // 시간 포맷 (HH:MM -> HH시 MM분)
  const formatTime = (timeStr) => {
    if (!timeStr) return { h: '  ', m: '  ' };
    const [h, m] = timeStr.split(':');
    return { h, m };
  };

  const wStart = formatTime(contract.workStart);
  const wEnd = formatTime(contract.workEnd);
  const bStart = formatTime(contract.breakStart);
  const bEnd = formatTime(contract.breakEnd);

  const formatCurrency = (amount) => (Number(amount) || 0).toLocaleString();

  const hasBonus = Number(contract.bonus) > 0;
  const hasExtra = Number(contract.extraPay) > 0;
  const payMethodDirect = contract.payMethod === '직접지급';
  const payMethodBank = contract.payMethod !== '직접지급'; // 예금통장 가정

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '30px 20px', 
      color: '#000', 
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
      fontSize: '13px',
      lineHeight: '1.8',
      border: '1px solid #ccc',
      maxWidth: '600px',
      margin: '0 auto',
      wordBreak: 'keep-all'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ 
          display: 'inline-block', 
          fontSize: '22px', 
          fontWeight: 'bold', 
          border: '2px solid #000', 
          padding: '8px 24px',
          margin: 0,
          letterSpacing: '2px'
        }}>표준근로계약서</h2>
      </div>
      
      <div style={{ marginBottom: '20px', textIndent: '10px' }}>
        <span style={{ textDecoration: 'underline', padding: '0 10px' }}>{contract.snapshot?.employer?.companyName || employer?.companyName || employer?.companyId || '                              '}</span> (이하 "갑"이라 함)과(와) 
        <span style={{ textDecoration: 'underline', padding: '0 10px' }}>{contract.snapshot?.employee?.name || employee?.name || '                    '}</span> (이하 "을"이라 함)은<br/>
        다음과 같이 근로계약을 체결한다.
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>1. 근로계약기간 : </strong>
        {start.y}년 {start.m}월 {start.d}일부터 {end.y}년 {end.m}월 {end.d}일까지
      </div>
      <div style={{ fontSize: '11px', color: '#555', paddingLeft: '20px', marginBottom: '16px' }}>
        ※ 근로계약기간을 정하지 않는 경우에는 "근로개시일"만 기재
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>2. 근 무 장 소 : </strong>
        <span style={{ textDecoration: 'underline' }}>{contract.workplace || '                                        '}</span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>3. 업무의 내용 : </strong>
        <span style={{ textDecoration: 'underline' }}>{contract.jobDescription || '                                        '}</span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>4. 소정근로시간 : </strong>
        {wStart.h}시 {wStart.m}분부터 {wEnd.h}시 {wEnd.m}분까지 
        (휴게시간: {bStart.h}시 {bStart.m}분 ~ {bEnd.h}시 {bEnd.m}분)
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>5. 근무일/휴일 : </strong>
        매주 <span style={{ textDecoration: 'underline' }}>{contract.workDays || '  '}</span>일(또는 매일단위)근무, 주휴일 매주 <span style={{ textDecoration: 'underline' }}>{contract.holiday || '  '}</span>요일
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>6. 임   금</strong>
        <div style={{ paddingLeft: '16px' }}>
          - 월(일, 시간)급 : <span style={{ textDecoration: 'underline' }}>{formatCurrency(contract.baseSalary)}</span>원<br/>
          - 상여금 : 있음 ( {hasBonus ? 'O' : ' '} ) <span style={{ textDecoration: 'underline' }}>{hasBonus ? formatCurrency(contract.bonus) : '                    '}</span>원, 
            없음 ( {!hasBonus ? 'O' : ' '} )<br/>
          - 기타급여(제수당 등) : 있음 ( {hasExtra || (contract.allowances && contract.allowances.length > 0) ? 'O' : ' '} ), 없음 ( {!(hasExtra || (contract.allowances && contract.allowances.length > 0)) ? 'O' : ' '} )<br/>
          <div style={{ paddingLeft: '16px' }}>
            · 직무/기타수당 : <span style={{ textDecoration: 'underline' }}>{hasExtra ? formatCurrency(contract.extraPay) : '                    '}</span><br/>
            {contract.allowances && contract.allowances.length > 0 && contract.allowances.map(a => (
              <div key={a.id}>· {a.name} : <span style={{ textDecoration: 'underline' }}>{formatCurrency(a.amount)}</span><br/></div>
            ))}
          </div>
          - 임금지급일 : 매월(매주 또는 매일) <span style={{ textDecoration: 'underline' }}>{contract.payDay || '  '}</span>일(휴일의 경우는 전일 지급)<br/>
          - 지급방법 : 을에게 직접지급( {payMethodDirect ? 'O' : ' '} ), 예금통장에 입금( {payMethodBank ? 'O' : ' '} )
          {contract.wageProvision && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f8fafc', borderLeft: '3px solid #cbd5e1', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              [특약사항] {contract.wageProvision}
            </div>
          )}
        </div>
      </div>

      {contract.additionalClauses ? (
        <div style={{ marginBottom: '40px' }}>
          {contract.additionalClauses.map((clause, index) => (
            <div key={clause.id} style={{ marginBottom: '16px' }}>
              <strong>{index + 7}. {clause.title}</strong>
              <div style={{ paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
                - {clause.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            <strong>7. 연차유급휴가</strong>
            <div style={{ paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
              - {contract.clause7 || '근로기준법에서 정하는 바에 따라 부여함'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>8. 근로계약서 교부</strong>
            <div style={{ paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
              - {contract.clause8 || '"갑"은 근로계약을 체결함과 동시에 본 계약서를 사본하여 "을"에게 교부함\n  (교부요구가 없더라도 "갑"은 교부함(근로기준법 제17조 참조))'}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <strong>9. 기 타</strong>
            <div style={{ paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
              - {contract.clause9 || '이 계약에 정함이 없는 사항은 근로기준법령에 의함'}
            </div>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px', fontSize: '15px' }}>
        {issued.y}년 &nbsp;&nbsp;&nbsp;&nbsp; {issued.m}월 &nbsp;&nbsp;&nbsp;&nbsp; {issued.d}일
      </div>

      {/* 서명란 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* 갑 서명란 */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: '40px', flexShrink: 0 }}>(갑)</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>사업체명 :</div>
              <div style={{ marginRight: '16px' }}>{contract.snapshot?.employer?.companyName || employer?.companyName || employer?.companyId}</div>
              <div>(전화 : {contract.snapshot?.employer?.companyPhone || employer?.companyPhone || '              '})</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>주 &nbsp;&nbsp;&nbsp; 소 :</div>
              <div style={{ flex: 1, wordBreak: 'keep-all' }}>{contract.snapshot?.employer?.companyAddress || employer?.companyAddress}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>대 표 자 :</div>
              <div style={{ flex: 1 }}>{contract.snapshot?.employer?.ceoName || employer?.ceoName}</div>
              <div style={{ width: '60px', flexShrink: 0 }}>(서명)</div>
              <div style={{ width: '100px', height: '40px', position: 'relative' }}>
                {contract.employerSignature && (
                  <img src={contract.employerSignature} alt="갑 서명" style={{ position: 'absolute', top: -10, left: -20, height: '60px', zIndex: 10 }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 을 서명란 */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: '40px', flexShrink: 0 }}>(을)</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>주 &nbsp;&nbsp;&nbsp; 소 :</div>
              <div style={{ flex: 1, wordBreak: 'keep-all' }}>{contract.snapshot?.employee?.address || employee?.address}</div>
            </div>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>연 락 처 :</div>
              <div style={{ flex: 1 }}>{contract.snapshot?.employee?.phone || employee?.phone}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '65px', flexShrink: 0 }}>성 &nbsp;&nbsp;&nbsp; 명 :</div>
              <div style={{ flex: 1 }}>{contract.snapshot?.employee?.name || employee?.name}</div>
              <div style={{ width: '60px', flexShrink: 0 }}>(서명)</div>
              <div style={{ width: '100px', height: '40px', position: 'relative' }}>
                {contract.status === '서명완료' && contract.signatureDataUrl && (
                  <img src={contract.signatureDataUrl} alt="을 서명" style={{ position: 'absolute', top: -10, left: -20, height: '60px', zIndex: 10 }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractDocument;

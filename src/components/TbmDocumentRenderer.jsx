import React, { forwardRef } from 'react';

const TbmDocumentRenderer = forwardRef(({ tbm }, ref) => {
  if (!tbm || tbm.type === 'free') return null;

  const data = tbm.data || {};

  if (tbm.type === 'checklist') {
    return (
      <div 
        ref={ref} 
        style={{ 
          width: '794px', minWidth: '794px', backgroundColor: 'white', padding: '40px', 
          boxSizing: 'border-box', color: '#000', fontFamily: 'sans-serif',
          border: '1px solid #ccc', margin: '0 auto' 
        }}
      >
        <div style={{ backgroundColor: '#0033cc', color: 'white', padding: '16px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '0' }}>
          TBM(Tool Box Meeting) 실행 체크리스트(안)
        </div>
        
        <div style={{ border: '2px solid #000', borderTop: 'none', padding: '16px', fontSize: '12px', lineHeight: '1.6' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>&lt; 유의사항 &gt;</div>
          <div style={{ display: 'flex', gap: '4px' }}><span style={{ color: '#f59e0b' }}>◆</span> <span>TBM은 작업 전 TBM 리더와 작업자 간 실행하는 안전보건 회의입니다.</span></div>
          <div style={{ display: 'flex', gap: '4px' }}><span style={{ color: '#f59e0b' }}>◆</span> <span>이 체크리스트는 TBM 리더에게 효과적인 TBM 실행 팁을 제공하기 위해 제작된 것으로 사내 TBM 절차가 있는 경우 이와 함께 보완적으로 사용합니다.</span></div>
          <div style={{ display: 'flex', gap: '4px' }}><span style={{ color: '#f59e0b' }}>◆</span> <span>작업별 위험요인은 위험성평가결과 또는 별도의 자료를 활용하시기 바랍니다.</span></div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '8px' }}>
            * 산업안전보건공단 누리집(www.kosha.or.kr) 자료마당 &gt; 통합자료실(검색: 작업 전 안전점검), 미국 OSHA 홈페이지(www.osha.net/toolbox-talks-free-downloads)
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', borderTop: 'none', fontSize: '12px', textAlign: 'center' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', width: '50%', textAlign: 'left', fontWeight: 'bold' }}>
                작업일자: <span style={{ fontWeight: 'normal', marginLeft: '10px' }}>{tbm.date ? tbm.date.split(' ')[0] : ''}</span>
              </td>
              <td style={{ border: '1px solid #000', padding: '10px', width: '50%', textAlign: 'left', fontWeight: 'bold' }}>
                TBM 리더: <span style={{ fontWeight: 'normal', marginLeft: '10px' }}>{data.leaderDept} / {data.leaderPosition} {data.leaderName}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', borderTop: 'none', fontSize: '12px' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', width: '40%' }}>확인사항</th>
              <th colSpan={3} style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', width: '30%' }}>해당 사항에 체크(V) 하세요</th>
              <th rowSpan={2} style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', width: '30%' }}>'아니오'인 경우 필요한<br/>조치 내용</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', width: '10%' }}>YES</th>
              <th style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', width: '10%' }}>NO</th>
              <th style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', width: '10%' }}>해당 없음</th>
            </tr>
          </thead>
          <tbody>
            {/* Section 1 */}
            <tr>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#fff3e0', fontWeight: 'bold', color: '#d97706' }}>1 TBM 사전준비</td>
            </tr>
            {(data.prepQuestions || []).map((q, idx) => (
              <tr key={'prep'+idx}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{q.question || q.text}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{q.status === 'YES' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{q.status === 'NO' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{q.status === 'N/A' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', color: '#ef4444' }}>{q.note}</td>
              </tr>
            ))}

            {/* Section 2 */}
            <tr>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f3e8ff', fontWeight: 'bold', color: '#3b82f6' }}>2 TBM 실행과정</td>
            </tr>
            {(data.execQuestions || []).map((q, idx) => (
              <tr key={'exec'+idx}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{q.question || q.text}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{q.status === 'YES' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{q.status === 'NO' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{q.status === 'N/A' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', color: '#ef4444' }}>{q.note}</td>
              </tr>
            ))}

            {/* Section 3 */}
            <tr>
              <td colSpan={5} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#ecfdf5', fontWeight: 'bold', color: '#059669' }}>3 TBM 후속조치</td>
            </tr>
            {(data.postQuestions || []).map((q, idx) => (
              <tr key={'post'+idx}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{q.question || q.text}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{q.status === 'YES' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>{q.status === 'NO' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{q.status === 'N/A' ? 'V' : ''}</td>
                <td style={{ border: '1px solid #000', padding: '8px', color: '#ef4444' }}>{q.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ display: 'flex', border: '2px solid #000', borderTop: 'none', padding: '20px 16px', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>TBM 리더 확인 서명</div>
          <div>소속: <span style={{ fontWeight: 'bold', marginRight: '20px' }}>{data.leaderDept}</span></div>
          <div>직책: <span style={{ fontWeight: 'bold', marginRight: '20px' }}>{data.leaderPosition}</span></div>
          <div>성명: <span style={{ fontWeight: 'bold' }}>{data.leaderName}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>(서명)</span>
            <div style={{ width: '80px', height: '40px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {data.leaderSignature ? <img src={data.leaderSignature} style={{ height: '100%' }} alt="서명" /> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tbm.type === 'minutes') {
    return (
      <div 
        ref={ref} 
        style={{ 
          width: '794px', minWidth: '794px', backgroundColor: 'white', padding: '40px', 
          boxSizing: 'border-box', color: '#000', fontFamily: 'sans-serif',
          border: '1px solid #ccc', margin: '0 auto' 
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          Tool Box Meeting 회의록(양식)
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', width: '15%', fontWeight: 'bold', textAlign: 'center' }}>TBM 일시</td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{data.tbmDate} {data.tbmTimeStart} ~ {data.tbmTimeEnd}</span>
                  <span style={{ fontSize: '11px', color: '#4b5563' }}>작업날짜와 동일함 ( {data.isTimeSameAsDate ? '☑' : '☐'} 예, {data.isTimeSameAsDate ? '☐' : '☑'} 아니오 )</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>작 업 명</td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>{data.taskName}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>작업내용</td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '10px' }}>{data.taskContent}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>TBM 장소</td>
              <td style={{ border: '1px solid #000', padding: '10px', width: '45%' }}>{data.location}</td>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', width: '20%', fontWeight: 'bold', textAlign: 'center' }}>위험성평가 실시여부</td>
              <td style={{ border: '1px solid #000', padding: '10px', width: '20%', textAlign: 'center' }}>
                예 {data.riskAssessmentDone ? '☑' : '☐'}&nbsp;&nbsp;&nbsp;아니오 {!data.riskAssessmentDone ? '☑' : '☐'}
              </td>
            </tr>
            
            <tr>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>잠재위험요인</td>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>대책 (※ 제거 → 대체 → 통제 순서 고려)</td>
            </tr>
            {(data.hazards || [{hazard:'', countermeasure:''}]).map((h, idx) => (
              <tr key={'hazard'+idx}>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '10px' }}>{idx + 1}</div>
                    <span>{h.hazard}</span>
                  </div>
                </td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '10px' }}>{idx + 1}</div>
                    <span>{h.countermeasure}</span>
                  </div>
                </td>
              </tr>
            ))}

            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 'bold', textAlign: 'center' }}>중점위험<br/>요인</td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: '1px solid #000', padding: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>선정</div>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>※ 중요위험 1개 선정:</span>
                        <span style={{ fontWeight: 'bold' }}>{data.focusHazard?.selection}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '11px' }}>대책</div>
                        <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>{data.focusHazard?.countermeasure}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            <tr>
              <td style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>TBM 리더 확인</td>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>• 소속 : <span style={{ fontWeight: 'bold' }}>{data.leaderDept}</span></div>
                    <div>• 직책 : <span style={{ fontWeight: 'bold' }}>{data.leaderPosition}</span></div>
                    <div>• 성명 : <span style={{ fontWeight: 'bold' }}>{data.leaderName}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>(서명)</span>
                    <div style={{ width: '80px', height: '40px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {data.leaderSignature ? <img src={data.leaderSignature} style={{ height: '100%' }} alt="서명" /> : null}
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#000', color: 'white', fontWeight: 'bold' }}>
                ■ 작업 전 안전조치 확인 <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'normal', marginLeft: '12px' }}>※ 위 잠재위험요인(중점위험 포함) 안전조치 여부 재확인</span>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>잠재위험요소(중점위험 포함)</td>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>조치 여부</td>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#f9fafb', fontWeight: 'bold', textAlign: 'center' }}>'아니오'인 경우 조치 내용</td>
            </tr>
            {(data.hazards || [{hazard: '', countermeasure: ''}]).map((hazardObj, idx) => {
              const c = (data.preWorkSafetyChecks && data.preWorkSafetyChecks[idx]) ? data.preWorkSafetyChecks[idx] : { status: '', note: '' };
              return (
                <tr key={'check'+idx}>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ border: '1px solid #ccc', padding: '2px 6px', fontSize: '10px', color: '#9ca3af' }}>{idx + 1}</div>
                      <span>{hazardObj.hazard}</span>
                    </div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                    예 {c.status === 'YES' ? '☑' : '☐'}, 아니오 {c.status === 'NO' ? '☑' : '☐'}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', color: '#ef4444' }}>{c.note}</td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#000', color: 'white', fontWeight: 'bold' }}>
                ■ 작업 전 일일 안전점검 시행 결과
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>※ 위험요인 중 조치가 되지 않은 사항, 작업자의 TBM내용 숙지 여부 중점체크</div>
                <div style={{ fontWeight: 'bold' }}>{data.dailyCheckResult || '해당 없음 (정상 시행)'}</div>
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#000', color: 'white', fontWeight: 'bold' }}>
                ■ 작업 후 종료 미팅(중점대책의 실효성)
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '16px', fontWeight: 'bold' }}>
                {data.postMeetingResult || '안전하게 작업 종료 및 정리정돈 상태 양호함.'}
              </td>
            </tr>

            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#000', color: 'white', fontWeight: 'bold' }}>
                ■ 참석자 확인 <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'normal', marginLeft: '12px' }}>※ TBM에 참여하지 않은 작업자를 확인하여 미팅 참석 유도</span>
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '0', border: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>이름</td>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>서명</td>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>이름</td>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>서명</td>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>이름</td>
                      <td style={{ border: '1px solid #000', padding: '6px', backgroundColor: '#f9fafb', fontWeight: 'bold', width: '16.6%' }}>서명</td>
                    </tr>
                    {(() => {
                      const parts = data.participants || [];
                      const rows = Math.max(1, Math.ceil(parts.length / 3));
                      const result = [];
                      for (let i = 0; i < rows; i++) {
                        const p1 = parts[i * 3];
                        const p2 = parts[i * 3 + 1];
                        const p3 = parts[i * 3 + 2];
                        result.push(
                          <tr key={'part'+i}>
                            <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>{p1?.name || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>
                              <div style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {p1?.signature ? <img src={p1.signature} style={{ height: '100%' }} alt="서명" /> : ''}
                              </div>
                            </td>
                            <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>{p2?.name || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>
                              <div style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {p2?.signature ? <img src={p2.signature} style={{ height: '100%' }} alt="서명" /> : ''}
                              </div>
                            </td>
                            <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>{p3?.name || ''}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>
                              <div style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {p3?.signature ? <img src={p3.signature} style={{ height: '100%' }} alt="서명" /> : ''}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return result;
                    })()}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return null;
});

export default TbmDocumentRenderer;

import { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, ClipboardList, Users, AlertTriangle, Plus, Trash2, PenTool, Camera, File, Image as ImageIcon, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import TbmDocumentRenderer from '../../components/TbmDocumentRenderer';
import TbmTemplateManagement from '../admin/TbmTemplateManagement';

import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';

// 자필 서명 입력 모달 컴포넌트
function SignatureModal({ isOpen, onClose, onSave, currentUser, updateEmployee }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSaveToProfile(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.touchAction = 'none';
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, [isOpen]);

  const getCoordinates = (nativeEvent) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (nativeEvent.touches && nativeEvent.touches.length > 0) {
      return { 
        offsetX: nativeEvent.touches[0].clientX - rect.left, 
        offsetY: nativeEvent.touches[0].clientY - rect.top 
      };
    } else {
      return { 
        offsetX: nativeEvent.clientX - rect.left, 
        offsetY: nativeEvent.clientY - rect.top 
      };
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!canvasRef.current) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !canvasRef.current) return;
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
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSave = () => {
    if (!hasSigned) {
      alert('서명을 그려주세요.');
      return;
    }
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (saveToProfile && updateEmployee && currentUser) {
      updateEmployee(currentUser.id, { savedSignature: dataUrl });
      alert('입력하신 서명이 [내 정보]에 저장되었습니다.');
    }
    onSave(dataUrl);
    onClose();
  };

  const loadSavedSignature = () => {
    if (currentUser?.savedSignature) {
      onSave(currentUser.savedSignature);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        {currentUser?.savedSignature ? (
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>간편 서명</h3>
            <div style={{ padding: '24px 0', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', color: '#334155', fontWeight: 'bold', marginBottom: '8px' }}>내 정보에 서명이 등록되어 있습니다.</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>등록된 서명으로 서명을 진행합니다.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '14px', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: 'white', color: '#64748b', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { onSave(currentUser.savedSignature); onClose(); }} style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>등록된 서명으로 진행</button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>자필 서명 입력</h3>
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
              <button onClick={clearCanvas} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.1)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>지우기</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={saveToProfile} 
                onChange={(e) => setSaveToProfile(e.target.checked)} 
                style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
              />
              이 서명을 내 정보에 저장하여 나중에도 사용하기
            </label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', backgroundColor: 'white', color: '#64748b', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSave} style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>확인</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TbmExecution({ isEmbedded = false, searchTerm = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, users, updateEmployee } = useContext(AuthContext);

  const lastVisits = useMemo(() => {
    if (!currentUser?.id) return {};
    const saved = localStorage.getItem(`lastVisits_${currentUser.id}`);
    return saved ? JSON.parse(saved) : {};
  }, [location.pathname, location.search, currentUser?.id]);

  const isTbmUnread = (t) => {
    if (currentUser?.roleCode !== 'COMPANY_ADMIN') return false;
    const path = `/admin/safety?tab=TBM&id=${t.id}`;
    const visitTime = lastVisits[path];
    if (!visitTime) return true;
    return new Date(t.date || t.createdAt) > new Date(visitTime);
  };

  const tbmPrintRef = useRef(null);

  const handleDownloadDocument = async () => {
    if (!tbmPrintRef.current) return;
    try {
      const clone = tbmPrintRef.current.cloneNode(true);
      const offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;min-width:794px;background:#fff;z-index:-1;padding:0;margin:0;';
      clone.style.margin = '0'; // Remove auto margin for capture
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      const imgs = clone.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      const canvas = await html2canvas(clone, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });
      document.body.removeChild(offscreen);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedTbmDetail.title}_${selectedTbmDetail.userName}_${selectedTbmDetail.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    }
  };
  const { submitTbm, tbmSubmissions, updateTbm, sendMessage, companies } = useContext(DataContext);

  const [viewMode, setViewMode] = useState(location.state?.mode || 'list');
  const [selectedTbmDetail, setSelectedTbmDetail] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && tbmSubmissions) {
      const item = tbmSubmissions.find(m => m.id.toString() === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTbmDetail(item);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode('detail');
      }
    } else {
      setSelectedTbmDetail(null);
      setViewMode('list');
    }
  }, [location.search, tbmSubmissions]);

  const [tbmFiles, setTbmFiles] = useState([]);

  // 목록 접기 상태 관리 (회의록 및 체크리스트는 기본적으로 접힌 상태)
  const [isPendingMinutesExpanded, setIsPendingMinutesExpanded] = useState(false);
  const [isCompletedMinutesExpanded, setIsCompletedMinutesExpanded] = useState(false);
  const [isCompletedChecklistExpanded, setIsCompletedChecklistExpanded] = useState(false);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTbmFiles(prev => [...prev, { name: file.name, type: file.type, data: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeFile = (index) => setTbmFiles(prev => prev.filter((_, i) => i !== index));



  const [selectedForm, setSelectedForm] = useState(null); // 'checklist' | 'minutes'
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // --- 서명 서브 모달 관련 상태 ---
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState(null); // 'leader' | { type: 'participant', index: number } | 'viewer'

  // ==========================================
  // [1] TBM 실행 체크리스트 상태 관리
  // ==========================================
  const [checklistDate, setChecklistDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklistLeader, setChecklistLeader] = useState(currentUser?.name || '');
  const [checklistLeaderSig, setChecklistLeaderSig] = useState('');
  
  const myCompany = companies?.find(c => c.id === currentUser?.companyId);
  const tbmTemplate = myCompany?.tbm_template;

  const checklistQuestions_1 = tbmTemplate?.prep || [
    { id: 1, text: '해당 작업의 위험성평가를 실시하였다. (해당 작업의 위험성평가 결과가 있다.)' },
    { id: 2, text: '해당 작업에서 발생한 사고보고서(아차사고 포함)의 내용을 확인하였다.' },
    { id: 3, text: '작업 물량과 범위, 작업내용과 필요한 보호구를 잘 알고 있다.' },
    { id: 4, text: '위험성평가 결과, 사고보고서, 안전작업지침의 내용을 여러 번 읽어 숙지하였다.' }
  ];
  
  const checklistQuestions_2 = tbmTemplate?.exec || [
    { id: 1, text: '작업자가 음주, 발열, 약물 복용 등으로 작업에 적합한지 여부를 확인하였다.' },
    { id: 2, text: '작업내용 / 위험요인 / 안전 작업절차 / 대책에 대해 긍정적인 분위기로 대화하였다.' },
    { id: 3, text: '작업자와 중점 위험요인과 대책을 도출하고 이를 숙지하도록 하였다.' },
    { id: 4, text: '위험요인, 불안전한 상태 발견시 멈추고, 확인하고, 생각한 후 작업하도록 하였다.' },
    { id: 5, text: '작업 후 정리 정돈을 상태를 확인하였다.' }
  ];

  const checklistQuestions_3 = tbmTemplate?.post || [
    { id: 1, text: '작업자가 제기한 불만사항, 질문, 제안사항을 검토하였다.' },
    { id: 2, text: 'TBM 결과를 충실하게 기록하고 보관한다.' },
    { id: 3, text: '관련 조치결과는 작업자에게 피드백 한다.' }
  ];

  const [prepAnswers, setPrepAnswers] = useState(() => checklistQuestions_1.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
  const [execAnswers, setExecAnswers] = useState(() => checklistQuestions_2.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
  const [postAnswers, setPostAnswers] = useState(() => checklistQuestions_3.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));

  useEffect(() => {
    setPrepAnswers(checklistQuestions_1.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
    setExecAnswers(checklistQuestions_2.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
    setPostAnswers(checklistQuestions_3.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
  }, [tbmTemplate]);

  const resetForms = () => {
    setChecklistDate(new Date().toISOString().split('T')[0]);
    setChecklistLeader(currentUser?.name || '');
    setChecklistLeaderSig('');
    setPrepAnswers(checklistQuestions_1.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
    setExecAnswers(checklistQuestions_2.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
    setPostAnswers(checklistQuestions_3.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));

    setMDate(new Date().toISOString().split('T')[0]);
    setMTimeStart('');
    setMTimeEnd('');
    setIsTimeSameAsDate('예');
    setMTaskName('');
    setMTaskContent('');
    setMLocation('');
    setMRiskAssessmentDone('예');
    setMHazards([{ id: 1, hazard: '', countermeasure: '' }]);
    setMFocusSelection('');
    setMFocusCountermeasure('');
    setMLeaderDept(currentUser?.department || '');
    setMLeaderPosition(currentUser?.role || '');
    setMLeaderName(currentUser?.name || '');
    setMLeaderSig('');
    setMSafetyChecks([
      { id: 1, hazard: '', status: 'YES', note: '' }
    ]);
    setMDailyCheckResult('양호');
    setMPostMeetingResult('양호');
    setMParticipants([{ userId: '', name: '', signature: '' }]);

    setFreeTitle('');
    setFreeContent('');
    setTbmFiles([]);
  };


  const handleChecklistStatusChange = (section, id, status) => {
    const updateFn = (prev) => prev.map(item => item.id === id ? { ...item, status } : item);
    if (section === 'prep') setPrepAnswers(updateFn);
    if (section === 'exec') setExecAnswers(updateFn);
    if (section === 'post') setPostAnswers(updateFn);
  };

  const handleChecklistNoteChange = (section, id, note) => {
    const updateFn = (prev) => prev.map(item => item.id === id ? { ...item, note } : item);
    if (section === 'prep') setPrepAnswers(updateFn);
    if (section === 'exec') setExecAnswers(updateFn);
    if (section === 'post') setPostAnswers(updateFn);
  };

  const submitFreeForm = () => {
    if (!freeTitle.trim()) {
      alert('작업명(제목)을 입력해 주세요.');
      return;
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateWithTime = `${now.toISOString().split('T')[0]} ${timeStr}`;

    submitTbm(
      currentUser.id,
      currentUser.name,
      currentUser.companyId,
      dateWithTime,
      'free',
      freeTitle,
      { content: freeContent },
      tbmFiles
    );
    alert('자유서식이 성공적으로 등록되었습니다.');
    setViewMode('list');
    setFreeTitle('');
    setFreeContent('');
    setTbmFiles([]);
  };

  const submitChecklist = () => {
    const allChecked = [...prepAnswers, ...execAnswers, ...postAnswers].every(q => q.status !== '');
    if (!allChecked) {
      alert('체크리스트의 모든 확인 사항을 체크해 주세요.');
      return;
    }
    const noWithoutNote = [...prepAnswers, ...execAnswers, ...postAnswers].some(q => q.status === 'NO' && !q.note.trim());
    if (noWithoutNote) {
      alert("'아니오'로 체크된 항목은 조치 내용을 필수 입력해야 합니다.");
      return;
    }
    if (!checklistLeaderSig) {
      alert('TBM 리더 확인 서명을 입력해 주세요.');
      return;
    }

    const tbmData = {
      prepQuestions: prepAnswers,
      execQuestions: execAnswers,
      postQuestions: postAnswers,
      leaderDept: currentUser?.department || '안전관리부',
      leaderPosition: currentUser?.role || '관리자',
      leaderName: checklistLeader,
      leaderSignature: checklistLeaderSig
    };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateWithTime = `${checklistDate} ${timeStr}`;

    submitTbm(
      currentUser.id,
      currentUser.name,
      currentUser.companyId || 'company_a',
      dateWithTime,
      'checklist',
      'TBM 실행 체크리스트',
      tbmData
    );

    alert('TBM 실행 체크리스트가 성공적으로 제출되었습니다.');
    navigate(-1);
  };

  // ==========================================
  // [2] Tool Box Meeting 회의록 상태 관리
  // ==========================================
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mTimeStart, setMTimeStart] = useState('08:00');
  const [mTimeEnd, setMTimeEnd] = useState('08:30');
  const [isTimeSameAsDate, setIsTimeSameAsDate] = useState('예');
  const [mTaskName, setMTaskName] = useState('');
  const [mTaskContent, setMTaskContent] = useState('');
  const [mLocation, setMLocation] = useState('');
  const [mRiskAssessmentDone, setMRiskAssessmentDone] = useState('예');
  
  // 잠재위험요인 (동적 추가/제외 가능)
  const [mHazards, setMHazards] = useState([
    { id: 1, hazard: '', countermeasure: '' }
  ]);

  // 중점위험요인
  const [mFocusSelection, setMFocusSelection] = useState('');
  const [mFocusCountermeasure, setMFocusCountermeasure] = useState('');

  // TBM 리더 정보
  const [mLeaderDept, setMLeaderDept] = useState(currentUser?.department || '');
  const [mLeaderPosition, setMLeaderPosition] = useState(currentUser?.role || '');
  const [mLeaderName, setMLeaderName] = useState(currentUser?.name || '');
  const [mLeaderSig, setMLeaderSig] = useState('');

  // 작업 전 안전조치 확인 (동적 추가/제외 가능)
  const [mSafetyChecks, setMSafetyChecks] = useState([
    { id: 1, hazard: '', status: 'YES', note: '' }
  ]);

  const handleAddHazard = () => {
    const newId = Date.now();
    setMHazards(prev => [...prev, { id: newId, hazard: '', countermeasure: '' }]);
    setMSafetyChecks(prev => [...prev, { id: newId, hazard: '', status: 'YES', note: '' }]);
  };

  const handleRemoveHazard = (index) => {
    if (mHazards.length <= 1) {
      alert('위험요인은 최소 1개 이상 작성해야 합니다.');
      return;
    }
    setMHazards(prev => prev.filter((_, idx) => idx !== index));
    setMSafetyChecks(prev => prev.filter((_, idx) => idx !== index));
  };

  // 안전점검결과 & 후미팅결과
  const [mDailyCheckResult, setMDailyCheckResult] = useState('');
  const [mPostMeetingResult, setMPostMeetingResult] = useState('');

  // 참석자 서명 목록 (동적)
  const [mParticipants, setMParticipants] = useState([
    { name: '', signature: '' }
  ]);

  // ==========================================
  // [3] 자유 서식 상태 관리
  // ==========================================
  const [freeTitle, setFreeTitle] = useState('');
  const [freeContent, setFreeContent] = useState('');

  const handleHazardChange = (index, field, value) => {
    setMHazards(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    // 작업 전 안전조치의 '잠재위험요소' 텍스트 필드를 실시간으로 연계 업데이트해 사용성 극대화
    if (field === 'hazard') {
      setMSafetyChecks(prev => prev.map((item, idx) => idx === index ? { ...item, hazard: value } : item));
    }
  };

  const handleSafetyCheckChange = (index, field, value) => {
    setMSafetyChecks(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleAddParticipant = () => {
    setMParticipants(prev => [...prev, { name: '', signature: '' }]);
  };

  const handleRemoveParticipant = (index) => {
    if (mParticipants.length === 1) {
      alert('최소 한 명 이상의 참석자가 기재되어야 합니다.');
      return;
    }
    setMParticipants(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleParticipantChange = (index, field, value) => {
    setMParticipants(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const openSignatureModal = (target) => {
    setSignatureTarget(target);
    setSignatureModalOpen(true);
  };

  const handleSaveSignature = (dataUrl) => {
    if (signatureTarget === 'leader') {
      if (selectedForm === 'checklist') {
        setChecklistLeaderSig(dataUrl);
      } else {
        setMLeaderSig(dataUrl);
      }
    } else if (signatureTarget?.type === 'participant') {
      const idx = signatureTarget.index;
      handleParticipantChange(idx, 'signature', dataUrl);
    }
  };

  const submitMinutes = () => {
    if (!mTaskName.trim() || !mTaskContent.trim() || !mLocation.trim()) {
      alert('작업명, 작업내용, TBM 장소를 입력해 주세요.');
      return;
    }
    if (mHazards.some(h => !h.hazard.trim() || !h.countermeasure.trim())) {
      alert('모든 잠재위험요인과 대책을 빠짐없이 입력해 주세요.');
      return;
    }
    if (!mFocusSelection.trim() || !mFocusCountermeasure.trim()) {
      alert('중점위험요인 선정 및 대책을 입력해 주세요.');
      return;
    }
    if (!mLeaderName.trim()) {
      alert('TBM 리더 성명을 입력해 주세요.');
      return;
    }
    if (!mLeaderSig) {
      alert('TBM 리더 확인 서명을 입력해 주세요.');
      return;
    }
    const noCheckWithoutNote = mSafetyChecks.some(c => c.status === 'NO' && !c.note.trim());
    if (noCheckWithoutNote) {
      alert("작업 전 안전조치 중 '아니오'로 체크된 항목은 조치 내용을 입력해 주세요.");
      return;
    }
    if (mParticipants.some(p => !p.userId)) {
      alert('모든 참석자를 선택해 주세요.');
      return;
    }

    const tbmData = {
      tbmDate: mDate,
      tbmTimeStart: mTimeStart,
      tbmTimeEnd: mTimeEnd,
      isTimeSameAsDate: isTimeSameAsDate,
      taskName: mTaskName,
      taskContent: mTaskContent,
      location: mLocation,
      riskAssessmentDone: mRiskAssessmentDone,
      hazards: mHazards,
      focusHazard: {
        selection: mFocusSelection,
        countermeasure: mFocusCountermeasure
      },
      leaderDept: mLeaderDept,
      leaderPosition: mLeaderPosition,
      leaderName: mLeaderName,
      leaderSignature: mLeaderSig,
      preWorkSafetyChecks: mSafetyChecks,
      dailyCheckResult: mDailyCheckResult,
      postMeetingResult: mPostMeetingResult,
      participants: mParticipants
    };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateWithTime = `${mDate} ${timeStr}`;

    submitTbm(
      currentUser.id,
      currentUser.name,
      currentUser.companyId || 'company_a',
      dateWithTime,
      'minutes',
      'Tool Box Meeting 회의록',
      tbmData,
      tbmFiles
    );

    // 참석자 전원에게 자동 알림 발송
    mParticipants.forEach(p => {
      if (p.userId && p.userId !== currentUser.id) {
        sendMessage(
          currentUser.id, 
          currentUser.name, 
          p.userId, 
          '[TBM 서명 요청]', 
          `'${mTaskName}' Tool Box Meeting 회의록 내용 숙지 및 서명을 부탁드립니다.`
        );
      }
    });

    alert('Tool Box Meeting 회의록이 성공적으로 제출되었습니다.');
    setViewMode('list');
    setTbmFiles([]);
  };

  const renderChecklistSection = (sectionTitle, sectionCode, questions, answers) => (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#3b82f6', borderBottom: '1px solid #eff6ff', paddingBottom: '10px' }}>{sectionTitle}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, idx) => {
          const currentAns = answers.find(a => a.id === q.id) || {};
          return (
            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: idx < questions.length - 1 ? '1px dashed #f1f5f9' : 'none', paddingBottom: idx < questions.length - 1 ? '16px' : '0' }}>
              <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', lineHeight: '1.5' }}>
                <span style={{ fontWeight: 'bold', color: '#3b82f6', marginRight: '6px' }}>{idx + 1}.</span>
                {q.text}
              </div>
              
              {/* YES / NO / N/A 선택 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {['YES', 'NO', 'N/A'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChecklistStatusChange(sectionCode, q.id, opt)}
                    style={{
                      flex: 1, padding: '8px 12px', border: currentAns.status === opt ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '8px', backgroundColor: currentAns.status === opt ? '#eff6ff' : 'white',
                      color: currentAns.status === opt ? '#3b82f6' : '#475569', fontWeight: currentAns.status === opt ? 'bold' : 'normal',
                      fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s'
                    }}
                  >
                    {opt === 'YES' ? '예' : opt === 'NO' ? '아니오' : '해당없음'}
                  </button>
                ))}
              </div>

              {/* '아니오'일 경우 필수 조치 내용 입력란 */}
              {currentAns.status === 'NO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>⚠️ 조치 필요 사항 입력 *</label>
                  <input
                    type="text"
                    value={currentAns.note}
                    onChange={(e) => handleChecklistNoteChange(sectionCode, q.id, e.target.value)}
                    placeholder="조치 및 피드백 내용을 구체적으로 기재해 주세요."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#1e293b' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleSignatureModalSave = (dataUrl) => {
    if (signatureTarget === 'viewer') {
      if (selectedTbmDetail) {
        const newSig = {
          userId: currentUser.id,
          userName: currentUser.name,
          signature: dataUrl,
          date: new Date().toISOString()
        };
        const updatedParticipantSignatures = [...(selectedTbmDetail.participantSignatures || []), newSig];
        updateTbm(selectedTbmDetail.id, { participantSignatures: updatedParticipantSignatures });
        setSelectedTbmDetail(prev => ({ ...prev, participantSignatures: updatedParticipantSignatures }));
        alert('서명이 완료되었습니다.');
      }
    } else if (signatureTarget === 'leader') {
      if (selectedForm === 'checklist') setChecklistLeaderSig(dataUrl);
      else setMLeaderSig(dataUrl);
    } else if (signatureTarget?.type === 'participant') {
      const idx = signatureTarget.index;
      setMParticipants(prev => prev.map((p, i) => i === idx ? { ...p, signature: dataUrl } : p));
    }
  };

  const myCompanyTbmSubmissions = (tbmSubmissions || []).filter(t => {
    if (t.companyId !== currentUser.companyId) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const title = t.title?.toLowerCase() || '';
      const topic = t.data?.topic?.toLowerCase() || t.data?.taskName?.toLowerCase() || '';
      const userName = t.userName?.toLowerCase() || '';
      if (!title.includes(term) && !topic.includes(term) && !userName.includes(term)) {
        return false;
      }
    }
    
    if (currentUser.roleCode === 'COMPANY_ADMIN') return true;
    if (t.type === 'checklist') return t.userId === currentUser.id;
    if (t.type === 'minutes') {
      if (t.userId === currentUser.id) return true;
      const parts = t.data?.participants || [];
      return parts.some(p => p.userId === currentUser.id);
    }
    return true; // free form (TBM 서명)
  });

  const unsignedTbms = myCompanyTbmSubmissions.filter(t => {
    if (t.type === 'checklist') return false; // checklist is already signed by the creator
    
    if (currentUser.roleCode === 'COMPANY_ADMIN') {
      if (t.type === 'free') return false; // Admins don't sign free forms
      const targetParticipants = t.data?.participants || [];
      const isParticipant = targetParticipants.some(p => p.userId === currentUser.id);
      const hasSigned = t.participantSignatures?.some(s => s.userId === currentUser.id);
      if (isParticipant && !hasSigned) return true;
      return false; // Not a participant or already signed, so not in unsigned list
    }

    const hasSigned = t.participantSignatures?.some(s => s.userId === currentUser.id);
    if (hasSigned) return false;
    return true;
  });

  const signedTbms = myCompanyTbmSubmissions.filter(t => {
    if (currentUser.roleCode === 'COMPANY_ADMIN') {
      return !unsignedTbms.includes(t); // Admin sees everything else in signed (completed/written) list
    }
    if (t.type === 'checklist') return true; // checklist is already signed by the creator
    return t.participantSignatures?.some(s => s.userId === currentUser.id);
  });

  const renderTbmCard = (tbm, isSigned) => (
    <div 
      key={tbm.id} 
      onClick={() => { 
        if (isEmbedded) {
          navigate(`?tab=TBM&id=${tbm.id}`, { replace: true });
        } else {
          navigate(`?id=${tbm.id}`, { replace: true });
        }
        setSelectedTbmDetail(tbm); 
        setViewMode('detail'); 
        if (tbm.type === 'checklist' && tbm.data) {
          setChecklistDate(tbm.data.checklistDate || '');
          setChecklistLeader(tbm.data.checklistLeader || '');
          setPrepAnswers(tbm.data.prepQuestions || checklistQuestions_1.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
          setExecAnswers(tbm.data.execQuestions || checklistQuestions_2.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
          setPostAnswers(tbm.data.postQuestions || checklistQuestions_3.map(q => ({ id: q.id, text: q.text, status: '', note: '' })));
          setChecklistLeaderSig(tbm.data.checklistLeaderSig || '');
        } else if (tbm.type === 'minutes' && tbm.data) {
          setMDate(tbm.data.mDate || '');
          setMTimeStart(tbm.data.mTimeStart || '');
          setMTimeEnd(tbm.data.mTimeEnd || '');
          setIsTimeSameAsDate(tbm.data.isTimeSameAsDate || '예');
          setMTaskName(tbm.data.mTaskName || '');
          setMTaskContent(tbm.data.mTaskContent || '');
          setMLocation(tbm.data.mLocation || '');
          setMRiskAssessmentDone(tbm.data.mRiskAssessmentDone || '예');
          setMHazards(tbm.data.mHazards || []);
          setMFocusSelection(tbm.data.mFocusSelection || '');
          setMFocusCountermeasure(tbm.data.mFocusCountermeasure || '');
          setMLeaderDept(tbm.data.mLeaderDept || '');
          setMLeaderPosition(tbm.data.mLeaderPosition || '');
          setMLeaderName(tbm.data.mLeaderName || '');
          setMLeaderSig(tbm.data.mLeaderSig || '');
          setMSafetyChecks(tbm.data.mSafetyChecks || []);
          setMDailyCheckResult(tbm.data.mDailyCheckResult || '');
          setMPostMeetingResult(tbm.data.mPostMeetingResult || '');
          setMParticipants(tbm.data.participants || []);
        }
      }}
      style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        padding: '16px', 
        border: isTbmUnread(tbm) ? '1px solid #fecaca' : '1px solid #e2e8f0', 
        boxShadow: isTbmUnread(tbm) ? '0 2px 12px rgba(239, 68, 68, 0.05)' : '0 2px 8px rgba(0,0,0,0.02)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        cursor: 'pointer' 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px',
            backgroundColor: tbm.type === 'checklist' ? '#eff6ff' : (tbm.type === 'minutes' ? '#f0f9ff' : '#ecfdf5'),
            color: tbm.type === 'checklist' ? '#3b82f6' : (tbm.type === 'minutes' ? '#0284c7' : '#059669')
          }}>
            {tbm.type === 'checklist' ? 'TBM 실행 체크리스트' : (tbm.type === 'minutes' ? 'Tool Box Meeting 회의록' : 'TBM 서명')}
          </span>
          {isTbmUnread(tbm) && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: '#ef4444', 
              backgroundColor: '#fee2e2', 
              padding: '2px 6px', 
              borderRadius: '4px',
              lineHeight: 1
            }}>
              NEW
            </span>
          )}
        </div>
        <span style={{ fontSize: '13px', color: '#64748b' }}>{tbm.date}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>{tbm.title}</h4>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
            <span>작성자: <strong>{tbm.userName}</strong></span>
          </div>
        </div>
        {isSigned ? (
          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '20px', backgroundColor: '#dcfce3', color: '#166534' }}>
            서명 완료
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '20px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
            서명 필요
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={isEmbedded ? "" : "app-container"} style={{ backgroundColor: '#f8fafc', minHeight: isEmbedded ? 'auto' : '100vh', paddingBottom: isEmbedded ? '0' : '60px' }}>
      {/* Header */}
      {!isEmbedded && (
        <header className="header" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
          <ArrowLeft className="header-icon" onClick={() => {
            if (viewMode === 'detail' || viewMode === 'write') {
              navigate(location.pathname, { replace: true });
              setViewMode('list');
            } else navigate(-1);
          }} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={18} color="#3b82f6" />
            <span>{viewMode === 'list' ? 'TBM' : viewMode === 'detail' ? 'TBM 상세 조회' : 'TBM 작성'}</span>
          </div>
          <div style={{ width: '24px' }}></div>
        </header>
      )}

      {isEmbedded && viewMode !== 'list' && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <ArrowLeft 
            className="header-icon" 
            onClick={() => { 
              if (isEmbedded) {
                navigate('?tab=TBM', { replace: true });
              } else {
                navigate(location.pathname, { replace: true });
              }
              setViewMode('list'); 
            }} 
            style={{ cursor: 'pointer', marginRight: '8px', color: '#1e293b' }} 
          />
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>
            {viewMode === 'detail' ? 'TBM 상세 조회' : 'TBM 작성'}
          </span>
        </div>
      )}

      <main className={isEmbedded ? "" : "main-content"} style={{ padding: isEmbedded ? '0' : '16px' }}>
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <button 
                onClick={() => { resetForms(); setSelectedTbmDetail(null); setViewMode('write'); setSelectedForm(null); }}
                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(59,130,246,0.2)' }}
              >
                <Plus size={16} /> 새 TBM 작성
              </button>
            </div>
            
            {myCompanyTbmSubmissions.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                제출된 TBM 이행 내역이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 미서명 TBM 목록 */}
                {unsignedTbms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {unsignedTbms.filter(t => t.type === 'free').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
                          서명 대기 중인 TBM
                        </h3>
                        {unsignedTbms.filter(t => t.type === 'free').map(tbm => renderTbmCard(tbm, false))}
                      </div>
                    )}
                    {unsignedTbms.filter(t => t.type === 'minutes').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div 
                          onClick={() => setIsPendingMinutesExpanded(!isPendingMinutesExpanded)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}
                        >
                          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <span style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span>
                            서명 대기 중인 회의록 ({unsignedTbms.filter(t => t.type === 'minutes').length})
                          </h3>
                          {isPendingMinutesExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                        </div>
                        {isPendingMinutesExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {unsignedTbms.filter(t => t.type === 'minutes').map(tbm => renderTbmCard(tbm, false))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* 서명 이력 구분선 */}
                {unsignedTbms.length > 0 && signedTbms.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>완료된 내역</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                  </div>
                )}

                {/* 서명 완료 TBM 목록 */}
                {signedTbms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {signedTbms.filter(t => t.type === 'free').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>완료된 TBM 서명</h3>
                        {signedTbms.filter(t => t.type === 'free').map(tbm => renderTbmCard(tbm, true))}
                      </div>
                    )}
                    {signedTbms.filter(t => t.type === 'minutes').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div 
                          onClick={() => setIsCompletedMinutesExpanded(!isCompletedMinutesExpanded)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderBottom: '2px solid #e2e8f0' }}
                        >
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>완료된 회의록 ({signedTbms.filter(t => t.type === 'minutes').length})</h3>
                          {isCompletedMinutesExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                        </div>
                        {isCompletedMinutesExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {signedTbms.filter(t => t.type === 'minutes').map(tbm => renderTbmCard(tbm, true))}
                          </div>
                        )}
                      </div>
                    )}
                    {signedTbms.filter(t => t.type === 'checklist').length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div 
                          onClick={() => setIsCompletedChecklistExpanded(!isCompletedChecklistExpanded)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderBottom: '2px solid #e2e8f0' }}
                        >
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>제출된 체크리스트 ({signedTbms.filter(t => t.type === 'checklist').length})</h3>
                          {isCompletedChecklistExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                        </div>
                        {isCompletedChecklistExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {signedTbms.filter(t => t.type === 'checklist').map(tbm => renderTbmCard(tbm, true))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'detail' && selectedTbmDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedTbmDetail.type === 'free' ? (
              <div style={{ padding: '0 4px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111', marginBottom: '12px', lineHeight: '1.4' }}>📌 {selectedTbmDetail.title}</h3>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                  {selectedTbmDetail.userName} | {selectedTbmDetail.date}
                </div>
                {selectedTbmDetail.data?.content && (
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px', color: '#333', lineHeight: '1.6' }}>
                    {selectedTbmDetail.data.content}
                  </div>
                )}
              </div>
            ) : (
              
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', width: 'fit-content',
                      backgroundColor: selectedTbmDetail.type === 'checklist' ? '#eff6ff' : '#f0f9ff',
                      color: selectedTbmDetail.type === 'checklist' ? '#3b82f6' : '#0284c7'
                    }}>
                      {selectedTbmDetail.type === 'checklist' ? 'TBM 실행 체크리스트' : 'Tool Box Meeting 회의록'}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>{selectedTbmDetail.title}</h3>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>작성자: {selectedTbmDetail.userName} | {selectedTbmDetail.date}</div>
                  </div>
                  <button
                    onClick={handleDownloadDocument}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', alignSelf: 'flex-start' }}
                  >
                    <Download size={16} /> 문서 다운로드
                  </button>
                </div>
                
                {/* Scrollable Container for Document */}
                <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#f8fafc', padding: '20px 0', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '794px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <TbmDocumentRenderer ref={tbmPrintRef} tbm={selectedTbmDetail} />
                  </div>
                </div>
              </div>
            )}


            {/* 첨부파일 표시 */}
            {selectedTbmDetail.files && selectedTbmDetail.files.length > 0 && (
              selectedTbmDetail.type === 'free' ? (
                <div style={{ padding: '0 4px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#475569', marginBottom: '12px' }}>첨부파일 ({selectedTbmDetail.files.length}개)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedTbmDetail.files.map((file, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '100%' }}>
                        {file.type.startsWith('image/') ? (
                          <div style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center' }}>
                            <img src={file.data} alt="첨부" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                          </div>
                        ) : (
                          <a href={file.data} download={file.name} style={{ textDecoration: 'none', display: 'block' }}>
                            <div style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                              <File size={28} color="#64748b" />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>다운로드</span>
                              </div>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>첨부 이미지/파일</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedTbmDetail.files.map((file, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '100%' }}>
                        {file.type.startsWith('image/') ? (
                          <img src={file.data} alt="첨부" style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <a href={file.data} download={file.name} style={{ textDecoration: 'none', display: 'block' }}>
                            <div style={{ padding: '16px 20px', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                              <File size={28} color="#64748b" />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>다운로드</span>
                              </div>
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* 참석자 서명 영역 (자유서식 및 회의록만 표시) */}
            {(selectedTbmDetail.type === 'free' || selectedTbmDetail.type === 'minutes') && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', marginBottom: '12px' }}>직원 열람 및 숙지 서명</h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>아래 내용을 숙지하였으며 작업에 참여함을 확인합니다.</p>
              
              {(() => {
                if (selectedTbmDetail.type === 'minutes') {
                  const targetParticipants = selectedTbmDetail.data?.participants || [];
                  const isParticipant = targetParticipants.some(p => p.userId === currentUser.id);
                  if (!isParticipant) return null; // 회의록 참여 대상자가 아니면 서명 버튼 미노출
                }
                if (selectedTbmDetail.participantSignatures?.some(s => s.userId === currentUser.id)) {
                  return null; // 이미 서명한 경우 미노출
                }
                return (
                  <button
                    onClick={() => { setSignatureTarget('viewer'); setSignatureModalOpen(true); }}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', marginBottom: '16px' }}
                  >
                    <PenTool size={16} /> 이해 및 숙지 확인 서명하기
                  </button>
                );
              })()}
              
              {(() => {
                let allParticipants = [];
                let unsignedEmployees = [];
                const signedSignatures = selectedTbmDetail.participantSignatures || [];
                const signedUserIds = signedSignatures.map(s => s.userId);

                if (selectedTbmDetail.type === 'free') {
                  const myCompanyEmployees = users?.filter(u => u.companyId === selectedTbmDetail.companyId && u.roleCode === 'EMPLOYEE') || [];
                  unsignedEmployees = myCompanyEmployees.filter(u => !signedUserIds.includes(u.id));
                  allParticipants = [
                    ...signedSignatures.map(s => ({ id: s.userId, name: s.userName, signed: true, date: s.date })),
                    ...unsignedEmployees.map(u => ({ id: u.id, name: u.name, signed: false }))
                  ];
                } else if (selectedTbmDetail.type === 'minutes') {
                  const targetParticipants = selectedTbmDetail.data.participants || [];
                  // filter out invalid target participants (e.g., empty rows)
                  const validTargets = targetParticipants.filter(p => p.userId);
                  unsignedEmployees = validTargets.filter(p => !signedUserIds.includes(p.userId));
                  
                  // Reconstruct allParticipants: signed + unsigned
                  allParticipants = [
                    ...signedSignatures.map(s => ({ id: s.userId, name: s.userName, signed: true, date: s.date })),
                    ...unsignedEmployees.map(p => ({ id: p.userId, name: p.name, signed: false }))
                  ];
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>전체 {allParticipants.length}명 중 {signedSignatures.length}명 서명 완료</span>
                      {(currentUser?.roleCode === 'COMPANY_ADMIN' || currentUser?.roleCode === 'SUPER_ADMIN') && unsignedEmployees.length > 0 && (
                        <button 
                          onClick={() => {
                            unsignedEmployees.forEach(emp => {
                              sendMessage(currentUser.id, currentUser.name, emp.id, '[TBM 서명 요청]', `'${selectedTbmDetail.title}' TBM 내용 숙지 및 서명을 부탁드립니다.`);
                            });
                            alert(`${unsignedEmployees.length}명의 미서명 직원에게 알림 발송을 완료했습니다.`);
                          }}
                          style={{ padding: '6px 12px', backgroundColor: '#fef08a', color: '#854d0e', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          미서명자 알림 발송
                        </button>
                      )}
                    </div>
                    {allParticipants.length > 0 ? (
                      allParticipants.map((p, idx) => {
                        let formattedDate = '';
                        if (p.signed && p.date) {
                          const d = new Date(p.date);
                          formattedDate = `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                        }
                        
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: p.signed ? '#f0fdf4' : '#f8fafc' }}>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155' }}>{p.name}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 'bold', color: p.signed ? '#059669' : '#94a3b8' }}>
                                {p.signed ? '[서명완료]' : '[서명대기]'}
                              </span>
                              {formattedDate && (
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  {formattedDate}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        대상 직원이 없습니다.
                      </div>
                    )}
                  </div>
                );
              })()}


            </div>
            )}
          </div>
        )}

        {viewMode === 'write' && (
          <>
            {/* 양식 선택 화면 */}
            {selectedForm === null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>어떤 TBM 서식을 작성하시겠습니까?</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>작업에 필요한 문서 양식을 선택하여 제출해 주세요.</p>
            </div>

            {(currentUser?.roleCode === 'COMPANY_ADMIN' || currentUser?.roleCode === 'SUPER_ADMIN') && (
              <div 
                onClick={() => setSelectedForm('free')}
                style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>TBM 서명 (사진 및 파일 첨부)</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>형식에 구애받지 않고 제목과 내용을 자유롭게 작성하며, 사진 및 파일을 첨부합니다.</p>
                </div>
              </div>
            )}

            <div 
              onClick={() => setSelectedForm('checklist')}
              style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>TBM 실행 체크리스트</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>작업 전 사전 준비, 실행 과정 및 후속 조치에 대한 12개 항목을 체크하고 조치 사항을 작성합니다.</p>
              </div>
            </div>

            <div 
              onClick={() => setSelectedForm('minutes')}
              style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>Tool Box Meeting 회의록</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>작업명, 위험 요인 및 대책 수립, 일일 안전 점검 결과 및 현장 미팅 회의록을 참석자 서명과 함께 기재합니다.</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            {/* 상단 서식 정보 및 뒤로가기 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '6px 12px', borderRadius: '8px' }}>
                {selectedForm === 'checklist' ? 'TBM 실행 체크리스트' : selectedForm === 'minutes' ? 'Tool Box Meeting 회의록' : 'TBM 서명'}
              </span>
              <button 
                onClick={() => setSelectedForm(null)}
                style={{ border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '13px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                다른 서식 선택
              </button>
            </div>

            {/* ========================================================================= */}
            {/* 서식 0: 자유서식 폼 */}
            {/* ========================================================================= */}
            {selectedForm === 'free' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>기본 정보</h4>
                  
                  <div>
                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업명 (제목) *</label>
                    <input 
                      type="text" 
                      value={freeTitle}
                      onChange={(e) => setFreeTitle(e.target.value)}
                      placeholder="예) 전기실 배전반 점검 작업"
                      style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>상세 내용</label>
                    <textarea 
                      value={freeContent}
                      onChange={(e) => setFreeContent(e.target.value)}
                      placeholder="작업 내용, 특이사항, 위험요인 등을 자유롭게 기재해 주세요."
                      style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '200px', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* 첨부파일/사진 추가 (자유서식 전용) */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>📎 첨부 이미지 및 파일</h4>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                    id="tbm-file-upload-free" 
                  />
                  <label htmlFor="tbm-file-upload-free" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '1px dashed #3b82f6', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <Camera size={20} /> 사진 및 파일 추가
                  </label>

                  {tbmFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                      {tbmFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          <button 
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{ position: 'absolute', top: -8, right: -8, width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                          >
                            ✕
                          </button>
                          {file.type.startsWith('image/') ? (
                            <img src={file.data} alt="첨부" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                          ) : (
                            <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', textAlign: 'center', overflow: 'hidden' }}>
                              <File size={20} color="#64748b" />
                              <span style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>{file.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 제출하기 */}
                <button
                  onClick={submitFreeForm}
                  style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', marginTop: '10px' }}
                >
                  자유서식 제출하기
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 서식 1: TBM 실행 체크리스트 폼 */}
            {/* ========================================================================= */}
            {selectedForm === 'checklist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {(currentUser?.roleCode === 'COMPANY_ADMIN' || currentUser?.roleCode === 'SUPER_ADMIN') && (
                    <button 
                      onClick={() => setShowTemplateModal(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <PenTool size={14} /> 템플릿 수정
                    </button>
                  )}
                </div>

                {/* 유의사항 배너 */}
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
                  <strong>💡 유의사항</strong><br/>
                  • TBM은 작업 전 TBM 리더와 작업자 간 실행하는 안전보건 회의입니다.<br/>
                  • 작업별 위험요인은 위험성평가결과 또는 별도의 자료를 활용하시기 바랍니다.
                </div>

                {/* 기본 정보 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#1e293b' }}>TBM 기본 정보</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업 일자</label>
                      <input 
                        type="date" 
                        value={checklistDate} 
                        onChange={(e) => setChecklistDate(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>TBM 리더 성명</label>
                      <input 
                        type="text" 
                        value={checklistLeader} 
                        onChange={(e) => setChecklistLeader(e.target.value)}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {renderChecklistSection('1️⃣ TBM 사전준비', 'prep', checklistQuestions_1, prepAnswers)}
                {renderChecklistSection('2️⃣ TBM 실행과정', 'exec', checklistQuestions_2, execAnswers)}
                {renderChecklistSection('3️⃣ TBM 후속조치', 'post', checklistQuestions_3, postAnswers)}

                {/* TBM 리더 서명 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>TBM 리더 최종 확인</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>성명: {checklistLeader}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>우측의 서명 버튼을 눌러 사인해 주세요.</span>
                    </div>
                    <div>
                      {checklistLeaderSig ? (
                        <div onClick={() => openSignatureModal('leader')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                          <img src={checklistLeaderSig} alt="리더 서명" style={{ height: '48px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white' }} />
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>클릭 시 재서명</div>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => openSignatureModal('leader')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <PenTool size={14} /> 서명하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>



                {/* 제출하기 */}
                <button
                  onClick={submitChecklist}
                  style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', marginTop: '10px' }}
                >
                  TBM 체크리스트 제출하기
                </button>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 서식 2: Tool Box Meeting 회의록 폼 */}
            {/* ========================================================================= */}
            {selectedForm === 'minutes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 1. 기본 정보 입력 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>TBM 기본 설정</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: '1 1 140px' }}>
                          <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>TBM 일시</label>
                          <input 
                            type="date" 
                            value={mDate} 
                            onChange={(e) => setMDate(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ flex: '1 1 160px', width: '100%', minWidth: 0 }}>
                          <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>시간 설정</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                            <input 
                              type="time" 
                              value={mTimeStart} 
                              onChange={(e) => setMTimeStart(e.target.value)}
                              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                            />
                            <span style={{ color: '#64748b', flexShrink: 0 }}>~</span>
                            <input 
                              type="time" 
                              value={mTimeEnd} 
                              onChange={(e) => setMTimeEnd(e.target.value)}
                              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', minWidth: 0, width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업날짜와 동일함 여부</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['예', '아니오'].map(v => (
                          <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="isTimeSameAsDate" 
                              value={v}
                              checked={isTimeSameAsDate === v}
                              onChange={() => setIsTimeSameAsDate(v)}
                              style={{ accentColor: '#3b82f6' }}
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업명 *</label>
                        <input 
                          type="text" 
                          value={mTaskName} 
                          onChange={(e) => setMTaskName(e.target.value)}
                          placeholder="예: 옥상 방수 작업"
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>TBM 장소 *</label>
                        <input 
                          type="text" 
                          value={mLocation} 
                          onChange={(e) => setMLocation(e.target.value)}
                          placeholder="예: HK빌딩 옥상"
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업내용 *</label>
                      <textarea 
                        value={mTaskContent} 
                        onChange={(e) => setMTaskContent(e.target.value)}
                        placeholder="작업의 구체적인 세부 내용을 기재해 주세요."
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', minHeight: '60px', resize: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>위험성평가 실시여부</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['예', '아니오'].map(v => (
                          <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="mRiskAssessmentDone" 
                              value={v}
                              checked={mRiskAssessmentDone === v}
                              onChange={() => setMRiskAssessmentDone(v)}
                              style={{ accentColor: '#3b82f6' }}
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. 잠재위험요인 및 대책 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>⚠️ 잠재위험요인 및 대책 수립</h4>
                    <button 
                      type="button"
                      onClick={handleAddHazard}
                      style={{ padding: '6px 12px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  {mHazards.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: idx < mHazards.length - 1 ? '1px dashed #f1f5f9' : 'none', paddingBottom: idx < mHazards.length - 1 ? '16px' : '0', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>위험 요인 {idx + 1}</div>
                        {mHazards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveHazard(idx)}
                            style={{ padding: '2px 8px', backgroundColor: '#fee2e2', border: '1.5px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            제외
                          </button>
                        )}
                      </div>
                      <div>
                        <input 
                          type="text" 
                          value={item.hazard}
                          onChange={(e) => handleHazardChange(idx, 'hazard', e.target.value)}
                          placeholder={`잠재 위험요인 ${idx + 1} 기재`}
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }}
                        />
                        <input 
                          type="text" 
                          value={item.countermeasure}
                          onChange={(e) => handleHazardChange(idx, 'countermeasure', e.target.value)}
                          placeholder={`그에 대한 안전 대책 ${idx + 1} 기재 (제거 ➜ 대체 ➜ 통제)`}
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. 중점위험요인 및 대책 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#b91c1c' }}>🚨 중점위험요인 선정</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>※ 위 잠재위험요인 중 가장 중요한 중점위험 1개를 선정하여 기재</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>선정 내용 *</label>
                      <input 
                        type="text" 
                        value={mFocusSelection}
                        onChange={(e) => setMFocusSelection(e.target.value)}
                        placeholder="예: 옥상 난간 주변에서의 실족 및 추락 위험"
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>중점 대책 *</label>
                      <input 
                        type="text" 
                        value={mFocusCountermeasure}
                        onChange={(e) => setMFocusCountermeasure(e.target.value)}
                        placeholder="예: 안전선 설치, 난간 이격 상태 확인 및 안전벨트 후크 항시 안전고리 고정"
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. 작업 전 안전조치 확인 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>✅ 작업 전 안전조치 확인</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>※ 위 작성한 잠재위험요소가 현장에서 조치되었는지 재확인</span>
                  </div>

                  {mSafetyChecks.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: idx < mSafetyChecks.length - 1 ? '1px dashed #f1f5f9' : 'none', paddingBottom: idx < mSafetyChecks.length - 1 ? '16px' : '0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: item.hazard ? '#334155' : '#94a3b8', lineHeight: '1.4' }}>
                        [위험요인 {idx + 1}] {item.hazard || '(상단에 위험 요인을 작성해 주세요)'}
                      </div>

                      {/* 조치여부 체크 */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['YES', 'NO'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            disabled={!item.hazard.trim()}
                            onClick={() => handleSafetyCheckChange(idx, 'status', opt)}
                            style={{
                              flex: 1, padding: '8px', border: item.status === opt ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                              borderRadius: '8px', backgroundColor: item.status === opt ? '#eff6ff' : 'white',
                              color: item.status === opt ? '#3b82f6' : '#475569', fontWeight: item.status === opt ? 'bold' : 'normal',
                              fontSize: '13px', cursor: 'pointer', opacity: item.hazard.trim() ? 1 : 0.5
                            }}
                          >
                            {opt === 'YES' ? '조치완료 (예)' : '조치안됨 (아니오)'}
                          </button>
                        ))}
                      </div>

                      {/* '아니오'인 경우 조치내용 기재 */}
                      {item.status === 'NO' && item.hazard.trim() && (
                        <input 
                          type="text" 
                          value={item.note}
                          onChange={(e) => handleSafetyCheckChange(idx, 'note', e.target.value)}
                          placeholder="아니오인 경우 조치 조치 계획 또는 사유 입력"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* 5. 안전점검 결과 & 피드백 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>📝 추가 안전 평가</h4>
                  
                  <div>
                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업 전 일일 안전점검 시행 결과</label>
                    <input 
                      type="text" 
                      value={mDailyCheckResult}
                      onChange={(e) => setMDailyCheckResult(e.target.value)}
                      placeholder="예: 안전 장비 및 통제 표지판 정상 배치 확인"
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>작업 후 종료 미팅 결과 (중점대책 실효성)</label>
                    <input 
                      type="text" 
                      value={mPostMeetingResult}
                      onChange={(e) => setMPostMeetingResult(e.target.value)}
                      placeholder="예: 안전하게 고소 작업 완료, 잔여 쓰레기 청소 정돈 양호"
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* 6. TBM 리더 확인 정보 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>👤 TBM 리더 정보</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#64748b' }}>소속</label>
                      <input 
                        type="text" 
                        value={mLeaderDept}
                        onChange={(e) => setMLeaderDept(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#64748b' }}>직책</label>
                      <input 
                        type="text" 
                        value={mLeaderPosition}
                        onChange={(e) => setMLeaderPosition(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#64748b' }}>성명 *</label>
                    <input 
                      type="text" 
                      value={mLeaderName}
                      onChange={(e) => setMLeaderName(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* 리더 서명 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', marginTop: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>리더 서명 확인 *</span>
                    <div>
                      {mLeaderSig ? (
                        <div onClick={() => openSignatureModal('leader')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                          <img src={mLeaderSig} alt="리더 서명" style={{ height: '44px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white' }} />
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>재서명</div>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => openSignatureModal('leader')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          <PenTool size={12} /> 서명하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. 참석자 확인 정보 */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>👥 회의 참석자 서명 ({mParticipants.length}명)</h4>
                    <button 
                      type="button"
                      onClick={handleAddParticipant}
                      style={{ padding: '6px 12px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + 인원 추가
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {mParticipants.map((part, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', position: 'relative' }}>
                        
                        {/* 삭제 버튼 */}
                        {mParticipants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(idx)}
                            style={{ position: 'absolute', top: -8, right: -8, width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        )}

                        <div style={{ flex: 1.2 }}>
                          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>참석자 선택</label>
                          <select 
                            value={part.userId || ''}
                            onChange={(e) => {
                              const selectedUser = users.find(u => u.id === e.target.value);
                              const newParts = [...mParticipants];
                              newParts[idx] = { ...newParts[idx], userId: e.target.value, name: selectedUser ? selectedUser.name : '' };
                              setMParticipants(newParts);
                            }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', backgroundColor: 'white' }}
                          >
                            <option value="">직원 선택...</option>
                            {users.filter(u => u.companyId === currentUser.companyId && u.id !== currentUser.id).map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.department || '소속미상'} / {u.role || '직책미상'})</option>
                            ))}
                          </select>
                        </div>


                      </div>
                    ))}
                  </div>
                </div>



                {/* 제출하기 */}
                <button
                  onClick={submitMinutes}
                  style={{ width: '100%', padding: '16px', border: 'none', borderRadius: '12px', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', marginTop: '10px' }}
                >
                  TBM 회의록 제출하기
                </button>

              </div>
            )}

          </div>
          )}
          </>
        )}
      </main>

      {/* 서명 모달 팝업 */}
      <SignatureModal 
        isOpen={signatureModalOpen} 
        onClose={() => setSignatureModalOpen(false)} 
        onSave={handleSignatureModalSave} 
        currentUser={currentUser}
        updateEmployee={updateEmployee}
      />

      {showTemplateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
            <button 
              onClick={() => setShowTemplateModal(false)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
            >
              <X size={32} />
            </button>
            <div style={{ backgroundColor: '#f8fafc', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <TbmTemplateManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TbmExecution;

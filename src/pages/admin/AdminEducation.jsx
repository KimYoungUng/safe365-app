import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { 
  ArrowLeft, Search, Filter, BookOpen, CheckCircle, Clock, 
  ChevronDown, ChevronUp, Plus, Trash2, Edit3, Film, XCircle, PlusCircle
} from 'lucide-react';

function AdminEducation() {
  const navigate = useNavigate();
  const { currentUser, users } = useContext(AuthContext);
  const { 
    educations, userEducations, sendMessage, 
    addEducation, updateEducation, deleteEducation 
  } = useContext(DataContext);

  const [activeTab, setActiveTab] = useState('모니터링'); // '모니터링' | '설정'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  // 모달 및 폼 상태
  const [showModal, setShowModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [videoType, setVideoType] = useState('sample'); // 'sample' | 'upload'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  
  // 다중 퀴즈 상태 배열
  const [quizzes, setQuizzes] = useState([
    { question: '', options: ['', '', '', ''], answer: 0 }
  ]);
  const [cutLine, setCutLine] = useState(60);

  if (!currentUser) return null;

  // 이 회사에 속하는 교육 과정만 필터링
  const companyEducations = educations.filter(
    edu => !edu.companyId || edu.companyId === currentUser.companyId
  );

  // 동적 users 배열에서 필터링
  const companyEmployees = users.filter(
    u => u.companyId === currentUser.companyId && u.roleCode === 'EMPLOYEE'
  );

  const filteredEmployees = companyEmployees.filter(emp => 
    emp.name.includes(searchTerm) || emp.department.includes(searchTerm)
  );

  // Get progress based on userEducations
  const getProgress = (userId) => {
    const userEdus = userEducations?.filter(ue => ue.userId === userId) || [];
    let completedCount = 0;
    
    // 이 회사의 교육 과정만 대상으로 체크
    companyEducations.forEach(edu => {
      const userEdu = userEdus.find(ue => String(ue.eduId) === String(edu.id));
      if (userEdu && (userEdu.status === '수료' || userEdu.status === 'completed')) {
        completedCount += 1;
      }
    });

    const totalCount = companyEducations.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return { completedCount, totalCount, progress };
  };

  const getUserDetails = (userId) => {
    return companyEducations.map(edu => {
      const userEdu = userEducations?.find(ue => ue.userId === userId && String(ue.eduId) === String(edu.id));
      return {
        ...edu,
        userProgress: userEdu?.progress || 0,
        userStatus: userEdu?.status || '미수료'
      };
    });
  };

  const handleEncourage = (e, emp) => {
    e.stopPropagation(); // Prevent card expansion
    sendMessage(
      currentUser.id, 
      currentUser.name, 
      emp.id, 
      '[필수] 교육 수강 안내', 
      '아직 수료하지 않은 필수 교육 과정이 있습니다. 교육 기한 내에 수료를 완료해 주시기 바랍니다.'
    );
    alert(`${emp.name} 사원에게 교육 독려 알림(메시지)을 발송했습니다.`);
  };

  const toggleExpand = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const totalCompletionRate = companyEmployees.length > 0 
    ? Math.round(companyEmployees.reduce((acc, emp) => acc + getProgress(emp.id).progress, 0) / companyEmployees.length) 
    : 0;

  // 퀴즈 리스트 핸들러
  const handleUpdateQuizQuestion = (qIdx, text) => {
    setQuizzes(prev => prev.map((q, idx) => idx === qIdx ? { ...q, question: text } : q));
  };

  const handleUpdateQuizOption = (qIdx, oIdx, text) => {
    setQuizzes(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        const newOpts = [...q.options];
        newOpts[oIdx] = text;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleAddQuizOption = (qIdx) => {
    setQuizzes(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const handleRemoveQuizOption = (qIdx, oIdx) => {
    setQuizzes(prev => prev.map((q, idx) => {
      if (idx === qIdx) {
        if (q.options.length <= 2) {
          alert('보기는 최소 2개 이상이어야 합니다.');
          return q;
        }
        const newOpts = q.options.filter((_, oIndex) => oIndex !== oIdx);
        let newAnswer = q.answer;
        if (q.answer >= newOpts.length) {
          newAnswer = newOpts.length - 1;
        }
        return { ...q, options: newOpts, answer: newAnswer };
      }
      return q;
    }));
  };

  const handleUpdateQuizAnswer = (qIdx, ans) => {
    setQuizzes(prev => prev.map((q, idx) => idx === qIdx ? { ...q, answer: Number(ans) } : q));
  };

  const handleAddQuiz = () => {
    setQuizzes(prev => [...prev, { question: '', options: ['', '', '', ''], answer: 0 }]);
  };

  const handleRemoveQuiz = (qIdx) => {
    if (quizzes.length <= 1) {
      alert('퀴즈 문제는 최소 1개 이상 등록해야 합니다.');
      return;
    }
    setQuizzes(prev => prev.filter((_, idx) => idx !== qIdx));
  };

  // 교육 등록 폼 열기
  const openAddModal = () => {
    setEditingEdu(null);
    setTitle('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setVideoType('sample');
    setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
    setVideoFile(null);
    setQuizzes([
      { question: '', options: ['', '', '', ''], answer: 0 }
    ]);
    setCutLine(60);
    setShowModal(true);
  };

  // 교육 수정 폼 열기
  const openEditModal = (edu) => {
    setEditingEdu(edu);
    setTitle(edu.title);
    setStartDate(edu.startDate);
    setEndDate(edu.endDate);
    setVideoType(edu.videoUrl ? 'sample' : 'upload');
    setVideoUrl(edu.videoUrl || '');
    setVideoFile(null);
    
    // 다중 퀴즈 배열 디코드 (단일 퀴즈 하위 호환 지원)
    const initialQuizzes = edu.quizzes || (edu.quiz ? [edu.quiz] : [{ question: '', options: ['', '', '', ''], answer: 0 }]);
    setQuizzes(JSON.parse(JSON.stringify(initialQuizzes)));
    setCutLine(edu.cutLine || 60);
    
    setShowModal(true);
  };

  // 교육 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('교육명을 입력해주세요.');
      return;
    }
    if (!startDate || !endDate) {
      alert('교육 기간을 지정해주세요.');
      return;
    }
    
    // 퀴즈 입력 유효성 검사
    for (let i = 0; i < quizzes.length; i++) {
      const q = quizzes[i];
      if (!q.question.trim()) {
        alert(`${i + 1}번 퀴즈의 질문을 입력해주세요.`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`${i + 1}번 퀴즈의 보기 항목들을 모두 입력해주세요.`);
        return;
      }
    }

    if (editingEdu) {
      await updateEducation(
        editingEdu.id,
        title,
        startDate,
        endDate,
        videoType === 'sample' ? videoUrl : '',
        videoType === 'upload' ? videoFile : null,
        quizzes,
        cutLine
      );
      alert('교육 과정이 성공적으로 수정되었습니다.');
    } else {
      await addEducation(
        currentUser.companyId,
        title,
        startDate,
        endDate,
        videoType === 'sample' ? videoUrl : '',
        videoType === 'upload' ? videoFile : null,
        quizzes,
        cutLine
      );
      alert('새로운 교육 과정이 등록되었습니다.');
    }
    setShowModal(false);
  };

  // 교육 삭제 처리
  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 교육 과정을 삭제하시겠습니까?\n사원들의 수강 기록도 함께 삭제됩니다.')) {
      await deleteEducation(id);
      alert('교육 과정이 삭제되었습니다.');
    }
  };

  return (
    <>
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>직원 교육 현황</div>
        <div style={{ width: '24px' }}></div>
      </header>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        <button 
          onClick={() => setActiveTab('모니터링')}
          style={{ 
            flex: 1, padding: '14px 0', border: 'none', borderBottom: activeTab === '모니터링' ? '3px solid var(--primary)' : '3px solid transparent',
            backgroundColor: 'transparent', color: activeTab === '모니터링' ? 'var(--primary)' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
          }}
        >
          교육 현황 모니터링
        </button>
        <button 
          onClick={() => setActiveTab('설정')}
          style={{ 
            flex: 1, padding: '14px 0', border: 'none', borderBottom: activeTab === '설정' ? '3px solid var(--primary)' : '3px solid transparent',
            backgroundColor: 'transparent', color: activeTab === '설정' ? 'var(--primary)' : '#64748b', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer'
          }}
        >
          교육 과정 설정
        </button>
      </div>

      <main className="main-content" style={{ padding: '16px', backgroundColor: '#f7f8fa', minHeight: 'calc(100vh - 110px)', position: 'relative' }}>
        
        {activeTab === '모니터링' ? (
          <>
            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>전체 수료율</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{totalCompletionRate}%</div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>진행 중인 과정</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{companyEducations.length}개</div>
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

            {/* 직원 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
              {filteredEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>검색 결과가 없습니다.</div>
              ) : (
                filteredEmployees.map(emp => {
                  const { completedCount, totalCount, progress } = getProgress(emp.id);
                  const isCompleted = progress === 100;
                  const isExpanded = expandedUser === emp.id;
                  const detailedEdus = getUserDetails(emp.id);

                  return (
                    <div key={emp.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                      <div 
                        onClick={() => toggleExpand(emp.id)} 
                        style={{ padding: '16px', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                              {emp.name.substring(0, 1)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {emp.name} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>{emp.role}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{emp.department}</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isCompleted ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                                <CheckCircle size={12} /> 수료완료
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#d97706', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                                <Clock size={12} /> 진행중
                              </div>
                            )}
                            {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                          </div>
                        </div>

                        {/* 진행 상태 바 */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: '#64748b' }}>
                            <span>전체 진행률 {progress}%</span>
                            <span>{completedCount} / {totalCount} 과정 완료</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: isCompleted ? '#10b981' : 'var(--primary)', borderRadius: '3px' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* 상세 교육 과정 정보 (아코디언 형태) */}
                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fdfdfd' }}>
                          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {detailedEdus.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '16px', color: '#888', fontSize: '13px' }}>등록된 교육 과정이 없습니다.</div>
                            ) : (
                              detailedEdus.map(edu => (
                                <div key={edu.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', flex: 1, paddingRight: '8px' }}>{edu.title}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: (edu.userStatus === '수료' || edu.userStatus === 'completed') ? '#dcfce7' : '#fee2e2', color: (edu.userStatus === '수료' || edu.userStatus === 'completed') ? '#16a34a' : '#ef4444' }}>
                                      {edu.userStatus === 'completed' ? '수료' : edu.userStatus}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ width: `${edu.userProgress}%`, height: '100%', backgroundColor: (edu.userStatus === '수료' || edu.userStatus === 'completed') ? '#10b981' : 'var(--primary)', borderRadius: '2px' }}></div>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#64748b', width: '32px', textAlign: 'right' }}>{edu.userProgress}%</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {!isCompleted && detailedEdus.length > 0 && (
                            <button onClick={(e) => handleEncourage(e, emp)} style={{ width: '100%', marginTop: '16px', padding: '12px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <BookOpen size={14} /> 미수료자 교육 독려 알림 보내기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            {/* 교육 과정 목록 설정 탭 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>
                등록된 과정 ({companyEducations.length}개)
              </div>
              <button 
                onClick={openAddModal}
                style={{ 
                  padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px',
                  fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                }}
              >
                <Plus size={16} /> 교육 과정 등록
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '60px' }}>
              {companyEducations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>
                  <Film size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                  <div>등록된 교육 과정이 없습니다.</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>오른쪽 위의 등록 버튼을 눌러 추가하세요.</div>
                </div>
              ) : (
                companyEducations.map(edu => (
                  <div key={edu.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', flex: 1, paddingRight: '8px' }}>
                        {edu.title}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => openEditModal(edu)}
                          style={{ padding: '6px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', cursor: 'pointer' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(edu.id)}
                          style={{ padding: '6px', backgroundColor: '#fee2e2', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>기간: {edu.startDate} ~ {edu.endDate}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        영상: {edu.videoUrl ? (
                          <span style={{ color: '#0284c7', fontWeight: 'bold' }}>기본 링크 ({edu.videoUrl.substring(0, 30)}...)</span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>직접 업로드 파일 (로컬 보관)</span>
                        )}
                      </div>
                      
                      {/* 다중 퀴즈 리스트 미리보기 */}
                      <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#475569', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>확인 퀴즈 ({edu.quizzes?.length || (edu.quiz ? 1 : 0)}문제)</span>
                          <span style={{ color: 'var(--primary)', fontSize: '11px' }}>
                            합격선: {edu.cutLine || 60}점 이상 ({Math.ceil((edu.quizzes?.length || (edu.quiz ? 1 : 0)) * (edu.cutLine || 60) / 100)}문제 이상 정답)
                          </span>
                        </div>
                        {(edu.quizzes || (edu.quiz ? [edu.quiz] : [])).map((qz, qIdx) => (
                          <div key={qIdx} style={{ fontSize: '12px', borderTop: qIdx > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: qIdx > 0 ? '8px' : '0' }}>
                            <div style={{ fontWeight: 'bold', color: '#475569' }}>Q{qIdx + 1}. {qz?.question}</div>
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                              정답: ({(qz?.answer !== undefined ? qz.answer + 1 : '')}번) {qz?.options?.[qz?.answer]}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* 등록 / 수정 오버레이 모달 (모바일 최적화 및 뷰포트 정렬 보완) */}
      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', 
          width: '100%', maxWidth: '480px', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', 
          zIndex: 99999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
          <div style={{ 
            backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', 
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%', boxSizing: 'border-box'
          }}>
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                {editingEdu ? '교육 과정 수정' : '신규 교육 과정 등록'}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* 모달 내용 폼 (스크롤 지원) */}
            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 교육명 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>교육명 *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예) 2026 소방안전 필수 교육"
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* 기간 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>교육 시작일 *</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>교육 종료일 *</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {/* 동영상 업로드 방식 선택 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>동영상 업로드 방식 *</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="videoType" 
                      value="sample"
                      checked={videoType === 'sample'}
                      onChange={() => setVideoType('sample')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    샘플 영상 사용
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="videoType" 
                      value="upload"
                      checked={videoType === 'upload'}
                      onChange={() => setVideoType('upload')}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    직접 파일 업로드 (MP4 등)
                  </label>
                </div>

                {videoType === 'sample' ? (
                  <div style={{ marginTop: '4px' }}>
                    <input 
                      type="text" 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="샘플 동영상 URL 입력"
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      (기본 샘플 영상 URL이 채워져 있습니다. 필요 시 변경 가능합니다.)
                    </span>
                  </div>
                ) : (
                  <div style={{ marginTop: '4px' }}>
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                      style={{ fontSize: '13px' }}
                    />
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      (영상 크기에 따라 등록에 다소 시간이 걸릴 수 있습니다. IndexedDB에 영구 보존됩니다.)
                    </span>
                    {editingEdu && !videoFile && (
                      <span style={{ fontSize: '12px', color: 'var(--primary)', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                        ✓ 기존 업로드된 영상 파일이 있습니다. 새로 파일을 선택하지 않으면 기존 파일이 유지됩니다.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 합격 커트라인 설정 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>합격 기준 점수 (100점 만점 기준) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={cutLine}
                    onChange={(e) => setCutLine(Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="예) 60"
                    style={{ width: '100px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>점 이상 합격</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (각 문제당 배점은 균등 배분됩니다. 예: 10문제 중 60점 이상은 6문제 이상 맞추기)
                </span>
              </div>

              {/* 다중 퀴즈 문제 출제 컨테이너 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>확인 퀴즈 설정 *</label>
                  <button 
                    type="button" 
                    onClick={handleAddQuiz}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', 
                      backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', 
                      borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' 
                    }}
                  >
                    <PlusCircle size={14} /> 문제 추가
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {quizzes.map((quiz, qIdx) => (
                    <div 
                      key={qIdx} 
                      style={{ 
                        padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', 
                        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>Q{qIdx + 1}번 문제</span>
                        {quizzes.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveQuiz(qIdx)}
                            style={{ 
                              background: 'none', border: 'none', color: '#ef4444', 
                              fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' 
                            }}
                          >
                            <Trash2 size={12} /> 문제 삭제
                          </button>
                        )}
                      </div>

                      {/* 퀴즈 질문 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>질문 내용</label>
                        <input 
                          type="text" 
                          value={quiz.question}
                          onChange={(e) => handleUpdateQuizQuestion(qIdx, e.target.value)}
                          placeholder="문제를 입력하세요."
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      {/* 보기 리스트 (동적 가감 지원) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '12px', color: '#64748b' }}>보기 목록</label>
                          <button 
                            type="button"
                            onClick={() => handleAddQuizOption(qIdx)}
                            style={{ padding: '2px 8px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            보기 추가 (+)
                          </button>
                        </div>

                        {quiz.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', width: '16px' }}>{oIdx + 1}.</span>
                            <input 
                              type="text" 
                              value={opt}
                              onChange={(e) => handleUpdateQuizOption(qIdx, oIdx, e.target.value)}
                              placeholder={`보기 ${oIdx + 1}의 내용을 입력하세요.`}
                              style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                              required
                            />
                            {quiz.options.length > 2 && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveQuizOption(qIdx, oIdx)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 정답 지정 (보기 개수에 맞춰 동적 셀렉트) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>정답 번호 선택</label>
                        <select 
                          value={quiz.answer}
                          onChange={(e) => handleUpdateQuizAnswer(qIdx, e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white' }}
                        >
                          {quiz.options.map((_, oIdx) => (
                            <option key={oIdx} value={oIdx}>{oIdx + 1}번 보기 정답</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 저장 버튼 */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingBottom: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '14px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button 
                  type="submit"
                  style={{ flex: 2, padding: '14px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                >
                  {editingEdu ? '수정하기' : '등록하기'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminEducation;

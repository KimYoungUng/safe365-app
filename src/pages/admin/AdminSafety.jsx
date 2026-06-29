import { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, AlertCircle, CheckCircle2, Edit2, Trash2, Plus, X, Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';
import TbmExecution from '../safety/TbmExecution';
import TbmTemplateManagement from './TbmTemplateManagement';
import { useEmployeeNotifications } from '../../hooks/useEmployeeNotifications';

function AdminSafety() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    safetyResults, 
    safetyChecklist, 
    addSafetyChecklistItem, 
    updateSafetyChecklistItem, 
    deleteSafetyChecklistItem,
    tbmSubmissions,
    safetySuggestions,
    updateSafetySuggestion,
    nearMisses,
    updateNearMiss,
    emergencyHistory
  } = useContext(DataContext);
  const { currentUser, users } = useContext(AuthContext);
  const notifications = useEmployeeNotifications();
  
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialTab = params.get('tab') || '현황';
  const [activeTab, setActiveTab] = useState(initialTab); // '현황' | 'TBM' | '안전의견' | '관리'
  const [selectedTbm, setSelectedTbm] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [suggestionFeedback, setSuggestionFeedback] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState('처리중');
  const [suggestionFeedbackImage, setSuggestionFeedbackImage] = useState(null);
  const [managementTab, setManagementTab] = useState('inspection'); // 'inspection' | 'tbm'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSuggestionFeedbackImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setSuggestionFeedbackImage(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const [selectedNearMiss, setSelectedNearMiss] = useState(null);
  const [nearMissFeedback, setNearMissFeedback] = useState('');
  const [nearMissStatus, setNearMissStatus] = useState('처리중');
  
  const tbmPrintRef = useRef(null);

  const tbmSubmitter = selectedTbm ? users.find(u => u.id === selectedTbm.userId) || {} : {};
  const tbmLeaderDept = selectedTbm?.data?.leaderDept || tbmSubmitter.department || '';
  const tbmLeaderPos = selectedTbm?.data?.leaderPosition || tbmSubmitter.role || '';
  const tbmLeaderDeptPosStr = [tbmLeaderDept, tbmLeaderPos].filter(Boolean).join(' / ');

  const getReporterInfo = (item) => {
    if (item.isAnonymous) return '익명';
    const u = users.find(x => x.id === item.userId);
    if (!u) return `${item.userName} (${item.userId})`;
    const parts = [u.department, u.role].filter(Boolean);
    const prefix = parts.length > 0 ? `[${parts.join(' / ')}] ` : '';
    return `${prefix}${item.userName} (${item.userId})`;
  };


  const handleTbmDownload = async () => {
    if (!selectedTbm || !tbmPrintRef.current) return;
    try {
      // Clone element to off-screen container at A4 width for proper rendering
      const clone = tbmPrintRef.current.cloneNode(true);
      const offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;min-width:794px;background:#fff;z-index:-1;padding:0;margin:0;';
      clone.style.width = '794px';
      clone.style.minWidth = '794px';
      clone.style.maxWidth = '794px';
      clone.style.padding = '32px';
      clone.style.boxSizing = 'border-box';
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait for images to load
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
      link.download = `${selectedTbm.title}_${selectedTbm.userName}_${selectedTbm.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    }
  };

  // --- 현황 탭 관련 상태 및 로직 ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatTimeStr = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch {
      return isoString;
    }
  };

  const handleInspectionClick = (result) => {
    setExpandedUser(expandedUser === result.userId ? null : result.userId);
    if (currentUser?.id) {
      const saved = localStorage.getItem(`dismissedNotifications_${currentUser.id}`);
      let dismissed = saved ? JSON.parse(saved) : [];
      const notiId = `admin_inspection_${result.id}`;
      if (!dismissed.includes(notiId)) {
        const updated = [...dismissed, notiId];
        localStorage.setItem(`dismissedNotifications_${currentUser.id}`, JSON.stringify(updated));
        window.dispatchEvent(new Event('dismissedNotificationsChanged'));
      }
    }
  };

  const selectedDateStr = formatDate(selectedDate);

  const myCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '스마트컴퍼니') : '스마트컴퍼니';
  
  const searchFilter = (item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const title = item.title?.toLowerCase() || '';
    const content = (item.content || item.topic || '')?.toLowerCase() || '';
    const userName = item.userName?.toLowerCase() || '';
    return title.includes(term) || content.includes(term) || userName.includes(term);
  };

  const myCompanyTbmSubmissions = (tbmSubmissions?.filter(s => s.companyId === myCompanyId) || []).filter(searchFilter);
  const myCompanySafetySuggestions = (safetySuggestions?.filter(s => s.companyId === myCompanyId) || []).filter(searchFilter);
  const myCompanyNearMisses = (nearMisses?.filter(nm => nm.companyId === myCompanyId) || []).filter(searchFilter);

  const myCompanySafetyResults = safetyResults.filter(r => {
    const user = users.find(u => u.id === r.userId) || {};
    const uCompanyId = user.companyId || user.companyName || '스마트컴퍼니';
    return uCompanyId === myCompanyId;
  }).filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const userName = r.userName?.toLowerCase() || '';
    const location = r.location?.toLowerCase() || '';
    return userName.includes(term) || location.includes(term);
  });

  const resultsForSelectedDate = myCompanySafetyResults.filter(r => searchTerm ? true : r.date === selectedDateStr);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const nearMissId = searchParams.get('nearMissId');
    const suggestionId = searchParams.get('suggestionId');

    if (nearMissId && myCompanyNearMisses.length > 0) {
      const nm = myCompanyNearMisses.find(x => x.id.toString() === nearMissId);
      if (nm) {
        setSelectedNearMiss(nm);
        setNearMissFeedback(nm.feedback || '');
        setNearMissStatus(nm.status || '접수대기');
      }
    }
    if (suggestionId && myCompanySafetySuggestions.length > 0) {
      const sug = myCompanySafetySuggestions.find(x => x.id.toString() === suggestionId);
      if (sug) {
        setSelectedSuggestion(sug);
        setSuggestionFeedback(sug.feedback || '');
        setSuggestionStatus(sug.status || '접수대기');
        setSuggestionFeedbackImage(sug.feedbackImage || null);
      }
    }
  }, [location.search, myCompanyNearMisses, myCompanySafetySuggestions]);
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getDayStatus = (dateStr) => {
    const dayResults = myCompanySafetyResults.filter(r => r.date === dateStr);
    if (dayResults.length === 0) return 'none';
    const hasImperfect = dayResults.some(r => !r.isPerfect);
    return hasImperfect ? 'bad' : 'good';
  };

  const [expandedUser, setExpandedUser] = useState(null);

  // --- 관리 탭 관련 상태 및 로직 ---
  const [editingItem, setEditingItem] = useState(null); // { id, title, description, options }
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveItem = () => {
    if (!editingItem.title.trim() || !editingItem.description.trim()) {
      alert('항목명과 설명을 모두 입력해주세요.');
      return;
    }
    const validOptions = editingItem.options.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) {
      alert('선택지는 최소 2개 이상 입력해야 합니다.');
      return;
    }

    if (isAdding) {
      addSafetyChecklistItem(editingItem.title, editingItem.description, validOptions);
      setIsAdding(false);
    } else {
      updateSafetyChecklistItem(editingItem.id, editingItem.title, editingItem.description, validOptions);
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('정말 이 점검 항목을 삭제하시겠습니까?')) {
      deleteSafetyChecklistItem(id);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...editingItem.options];
    newOptions[index] = value;
    setEditingItem({ ...editingItem, options: newOptions });
  };

  const handleAddOption = () => {
    setEditingItem({ ...editingItem, options: [...editingItem.options, ''] });
  };

  const handleRemoveOption = (index) => {
    const newOptions = editingItem.options.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, options: newOptions });
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          {isSearchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
              <ArrowLeft className="header-icon" onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} />
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                autoFocus
              />
              <X size={20} color="#888" onClick={() => setSearchTerm('')} style={{ cursor: 'pointer' }} />
            </div>
          ) : (
            <>
              <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>전사 안전 점검 관리</div>
              <Search className="header-icon" onClick={() => setIsSearchOpen(true)} />
            </>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', width: '100%', borderTop: '1px solid #f1f5f9' }}>
          <div 
            onClick={() => {
              setActiveTab('현황');
              navigate('?tab=현황', { replace: true });
            }}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: (activeTab === '현황' || activeTab === '관리') ? '#3b82f6' : '#64748b', borderBottom: (activeTab === '현황' || activeTab === '관리') ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            점검 현황
            {notifications.adminUnreadInspectionsCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '4px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </div>
          <div 
            onClick={() => {
              setActiveTab('TBM');
              navigate('?tab=TBM', { replace: true });
            }}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === 'TBM' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'TBM' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            TBM
            {notifications.adminUnreadTbmCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '12px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </div>
          <div 
            onClick={() => {
              setActiveTab('안전의견');
              setSelectedSuggestion(null);
              navigate('?tab=안전의견', { replace: true });
            }}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '안전의견' ? '#3b82f6' : '#64748b', borderBottom: activeTab === '안전의견' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            안전의견
            {notifications.adminUnreadSuggestionsCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '4px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </div>
          <div 
            onClick={() => {
              setActiveTab('아차사고');
              setSelectedNearMiss(null);
              navigate('?tab=아차사고', { replace: true });
            }}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '아차사고' ? '#3b82f6' : '#64748b', borderBottom: activeTab === '아차사고' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            아차사고
            {notifications.adminUnreadNearMissesCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '4px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </div>

          <div 
            onClick={() => {
              setActiveTab('긴급상황');
              navigate('?tab=긴급상황', { replace: true });
            }}
            style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '긴급상황' ? '#ef4444' : '#64748b', borderBottom: activeTab === '긴급상황' ? '3px solid #ef4444' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            긴급상황
            {notifications.adminActiveEmergenciesCount > 0 && <span style={{ position: 'absolute', top: '8px', right: '4px', width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </div>
        </div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        {(activeTab === '현황' || activeTab === '관리') && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setActiveTab('현황')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === '현황' ? 'white' : 'transparent', color: activeTab === '현황' ? '#1e293b' : '#64748b', fontWeight: 'bold', fontSize: '14px', boxShadow: activeTab === '현황' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              점검 통계
            </button>
            <button 
              onClick={() => setActiveTab('관리')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === '관리' ? 'white' : 'transparent', color: activeTab === '관리' ? '#1e293b' : '#64748b', fontWeight: 'bold', fontSize: '14px', boxShadow: activeTab === '관리' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              점검 항목 관리
            </button>
          </div>
        )}
        
        {activeTab === '긴급상황' && (
          <div style={{ paddingBottom: '24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#ef4444' }}>
                <AlertCircle size={24} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>긴급 작업중지 발령 이력</h3>
              </div>
              
              {emergencyHistory && emergencyHistory.filter(e => e.companyId === currentUser.companyId).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {emergencyHistory.filter(e => e.companyId === currentUser.companyId)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map(event => (
                      <div key={event.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '15px', marginBottom: '4px' }}>
                            [작업중지 발령]
                          </div>
                          <div style={{ color: '#7f1d1d', fontSize: '13px' }}>
                            발령자: {event.issuerName}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', color: '#991b1b', fontSize: '13px' }}>
                          <div>{new Date(event.timestamp).toLocaleDateString()}</div>
                          <div style={{ fontWeight: 'bold' }}>{new Date(event.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '15px' }}>
                  발령된 긴급 상황 이력이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === '현황' && (
          <>
            {/* 달력 영역 */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#555" /></button>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111' }}>
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </div>
                <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={24} color="#555" /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} style={{ fontSize: '13px', color: '#888', fontWeight: 'bold' }}>{day}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {calendarDays.map((dayDate, idx) => {
                  if (!dayDate) return <div key={`empty-${idx}`} />;
                  const isSelected = formatDate(dayDate) === selectedDateStr;
                  const isToday = formatDate(dayDate) === formatDate(new Date());
                  const status = getDayStatus(formatDate(dayDate));
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => { setSelectedDate(dayDate); setExpandedUser(null); }}
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '48px', borderRadius: '12px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#1e293b' : 'transparent',
                        color: isSelected ? 'white' : (dayDate.getDay() === 0 ? '#ef4444' : '#333'),
                        border: isToday && !isSelected ? '1px solid #1e293b' : '1px solid transparent',
                        position: 'relative'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: isSelected || isToday ? 'bold' : 'normal' }}>
                        {dayDate.getDate()}
                      </span>
                      {status !== 'none' && (
                        <div style={{ position: 'absolute', bottom: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status === 'good' ? '#22c55e' : '#ef4444' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div> 전원 양호
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> 미흡/불량 포함
                 </div>
              </div>
            </div>

            {/* 선택된 날짜 상세 목록 */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 점검 현황 ({resultsForSelectedDate.length}건)
              </h3>

              {resultsForSelectedDate.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                  제출된 점검 내역이 없습니다.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...resultsForSelectedDate].sort((a, b) => a.isPerfect === b.isPerfect ? 0 : a.isPerfect ? 1 : -1).map(result => (
                    <div key={result.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      {/* 요약 바 */}
                      <div 
                        onClick={() => handleInspectionClick(result)}
                        style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: `4px solid ${result.isPerfect ? '#22c55e' : '#ef4444'}` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', overflow: 'hidden' }}>
                            {(() => {
                              const u = users.find(x => x.id === result.userId);
                              const n = u ? u.name : result.userId;
                              return n.substring(0, 1).toUpperCase();
                            })()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              사원 {(() => {
                                const u = users.find(x => x.id === result.userId);
                                return u ? u.name : result.userId;
                              })()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>제출완료</div>
                          </div>
                        </div>
                        
                        {result.isPerfect ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#10b981', fontWeight: 'bold', padding: '4px 8px', backgroundColor: '#d1fae5', borderRadius: '20px' }}>
                            <CheckCircle2 size={14} /> 통과
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#e11d48', fontWeight: 'bold', padding: '4px 8px', backgroundColor: '#ffe4e6', borderRadius: '20px' }}>
                            <AlertCircle size={14} /> 확인필요
                          </span>
                        )}
                      </div>

                      {/* 상세 내용 (Expanded) */}
                      {expandedUser === result.userId && (
                        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {safetyChecklist.map(checkItem => {
                              const answer = result.items.find(i => i.questionId === checkItem.id);
                              if (!answer) return null;
                              const isGoodOption = answer.status === (checkItem.options ? checkItem.options[0] : '양호');
                              return (
                                <div key={checkItem.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{checkItem.title}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ fontSize: '13px', color: isGoodOption ? '#10b981' : '#ef4444', fontWeight: 'bold', flexShrink: 0 }}>{answer.status}</div>
                                    {answer.note && (
                                      <div style={{ fontSize: '12px', color: '#64748b', backgroundColor: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', maxWidth: '80%', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                        {answer.note}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'TBM' && (
          <div>
            <TbmExecution isEmbedded={true} searchTerm={searchTerm} />
          </div>
        )}

        {activeTab === '안전의견' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myCompanySafetySuggestions.map(suggestion => (
              <div 
                key={suggestion.id} 
                onClick={() => {
                  setSelectedSuggestion(suggestion);
                  setSuggestionFeedback(suggestion.feedback || '');
                  setSuggestionStatus(suggestion.status || '접수대기');
                  setSuggestionFeedbackImage(suggestion.feedbackImage || null);
                }}
                style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: suggestion.status === '조치완료' ? '#d1fae5' : (suggestion.status === '처리중' ? '#dbeafe' : '#fef3c7'), color: suggestion.status === '조치완료' ? '#10b981' : (suggestion.status === '처리중' ? '#3b82f6' : '#d97706') }}>
                    {suggestion.status}
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{formatTimeStr(suggestion.createdAt).split(' ')[0]}</span>
                </div>
                <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>{suggestion.title}</h4>
                <div style={{ fontSize: '14px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {suggestion.content}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                  <span>제보자: <strong>{getReporterInfo(suggestion)}</strong></span>
                  {suggestion.location && <span>장소: {suggestion.location}</span>}
                </div>
              </div>
            ))}
            {myCompanySafetySuggestions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>접수된 안전의견이 없습니다.</div>
            )}
          </div>
        )}

        {activeTab === '아차사고' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myCompanyNearMisses.map(nm => (
              <div 
                key={nm.id} 
                onClick={() => {
                  setSelectedNearMiss(nm);
                  setNearMissFeedback(nm.feedback || '');
                  setNearMissStatus(nm.status || '접수대기');
                }}
                style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: nm.status === '조치완료' ? '#d1fae5' : (nm.status === '처리중' ? '#dbeafe' : '#fef3c7'), color: nm.status === '조치완료' ? '#10b981' : (nm.status === '처리중' ? '#3b82f6' : '#d97706') }}>
                    {nm.status}
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{formatTimeStr(nm.createdAt).split(' ')[0]}</span>
                </div>
                <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>{nm.title}</h4>
                <div style={{ fontSize: '14px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {nm.content}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
                  <span>제보자: <strong>{getReporterInfo(nm)}</strong></span>
                  {nm.location && <span>장소: {nm.location}</span>}
                </div>
              </div>
            ))}
            {myCompanyNearMisses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>접수된 아차사고가 없습니다.</div>
            )}
          </div>
        )}

        {activeTab === '관리' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '8px' }}>
              <button 
                onClick={() => setManagementTab('inspection')}
                style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: '15px', fontWeight: 'bold', color: managementTab === 'inspection' ? '#111' : '#888', borderBottom: managementTab === 'inspection' ? '2px solid #111' : '2px solid transparent', cursor: 'pointer' }}
              >
                일일 안전 점검
              </button>
              <button 
                onClick={() => setManagementTab('tbm')}
                style={{ background: 'none', border: 'none', padding: '8px 16px', fontSize: '15px', fontWeight: 'bold', color: managementTab === 'tbm' ? '#111' : '#888', borderBottom: managementTab === 'tbm' ? '2px solid #111' : '2px solid transparent', cursor: 'pointer' }}
              >
                TBM 실행 체크리스트
              </button>
            </div>

            {managementTab === 'inspection' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>점검 항목 관리 ({safetyChecklist.length}개)</h3>
                </div>

                {safetyChecklist.map(item => (
                  <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>
                    <div style={{ fontSize: '15px', color: '#111', lineHeight: '1.5', paddingRight: '60px' }}>
                      <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.title}</span><br/>
                      <span style={{ fontSize: '14px', color: '#555', marginTop: '8px', display: 'block' }}>{item.description}</span>
                      {item.options && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                          {item.options.map((opt, idx) => (
                             <span key={idx} style={{ fontSize: '12px', backgroundColor: idx === 0 ? '#d1fae5' : '#f1f5f9', color: idx === 0 ? '#10b981' : '#475569', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                               {opt}
                             </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ position: 'absolute', top: '20px', right: '16px', display: 'flex', gap: '12px' }}>
                      <Edit2 size={18} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => { setEditingItem({...item, options: item.options || ['양호', '미흡', '불량']}); setIsAdding(false); }} />
                      <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteItem(item.id)} />
                    </div>
                  </div>
                ))}

                <button 
                  onClick={() => { setIsAdding(true); setEditingItem({ id: null, title: '', description: '', options: ['양호', '미흡', '불량'] }); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', borderRadius: '12px', border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
                >
                  <Plus size={20} /> 새 항목 추가
                </button>
              </>
            )}

            {managementTab === 'tbm' && (
              <TbmTemplateManagement />
            )}
          </div>
        )}

      </main>

      {/* 모달 폼 (추가/수정) */}
      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>
            <button 
              onClick={() => { setEditingItem(null); setIsAdding(false); }}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={24} />
            </button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111', marginBottom: '24px' }}>
              {isAdding ? '새 점검 항목 추가' : '점검 항목 수정'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>항목명</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="예: 물기 확인"
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', fontSize: '15px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>점검 기준 설명</label>
                <textarea 
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="예: 바닥에 물기가 방치되지 않고 건조한 상태를 유지하고 있는가?"
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', fontSize: '15px', minHeight: '100px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  선택지 설정
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal', marginLeft: '8px' }}>* 첫 번째 항목이 '통과(Perfect)' 기준이 됩니다.</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editingItem.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`선택지 ${idx + 1}`}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '14px' }}
                      />
                      {editingItem.options.length > 2 && (
                        <button onClick={() => handleRemoveOption(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={handleAddOption}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#333', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                  >
                    + 선택지 추가
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveItem}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 안전의견 상세 모달 */}
      {selectedSuggestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f8fafc', width: '100%', maxWidth: '600px', height: '85vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out', position: 'relative' }}>
            <button 
              onClick={() => setSelectedSuggestion(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', zIndex: 10 }}
            >
              <X size={28} />
            </button>
            
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: selectedSuggestion.status === '조치완료' ? '#d1fae5' : (selectedSuggestion.status === '처리중' ? '#dbeafe' : '#fef3c7'), color: selectedSuggestion.status === '조치완료' ? '#10b981' : (selectedSuggestion.status === '처리중' ? '#3b82f6' : '#d97706'), marginBottom: '12px' }}>
                {selectedSuggestion.status}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>{selectedSuggestion.title}</h2>
              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                <span>{formatTimeStr(selectedSuggestion.createdAt)}</span>
                <span>제보자: {getReporterInfo(selectedSuggestion)}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>상세 내용</h3>
                <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                  {selectedSuggestion.content}
                </div>
                {selectedSuggestion.photo && (
                  <div style={{ marginTop: '16px' }}>
                    <img src={selectedSuggestion.photo} alt="첨부" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                  </div>
                )}
                {selectedSuggestion.location && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '14px', color: '#64748b' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155', marginRight: '8px' }}>발생 장소</span> {selectedSuggestion.location}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '16px' }}>관리자 처리</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>처리 상태</label>
                  <select 
                    value={suggestionStatus}
                    onChange={(e) => setSuggestionStatus(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="접수대기">접수대기</option>
                    <option value="처리중">처리중</option>
                    <option value="조치완료">조치완료</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>처리 결과 / 피드백</label>
                  <textarea 
                    value={suggestionFeedback}
                    onChange={(e) => setSuggestionFeedback(e.target.value)}
                    placeholder="제보자에게 전달할 피드백이나 처리 결과를 입력해주세요."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '100px', resize: 'none' }}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>처리 결과 사진 첨부</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', cursor: 'pointer' }}>
                      <Camera size={24} color="#64748b" />
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>사진 추가</span>
                      <input type="file" accept="image/*" onChange={handleSuggestionFeedbackImageUpload} style={{ display: 'none' }} />
                    </label>
                    {suggestionFeedbackImage && (
                      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                        <img src={suggestionFeedbackImage} alt="답변 첨부" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                        <button 
                          onClick={() => setSuggestionFeedbackImage(null)}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    updateSafetySuggestion(selectedSuggestion.id, {
                      status: suggestionStatus,
                      feedback: suggestionFeedback,
                      feedback_image: suggestionFeedbackImage
                    });
                    setSelectedSuggestion(null);
                    alert('안전의견 처리 상태가 저장되었습니다.');
                  }}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', marginTop: '16px', cursor: 'pointer' }}
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 아차사고 상세 모달 */}
      {selectedNearMiss && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#f8fafc', width: '100%', maxWidth: '600px', height: '85vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out', position: 'relative' }}>
            <button 
              onClick={() => setSelectedNearMiss(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888', zIndex: 10 }}
            >
              <X size={28} />
            </button>
            
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', backgroundColor: selectedNearMiss.status === '조치완료' ? '#d1fae5' : (selectedNearMiss.status === '처리중' ? '#dbeafe' : '#fef3c7'), color: selectedNearMiss.status === '조치완료' ? '#10b981' : (selectedNearMiss.status === '처리중' ? '#3b82f6' : '#d97706'), marginBottom: '12px' }}>
                {selectedNearMiss.status}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>{selectedNearMiss.title}</h2>
              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                <span>{formatTimeStr(selectedNearMiss.createdAt)}</span>
                <span>제보자: {getReporterInfo(selectedNearMiss)}</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>상세 내용</h3>
                <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                  {selectedNearMiss.content}
                </div>
                {selectedNearMiss.photo && (
                  <div style={{ marginTop: '16px' }}>
                    <img src={selectedNearMiss.photo} alt="첨부" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                  </div>
                )}
                {selectedNearMiss.location && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '14px', color: '#64748b' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155', marginRight: '8px' }}>발생 장소</span> {selectedNearMiss.location}
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '16px' }}>관리자 처리</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>처리 상태</label>
                  <select 
                    value={nearMissStatus}
                    onChange={(e) => setNearMissStatus(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="접수대기">접수대기</option>
                    <option value="처리중">처리중</option>
                    <option value="조치완료">조치완료</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>처리 결과 / 피드백</label>
                  <textarea 
                    value={nearMissFeedback}
                    onChange={(e) => setNearMissFeedback(e.target.value)}
                    placeholder="제보자에게 전달할 피드백이나 처리 결과를 입력해주세요."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '100px', resize: 'none' }}
                  />
                </div>
                
                <button 
                  onClick={() => {
                    updateNearMiss(selectedNearMiss.id, {
                      status: nearMissStatus,
                      feedback: nearMissFeedback
                    });
                    setSelectedNearMiss(null);
                    alert('아차사고 처리 상태가 저장되었습니다.');
                  }}
                  style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', marginTop: '16px', cursor: 'pointer' }}
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminSafety;

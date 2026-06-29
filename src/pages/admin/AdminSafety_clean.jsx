import { useState, useContext, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, AlertCircle, CheckCircle2, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';

function AdminSafety() {
  const navigate = useNavigate();
  const { 
    safetyResults, 
    safetyChecklist, 
    addSafetyChecklistItem, 
    updateSafetyChecklistItem, 
    deleteSafetyChecklistItem,
    tbmSubmissions
  } = useContext(DataContext);
  const { currentUser, users } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('?꾪솴'); // '?꾪솴' | 'TBM' | '愿由?
  const [selectedTbm, setSelectedTbm] = useState(null);
  
  const tbmPrintRef = useRef(null);

  const handleTbmDownload = async () => {
    if (!selectedTbm || !tbmPrintRef.current) return;
    try {
      // Clone element to off-screen container at A4 width for proper rendering
      const clone = tbmPrintRef.current.cloneNode(true);
      const offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:1000px;min-width:1000px;background:#fff;z-index:-1;padding:0;margin:0;';
      clone.style.width = '1000px';
      clone.style.minWidth = '1000px';
      clone.style.maxWidth = '1000px';
      clone.style.padding = '40px';
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
        width: 1000,
        windowWidth: 1000,
      });
      document.body.removeChild(offscreen);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedTbm.title}_${selectedTbm.userName}_${selectedTbm.date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('?대?吏 ?ㅼ슫濡쒕뱶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    }
  };

  // --- ?꾪솴 ??愿???곹깭 諛?濡쒖쭅 ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const selectedDateStr = formatDate(selectedDate);

  const myCompanyId = currentUser ? (currentUser.companyId || currentUser.companyName || '?ㅻ쭏?몄뺨?쇰땲') : '?ㅻ쭏?몄뺨?쇰땲';
  const myCompanyTbmSubmissions = tbmSubmissions?.filter(s => s.companyId === myCompanyId) || [];

  const myCompanySafetyResults = safetyResults.filter(r => {
    const user = users.find(u => u.id === r.userId) || {};
    const uCompanyId = user.companyId || user.companyName || '?ㅻ쭏?몄뺨?쇰땲';
    return uCompanyId === myCompanyId;
  });

  const resultsForSelectedDate = myCompanySafetyResults.filter(r => r.date === selectedDateStr);
  
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

  // --- 愿由???愿???곹깭 諛?濡쒖쭅 ---
  const [editingItem, setEditingItem] = useState(null); // { id, title, description, options }
  const [isAdding, setIsAdding] = useState(false);

  const handleSaveItem = () => {
    if (!editingItem.title.trim() || !editingItem.description.trim()) {
      alert('??ぉ紐낃낵 ?ㅻ챸??紐⑤몢 ?낅젰?댁＜?몄슂.');
      return;
    }
    const validOptions = editingItem.options.map(o => o.trim()).filter(o => o !== '');
    if (validOptions.length < 2) {
      alert('?좏깮吏??理쒖냼 2媛??댁긽 ?낅젰?댁빞 ?⑸땲??');
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
    if (window.confirm('?뺣쭚 ???먭? ??ぉ????젣?섏떆寃좎뒿?덇퉴?')) {
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
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '16px' }}>
          <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>?꾩궗 ?덉쟾 ?먭? 愿由?/div>
          <Search className="header-icon" />
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', width: '100%', borderTop: '1px solid #f1f5f9' }}>
          <div 
            onClick={() => setActiveTab('?꾪솴')}
            style={{ flex: 1, textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '?꾪솴' ? '#3b82f6' : '#64748b', borderBottom: activeTab === '?꾪솴' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            ?먭? ?꾪솴
          </div>
          <div 
            onClick={() => setActiveTab('TBM')}
            style={{ flex: 1, textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === 'TBM' ? '#3b82f6' : '#64748b', borderBottom: activeTab === 'TBM' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            TBM ?댄뻾 ?꾪솴
          </div>
          <div 
            onClick={() => setActiveTab('愿由?)}
            style={{ flex: 1, textAlign: 'center', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: activeTab === '愿由? ? '#3b82f6' : '#64748b', borderBottom: activeTab === '愿由? ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            ??ぉ 愿由?          </div>
        </div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
        {activeTab === '?꾪솴' && (
          <>
            {/* ?щ젰 ?곸뿭 */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronLeft size={24} color="#555" /></button>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111' }}>
                  {currentMonth.getFullYear()}??{currentMonth.getMonth() + 1}??                </div>
                <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ChevronRight size={24} color="#555" /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                {['??, '??, '??, '??, '紐?, '湲?, '??].map(day => (
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
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div> ?꾩썝 ?묓샇
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> 誘명씉/遺덈웾 ?ы븿
                 </div>
              </div>
            </div>

            {/* ?좏깮???좎쭨 ?곸꽭 紐⑸줉 */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>
                {selectedDate.getMonth() + 1}??{selectedDate.getDate()}???먭? ?꾪솴 ({resultsForSelectedDate.length}嫄?
              </h3>

              {resultsForSelectedDate.length === 0 ? (
                <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                  ?쒖텧???먭? ?댁뿭???놁뒿?덈떎.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...resultsForSelectedDate].sort((a, b) => a.isPerfect === b.isPerfect ? 0 : a.isPerfect ? 1 : -1).map(result => (
                    <div key={result.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      {/* ?붿빟 諛?*/}
                      <div 
                        onClick={() => setExpandedUser(expandedUser === result.userId ? null : result.userId)}
                        style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderLeft: `4px solid ${result.isPerfect ? '#22c55e' : '#ef4444'}` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569' }}>
                            {result.userId.replace('user', 'U')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#111' }}>?ъ썝 {result.userId}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>?쒖텧?꾨즺</div>
                          </div>
                        </div>
                        
                        {result.isPerfect ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#10b981', fontWeight: 'bold', padding: '4px 8px', backgroundColor: '#d1fae5', borderRadius: '20px' }}>
                            <CheckCircle2 size={14} /> ?듦낵
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#e11d48', fontWeight: 'bold', padding: '4px 8px', backgroundColor: '#ffe4e6', borderRadius: '20px' }}>
                            <AlertCircle size={14} /> ?뺤씤?꾩슂
                          </span>
                        )}
                      </div>

                      {/* ?곸꽭 ?댁슜 (Expanded) */}
                      {expandedUser === result.userId && (
                        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {safetyChecklist.map(checkItem => {
                              const answer = result.items.find(i => i.questionId === checkItem.id);
                              if (!answer) return null;
                              const isGoodOption = answer.status === (checkItem.options ? checkItem.options[0] : '?묓샇');
                              return (
                                <div key={checkItem.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{checkItem.title}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '13px', color: isGoodOption ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{answer.status}</div>
                                    {answer.note && (
                                      <div style={{ fontSize: '12px', color: '#64748b', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', maxWidth: '70%' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>TBM 怨꾪쉷 ?댄뻾 臾몄꽌 ({myCompanyTbmSubmissions.length}嫄?</h3>
            </div>
            
            {myCompanyTbmSubmissions.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                ?쒖텧??TBM ?댄뻾 ?댁뿭???놁뒿?덈떎.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myCompanyTbmSubmissions.map(tbm => (
                  <div 
                    key={tbm.id} 
                    onClick={() => setSelectedTbm(tbm)}
                    style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px',
                        backgroundColor: tbm.type === 'checklist' ? '#eff6ff' : '#f0f9ff',
                        color: tbm.type === 'checklist' ? '#3b82f6' : '#0284c7'
                      }}>
                        {tbm.type === 'checklist' ? '?쒖떇 1. 泥댄겕由ъ뒪?? : '?쒖떇 2. ?뚯쓽濡?}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{tbm.date}</span>
                    </div>
                    
                    <div>
                      <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>{tbm.title}</h4>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '13px', color: '#64748b' }}>
                        <span>?묒꽦?? <strong>{tbm.userName}</strong> ({tbm.userId})</span>
                        {tbm.type === 'minutes' && (
                          <span>李몄꽍?? {tbm.data.participants?.length || 0}紐?/span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === '愿由? && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>?먭? ??ぉ 愿由?({safetyChecklist.length}媛?</h3>
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
                  <Edit2 size={18} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => { setEditingItem({...item, options: item.options || ['?묓샇', '誘명씉', '遺덈웾']}); setIsAdding(false); }} />
                  <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteItem(item.id)} />
                </div>
              </div>
            ))}

            <button 
              onClick={() => { setIsAdding(true); setEditingItem({ id: null, title: '', description: '', options: ['?묓샇', '誘명씉', '遺덈웾'] }); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', borderRadius: '12px', border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
            >
              <Plus size={20} /> ????ぉ 異붽?
            </button>
          </div>
        )}

      </main>

      {/* 紐⑤떖 ??(異붽?/?섏젙) */}
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
              {isAdding ? '???먭? ??ぉ 異붽?' : '?먭? ??ぉ ?섏젙'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>??ぉ紐?/label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="?? 臾쇨린 ?뺤씤"
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', fontSize: '15px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>?먭? 湲곗? ?ㅻ챸</label>
                <textarea 
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="?? 諛붾떏??臾쇨린媛 諛⑹튂?섏? ?딄퀬 嫄댁“???곹깭瑜??좎??섍퀬 ?덈뒗媛?"
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', boxSizing: 'border-box', fontSize: '15px', minHeight: '100px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  ?좏깮吏 ?ㅼ젙
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 'normal', marginLeft: '8px' }}>* 泥?踰덉㎏ ??ぉ??'?듦낵(Perfect)' 湲곗????⑸땲??</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editingItem.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`?좏깮吏 ${idx + 1}`}
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
                    + ?좏깮吏 異붽?
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSaveItem}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}
              >
                ??ν븯湲?              </button>
            </div>
          </div>
        </div>
      )}

      {/* TBM ?곸꽭 蹂닿린 紐⑤떖 */}
      {selectedTbm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>

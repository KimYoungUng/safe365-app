import { useState, useContext, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';

function SafetyInspection() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { safetyChecklist, safetyResults, submitSafetyResult } = useContext(DataContext);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const selectedDateStr = formatDate(selectedDate);
  const myResults = safetyResults.filter(r => r.userId === currentUser?.id);
  const resultForSelected = myResults.find(r => r.date === selectedDateStr);

  const [formItems, setFormItems] = useState([]);

  // Initialize form when selected date changes or checklist loads
  useEffect(() => {
    if (resultForSelected) {
      setFormItems(resultForSelected.items);
    } else {
      setFormItems(safetyChecklist.map(item => ({
        questionId: item.id,
        status: '',
        note: ''
      })));
    }
  }, [resultForSelected, safetyChecklist, selectedDateStr]);

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleStatusChange = (questionId, status) => {
    if (resultForSelected) return;
    setFormItems(prev => prev.map(item => item.questionId === questionId ? { ...item, status } : item));
  };

  const handleNoteChange = (questionId, note) => {
    if (resultForSelected) return;
    setFormItems(prev => prev.map(item => item.questionId === questionId ? { ...item, note } : item));
  };

  const handleSubmit = () => {
    const isComplete = formItems.every(item => item.status !== '');
    if (!isComplete) {
      alert('모든 항목의 상태를 체크해주세요.');
      return;
    }
    submitSafetyResult(currentUser.id, selectedDateStr, formItems);
    alert('안전 점검 결과가 제출되었습니다.');
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>안전 점검</div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        
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
              const result = myResults.find(r => r.date === formatDate(dayDate));
              const isToday = formatDate(dayDate) === formatDate(new Date());
              
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(dayDate)}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '48px', borderRadius: '12px', cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? 'white' : (dayDate.getDay() === 0 ? '#ef4444' : '#333'),
                    border: isToday && !isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: isSelected || isToday ? 'bold' : 'normal' }}>
                    {dayDate.getDate()}
                  </span>
                  {result && (
                    <div style={{ position: 'absolute', bottom: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: result.isPerfect ? '#22c55e' : '#ef4444' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 점검 폼 영역 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 점검 항목
            </h3>
            {resultForSelected ? (
              <span style={{ fontSize: '13px', color: resultForSelected.isPerfect ? '#22c55e' : '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> 제출완료
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: '#888' }}>미제출</span>
            )}
          </div>

          {/* 체크리스트 항목 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {safetyChecklist.map((item) => {
              const formItem = formItems.find(f => f.questionId === item.id) || {};
              // Fallback to default options if undefined
              const options = item.options || ['양호', '미흡', '불량'];
              
              return (
                <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '15px', color: '#111', lineHeight: '1.5', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.title}</span> : {item.description}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    {options.map(status => (
                      <label 
                        key={status} 
                        onClick={() => handleStatusChange(item.id, status)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', color: formItem.status === status ? '#3b82f6' : '#555', fontWeight: formItem.status === status ? 'bold' : 'normal', cursor: resultForSelected ? 'default' : 'pointer' }}
                      >
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${formItem.status === status ? '#3b82f6' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {formItem.status === status && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />}
                        </div>
                        <span style={{ wordBreak: 'keep-all' }}>{status}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'bold' }}>비고</span>
                    <input 
                      type="text" 
                      value={formItem.note || ''} 
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      readOnly={!!resultForSelected}
                      placeholder={resultForSelected ? "" : "특이사항 입력"}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: resultForSelected ? '#f8fafc' : 'white', fontSize: '14px', color: '#333' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!resultForSelected && (
            <button 
              onClick={handleSubmit}
              style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              제출하기
            </button>
          )}

        </div>
      </main>
    </div>
  );
}

export default SafetyInspection;

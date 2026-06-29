import { useState, useContext, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';
import { Trash2, Plus, Save } from 'lucide-react';

export default function TbmTemplateManagement() {
  const { companies, updateCompanyTbmTemplate } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);

  const [tbmTemplate, setTbmTemplate] = useState({ prep: [], exec: [], post: [] });
  const [loading, setLoading] = useState(true);

  const defaultTemplate = {
    prep: [
      { id: 1, text: '해당 작업의 위험성평가를 실시하였다. (해당 작업의 위험성평가 결과가 있다.)' },
      { id: 2, text: '해당 작업에서 발생한 사고보고서(아차사고 포함)의 내용을 확인하였다.' },
      { id: 3, text: '작업 물량과 범위, 작업내용과 필요한 보호구를 잘 알고 있다.' },
      { id: 4, text: '위험성평가 결과, 사고보고서, 안전작업지침의 내용을 여러 번 읽어 숙지하였다.' }
    ],
    exec: [
      { id: 1, text: '작업자가 음주, 발열, 약물 복용 등으로 작업에 적합한지 여부를 확인하였다.' },
      { id: 2, text: '작업내용 / 위험요인 / 안전 작업절차 / 대책에 대해 긍정적인 분위기로 대화하였다.' },
      { id: 3, text: '작업자와 중점 위험요인과 대책을 도출하고 이를 숙지하도록 하였다.' },
      { id: 4, text: '위험요인, 불안전한 상태 발견시 멈추고, 확인하고, 생각한 후 작업하도록 하였다.' },
      { id: 5, text: '작업 후 정리 정돈을 상태를 확인하였다.' }
    ],
    post: [
      { id: 1, text: '작업자가 제기한 불만사항, 질문, 제안사항을 검토하였다.' },
      { id: 2, text: 'TBM 결과를 충실하게 기록하고 보관한다.' },
      { id: 3, text: '관련 조치결과는 작업자에게 피드백 한다.' }
    ]
  };

  useEffect(() => {
    if (companies && currentUser) {
      const myCompany = companies.find(c => c.id === currentUser.companyId);
      if (myCompany && myCompany.tbm_template) {
        setTbmTemplate(myCompany.tbm_template);
      } else {
        setTbmTemplate(defaultTemplate);
      }
      setLoading(false);
    }
  }, [companies, currentUser]);

  const handleUpdateText = (category, index, newText) => {
    const updated = { ...tbmTemplate };
    updated[category][index].text = newText;
    setTbmTemplate(updated);
  };

  const handleRemove = (category, index) => {
    const updated = { ...tbmTemplate };
    updated[category].splice(index, 1);
    setTbmTemplate(updated);
  };

  const handleAdd = (category) => {
    const updated = { ...tbmTemplate };
    const maxId = updated[category].reduce((max, item) => Math.max(max, item.id), 0);
    updated[category].push({ id: maxId + 1, text: '' });
    setTbmTemplate(updated);
  };

  const handleSave = async () => {
    const success = await updateCompanyTbmTemplate(currentUser.companyId, tbmTemplate);
    if (success) {
      alert('TBM 체크리스트가 저장되었습니다.');
    } else {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const renderCategory = (title, category) => (
    <div style={{ marginBottom: '24px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#111', margin: 0 }}>{title}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tbmTemplate[category].map((item, index) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#3b82f6', minWidth: '20px' }}>{index + 1}.</span>
            <input 
              type="text" 
              value={item.text} 
              onChange={(e) => handleUpdateText(category, index, e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              placeholder="체크리스트 문항을 입력하세요"
            />
            <button onClick={() => handleRemove(category, index)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
              <Trash2 size={18} color="#ef4444" />
            </button>
          </div>
        ))}
        <button 
          onClick={() => handleAdd(category)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px dashed #3b82f6', backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
        >
          <Plus size={18} /> 항목 추가
        </button>
      </div>
    </div>
  );

  if (loading) return <div>로딩중...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', margin: 0 }}>TBM 실행 체크리스트 관리</h3>
        <button 
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#111', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <Save size={16} /> 저장
        </button>
      </div>
      
      {renderCategory('1. 사전준비', 'prep')}
      {renderCategory('2. 실행과정', 'exec')}
      {renderCategory('3. 후속조치', 'post')}
    </div>
  );
}

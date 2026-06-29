import { useEffect, useContext, useRef } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';

function EmergencyAlert() {
  const { activeEmergencies, resolveEmergency } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const audioRef = useRef(null);

  // Check if current user's company is in emergency state
  const isEmergency = currentUser && currentUser.companyId && activeEmergencies?.includes(currentUser.companyId);

  useEffect(() => {
    if (isEmergency) {
      // Setup audio context with an oscillator to create a siren sound
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = audioCtx;

      const playSiren = () => {
        if (!audioRef.current || audioRef.current.state === 'closed') return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime); // Start frequency
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5); // Ramp up
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); // Fade out

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      };

      // Play beep periodically
      const intervalId = setInterval(playSiren, 600);
      playSiren(); // Play immediately once

      return () => {
        clearInterval(intervalId);
        if (audioRef.current && audioRef.current.state !== 'closed') {
          audioRef.current.close();
        }
      };
    }
  }, [isEmergency]);

  if (!isEmergency) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(239, 68, 68, 0.9)', zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'flash 1s infinite alternate',
      color: 'white', padding: '24px', textAlign: 'center'
    }}>
      <style>
        {`
          @keyframes flash {
            0% { background-color: rgba(239, 68, 68, 0.8); }
            100% { background-color: rgba(239, 68, 68, 1); }
          }
        `}
      </style>
      <AlertTriangle size={80} color="white" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        긴급 상황 발생!
      </h1>
      <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '40px', lineHeight: '1.5' }}>
        작업중지 명령이 발령되었습니다.<br/>
        즉시 작업을 중단하고 안전한 곳으로 대피하십시오.
      </p>
      
      {/* 관리자나 최고관리자만 해제할 수 있도록 함 */}
      {(currentUser?.roleCode === 'COMPANY_ADMIN' || currentUser?.roleCode === 'SUPER_ADMIN') ? (
        <button 
          onClick={() => resolveEmergency(currentUser.companyId)}
          style={{
            backgroundColor: 'white', color: '#ef4444', border: 'none', borderRadius: '12px',
            padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <XCircle size={24} /> 상황 종료 (알림 해제)
        </button>
      ) : (
        <div style={{ marginTop: '20px', fontSize: '16px', color: '#fca5a5', fontWeight: 'bold' }}>
          * 상황 종료는 회사 관리자만 가능합니다.
        </div>
      )}
    </div>
  );
}

export default EmergencyAlert;

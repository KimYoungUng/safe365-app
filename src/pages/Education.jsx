import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BookOpen, CheckCircle, PlayCircle, X, Maximize, Minimize } from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { getVideoFile } from '../utils/dbHelper';

// YouTube URL을 embed 주소로 파싱하는 헬퍼 함수
const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shareMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shareMatch && shareMatch[1]) {
    return `https://www.youtube.com/embed/${shareMatch[1]}`;
  }
  return null;
};

// YouTube Video ID 추출 헬퍼 함수
const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

// 재생 시간 포맷용 헬퍼 함수
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

function Education() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { educations, userEducations, takeCourse, updateProgress } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState('교육현황');

  // 비디오/퀴즈 상태 관리
  const [activeVideoEdu, setActiveVideoEdu] = useState(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const videoRef = useRef(null);
  const maxTimeWatched = useRef(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);

  // 커스텀 비디오 재생 제어 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const youtubePlayerRef = useRef(null);
  const lastUpdatedProgressRef = useRef(0);
  const videoContainerRef = useRef(null);
  const youtubeContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 퀴즈 결과 및 답변 상태
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  // 전체화면 상태 감지 리스너
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || 
           document.webkitFullscreenElement || 
           document.mozFullScreenElement || 
           document.msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // activeVideoEdu가 바뀔 때 비디오 소스 가져오기
  useEffect(() => {
    let activeUrl = '';
    
    if (activeVideoEdu) {
      if (activeVideoEdu.videoUrl) {
        setVideoSrc(activeVideoEdu.videoUrl);
      } else {
        getVideoFile(activeVideoEdu.id).then(file => {
          if (file) {
            activeUrl = URL.createObjectURL(file);
            setVideoSrc(activeUrl);
          } else {
            alert('비디오 파일을 불러올 수 없습니다.');
          }
        }).catch(err => {
          console.error(err);
          alert('비디오 파일을 불러오는 중 오류가 발생했습니다.');
        });
      }
    }

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [activeVideoEdu]);

  // YouTube Iframe Player API 통합 제어
  useEffect(() => {
    const youtubeUrl = getYoutubeEmbedUrl(videoSrc);
    // 퀴즈 화면으로 전환된 이후(showQuiz가 true가 된 경우)에는 더 이상 유튜브 플레이어를 초기화하지 않음 (target element 누락으로 인한 크래시 방지)
    if (!youtubeUrl || showQuiz) return;

    let player = null;
    let intervalId = null;

    const initYoutubePlayer = () => {
      if (!youtubeContainerRef.current) return;

      const videoId = getYoutubeVideoId(videoSrc);
      if (!videoId) return;

      // YT 및 YT.Player 로딩 상태 안전 체크
      if (typeof window.YT === 'undefined' || typeof window.YT.Player === 'undefined') {
        setTimeout(initYoutubePlayer, 100);
        return;
      }

      // 기존 엘리먼트를 비우고, React Virtual DOM과 충돌하지 않도록 새로운 div를 내부적으로 동적 생성하여 전달
      youtubeContainerRef.current.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      youtubeContainerRef.current.appendChild(playerDiv);

      player = new window.YT.Player(playerDiv, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration();
            setVideoDuration(duration);

            // 유튜브 이어보기 구현
            const userEduStatus = getUserEduStatus(activeVideoEdu.id);
            const currentProgress = userEduStatus?.progress || 0;
            
            // Ref 초기 진행률 동기화
            lastUpdatedProgressRef.current = currentProgress;

            if (currentProgress > 0 && currentProgress < 100) {
              const resumeTime = duration * (currentProgress / 100);
              event.target.seekTo(resumeTime, true);
              maxTimeWatched.current = resumeTime;
              setVideoCurrentTime(resumeTime);
            } else {
              event.target.seekTo(0, true);
              maxTimeWatched.current = 0;
              setVideoCurrentTime(0);
            }

            setIsPlaying(true);

            // 실시간 타임 모니터링
            intervalId = setInterval(() => {
              if (player && typeof player.getCurrentTime === 'function') {
                const currentTime = player.getCurrentTime();
                const dur = player.getDuration();
                setVideoCurrentTime(currentTime);

                // 스킵 방지 강제 되돌림
                if (currentTime > maxTimeWatched.current + 1.5) {
                  player.seekTo(maxTimeWatched.current, true);
                  setVideoCurrentTime(maxTimeWatched.current);
                  return;
                }

                if (currentTime > maxTimeWatched.current) {
                  maxTimeWatched.current = currentTime;
                }

                if (dur > 0) {
                  const progress = Math.floor((maxTimeWatched.current / dur) * 100);
                  if (progress > lastUpdatedProgressRef.current && progress <= 100) {
                    lastUpdatedProgressRef.current = progress;
                    updateProgress(currentUser.id, activeVideoEdu.id, progress);
                  }
                }
              }
            }, 500);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // YouTube API 내부 메세지 디스패치 루프가 끝난 후에 unmount가 발생하도록 지연 시켜 크래시 방지
              setTimeout(() => {
                handleVideoEnded();
              }, 100);
            }
          }
        }
      });
      youtubePlayerRef.current = player;
    };

    if (typeof window.YT === 'undefined') {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    initYoutubePlayer();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (e) {
          console.warn("YouTube player destroy failed:", e);
        }
      }
      if (youtubeContainerRef.current) {
        youtubeContainerRef.current.innerHTML = '';
      }
    };
  }, [videoSrc, activeVideoEdu, showQuiz]);

  // Get user specific progress
  const getUserEduStatus = (eduId) => {
    const userEdu = userEducations?.find(ue => ue.userId === currentUser.id && String(ue.eduId) === String(eduId));
    return userEdu || { progress: 0, status: '미수료' };
  };

  const displayEducations = educations.map(edu => {
    const statusObj = getUserEduStatus(edu.id);
    return { ...edu, ...statusObj };
  })
  .filter(edu => !edu.companyId || edu.companyId === currentUser.companyId) // 회사별 필터링 적용
  .filter(edu => activeTab === '교육현황' ? edu.status !== '수료' : edu.status === '수료');

  const handleTakeCourse = (edu) => {
    setActiveVideoEdu(edu);
    setSelectedQuizOption(null);
    setCurrentQuizIndex(0);
    setIsPlaying(false);
    setUserAnswers([]);
    setShowQuizResults(false);
    
    if (edu.progress === 100) {
      setShowQuiz(true);
    } else {
      setShowQuiz(false);
      maxTimeWatched.current = 0;
    }
  };

  const closeVideoModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveVideoEdu(null);
    setVideoSrc('');
    setIsPlaying(false);
    setShowQuiz(false);
    setShowQuizResults(false);
    setUserAnswers([]);
    setSelectedQuizOption(null);
    setCurrentQuizIndex(0);
    setVideoDuration(0);
    setVideoCurrentTime(0);
  };

  // 이어보기 구현: 비디오 메타데이터가 로딩되면 이전 진행률 위치로 강제 이동
  const handleLoadedMetadata = () => {
    if (videoRef.current && activeVideoEdu) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      
      const userEduStatus = getUserEduStatus(activeVideoEdu.id);
      const currentProgress = userEduStatus?.progress || 0;
      
      // Ref 초기 진행률 동기화
      lastUpdatedProgressRef.current = currentProgress;
      
      if (currentProgress > 0 && currentProgress < 100) {
        const resumeTime = duration * (currentProgress / 100);
        videoRef.current.currentTime = resumeTime;
        maxTimeWatched.current = resumeTime;
        setVideoCurrentTime(resumeTime);
        console.log(`Resumed playback at progress ${currentProgress}% (${resumeTime}s)`);
      } else {
        videoRef.current.currentTime = 0;
        maxTimeWatched.current = 0;
        setVideoCurrentTime(0);
      }
    }
  };

  const togglePlay = () => {
    const youtubeUrl = getYoutubeEmbedUrl(videoSrc);
    if (youtubeUrl && youtubePlayerRef.current) {
      const player = youtubePlayerRef.current;
      if (typeof player.getPlayerState === 'function') {
        const state = player.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) {
          player.pauseVideo();
          setIsPlaying(false);
        } else {
          player.playVideo();
          setIsPlaying(true);
        }
      }
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Play failed:", err);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && activeVideoEdu) {
      const { currentTime, duration } = videoRef.current;
      setVideoCurrentTime(currentTime);
      
      // 건너뛰기 시도 감지 (최대 시청 기록보다 1.5초 이상 앞서가면 강제 되돌림)
      if (currentTime > maxTimeWatched.current + 1.5) {
        videoRef.current.currentTime = maxTimeWatched.current;
        setVideoCurrentTime(maxTimeWatched.current);
        return;
      }

      // 정상 시청 중일 때만 최대 시청 시간 기록 업데이트
      if (currentTime > maxTimeWatched.current) {
        maxTimeWatched.current = currentTime;
      }

      if (duration > 0) {
        const progress = Math.floor((maxTimeWatched.current / duration) * 100);
        
        // 렉 방지 및 클로저 버그 예방을 위해 Ref 값과 비교하여 진행률(%)이 상승할 때만 updateProgress 호출
        if (progress > lastUpdatedProgressRef.current && progress <= 100) {
          lastUpdatedProgressRef.current = progress;
          updateProgress(currentUser.id, activeVideoEdu.id, progress);
        }
      }
    }
  };

  const handleSeeking = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime > maxTimeWatched.current + 1) {
        videoRef.current.currentTime = maxTimeWatched.current;
      }
    }
  };

  const handleVideoEnded = () => {
    if (!activeVideoEdu) return;

    // 만약 전체화면 상태라면 안전하게 전체화면 해제 (브라우저 먹통 현상 방지)
    if (document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (err) {
        console.error("Failed to exit fullscreen:", err);
      }
    }

    updateProgress(currentUser.id, activeVideoEdu.id, 100);
    setActiveVideoEdu(prev => prev ? { ...prev, progress: 100 } : null);
    setIsPlaying(false);
    setShowQuiz(true);
  };

  const getPassingScore = (total) => {
    if (!activeVideoEdu) return 0;
    const cutLine = activeVideoEdu.cutLine || 60; // 기본값 60점
    return Math.ceil((total * cutLine) / 100);
  };

  const handleQuizNext = () => {
    if (selectedQuizOption === null) {
      alert('정답을 선택해주세요.');
      return;
    }
    
    const quizzes = activeVideoEdu.quizzes || (activeVideoEdu.quiz ? [activeVideoEdu.quiz] : []);
    const currentQuiz = quizzes[currentQuizIndex];

    if (!currentQuiz) {
      alert('퀴즈 데이터를 불러올 수 없습니다.');
      return;
    }

    const newAnswers = [...userAnswers, selectedQuizOption];
    setUserAnswers(newAnswers);
    
    if (currentQuizIndex + 1 < quizzes.length) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedQuizOption(null);
    } else {
      // 마지막 문제 완료 -> 결과창 노출
      setShowQuizResults(true);
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f7f8fa', minHeight: '100vh', position: 'relative' }}>
      {/* 동영상 및 퀴즈 모달 */}
      {activeVideoEdu && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #efefef' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeVideoEdu.title}
            </h3>
            <X size={24} onClick={closeVideoModal} style={{ cursor: 'pointer', color: '#555' }} />
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f9fafb' }}>
            {!showQuiz ? (() => {
              const youtubeUrl = getYoutubeEmbedUrl(videoSrc);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div 
                    ref={videoContainerRef} 
                    style={{ 
                      width: '100%', 
                      backgroundColor: 'black', 
                      borderRadius: isFullscreen ? '0' : '12px', 
                      overflow: 'hidden', 
                      position: 'relative', 
                      aspectRatio: isFullscreen ? 'none' : '16/9', 
                      height: isFullscreen ? '100%' : 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {/* 실제 동영상 플레이어 */}
                    {videoSrc ? (
                      youtubeUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <div ref={youtubeContainerRef} style={{ width: '100%', height: '100%' }} />
                          <div 
                            onClick={togglePlay}
                            style={{ 
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 44,
                              backgroundColor: isPlaying ? 'transparent' : 'rgba(0,0,0,0.3)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              cursor: 'pointer', zIndex: 5 
                            }}
                          >
                            {!isPlaying && <PlayCircle size={60} color="white" style={{ opacity: 0.8 }} />}
                          </div>
                          <div style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, 
                            backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '10px 16px', 
                            display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10
                          }}>
                            <button 
                              type="button" 
                              onClick={togglePlay} 
                              style={{ 
                                background: 'none', border: 'none', color: 'white', cursor: 'pointer', 
                                fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' 
                              }}
                            >
                              {isPlaying ? "일시정지" : "재생"}
                            </button>
                            
                            <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%`, 
                                height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px'
                              }} />
                            </div>

                            <span style={{ color: 'white', fontSize: '11px', fontFamily: 'monospace' }}>
                              {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                            </span>

                            <button
                              type="button"
                              onClick={handleFullscreen}
                              style={{
                                background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '2px'
                              }}
                            >
                              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video 
                            ref={videoRef}
                            src={videoSrc}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={handleVideoEnded}
                            onClick={togglePlay}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                          />
                          {!isPlaying && (
                            <div 
                              onClick={togglePlay}
                              style={{ 
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', 
                                justifyContent: 'center', cursor: 'pointer', zIndex: 5
                              }}
                            >
                              <PlayCircle size={60} color="white" style={{ opacity: 0.8 }} />
                            </div>
                          )}
                          <div style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, 
                            backgroundColor: 'rgba(15, 23, 42, 0.85)', padding: '10px 16px', 
                            display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10
                          }}>
                            <button 
                              type="button" 
                              onClick={togglePlay} 
                              style={{ 
                                background: 'none', border: 'none', color: 'white', cursor: 'pointer', 
                                fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' 
                              }}
                            >
                              {isPlaying ? "일시정지" : "재생"}
                            </button>
                            
                            <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%`, 
                                height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px'
                              }} />
                            </div>

                            <span style={{ color: 'white', fontSize: '11px', fontFamily: 'monospace' }}>
                              {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                            </span>

                            <button
                              type="button"
                              onClick={handleFullscreen}
                              style={{
                                background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '2px'
                              }}
                            >
                              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', backgroundColor: '#1e293b' }}>
                        동영상을 불러오는 중...
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>학습 내용</h4>
                    <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px', lineHeight: 1.6 }}>
                      이 과정은 '{activeVideoEdu.title}'에 대한 필수 교육입니다. 
                      영상을 끝까지 시청하시면 진행률이 100%가 되며, 이후 나타나는 퀴즈를 맞히셔야 최종 이수 처리가 됩니다.
                    </p>
                  </div>
                </div>
              );
            })()
            : (!showQuizResults ? (() => {
              const quizzes = activeVideoEdu.quizzes || (activeVideoEdu.quiz ? [activeVideoEdu.quiz] : []);
              const currentQuiz = quizzes[currentQuizIndex];

              if (!currentQuiz || !currentQuiz.question || !Array.isArray(currentQuiz.options) || currentQuiz.options.length === 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', backgroundColor: 'white', borderRadius: '16px' }}>
                    <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '12px' }}>⚠️ 퀴즈 데이터를 불러올 수 없습니다.</div>
                    <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>
                      설정된 퀴즈가 없거나 형식이 올바르지 않습니다.<br/>관리자 페이지에서 교육 과정의 퀴즈를 다시 설정해주세요.
                    </div>
                    <button type="button" onClick={closeVideoModal} style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      돌아가기
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}>
                  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>
                      <CheckCircle size={20} /> 확인 퀴즈 ({currentQuizIndex + 1} / {quizzes.length})
                    </div>
                    <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', lineHeight: 1.5, color: '#111' }}>
                      Q. {currentQuiz.question}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {currentQuiz.options.map((option, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedQuizOption(idx)}
                          style={{ 
                            padding: '16px', 
                            border: selectedQuizOption === idx ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                            borderRadius: '12px',
                            backgroundColor: selectedQuizOption === idx ? '#f3e8ff' : 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ 
                            width: '20px', height: '20px', borderRadius: '50%', 
                            border: selectedQuizOption === idx ? '6px solid var(--primary)' : '2px solid #ccc',
                            boxSizing: 'border-box'
                          }}></div>
                          <span style={{ fontSize: '15px', color: selectedQuizOption === idx ? 'var(--primary)' : '#333', fontWeight: selectedQuizOption === idx ? 'bold' : 'normal' }}>
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={handleQuizNext}
                      style={{ 
                        width: '100%', padding: '16px', marginTop: '32px', 
                        backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', 
                        fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {currentQuizIndex + 1 < quizzes.length ? '다음 문제 풀기' : '정답 제출하기'}
                    </button>
                  </div>
                </div>
              );
            })()
            : (() => {
              const quizzes = activeVideoEdu.quizzes || (activeVideoEdu.quiz ? [activeVideoEdu.quiz] : []);
              
              // 각 문제별 정답 일치 여부 계산
              let correctCount = 0;
              const resultsList = quizzes.map((q, idx) => {
                const isCorrect = userAnswers[idx] === q.answer;
                if (isCorrect) correctCount += 1;
                return {
                  question: q.question,
                  isCorrect,
                  userAnswerText: q.options[userAnswers[idx]] || '선택 안 함',
                  correctAnswerText: q.options[q.answer]
                };
              });

              const passingScore = getPassingScore(quizzes.length);
              const isPassed = correctCount >= passingScore;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                  <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111' }}>퀴즈 결과</h4>
                      <div style={{ fontSize: '28px', fontWeight: 'extrabold', color: isPassed ? '#16a34a' : '#ef4444', margin: '12px 0' }}>
                        {correctCount} / {quizzes.length} 문제 정답
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        이수 기준: {activeVideoEdu.cutLine || 60}점 이상 ({passingScore}문제 이상 정답)
                      </div>
                      <div style={{ 
                        marginTop: '16px', padding: '12px', borderRadius: '10px', 
                        backgroundColor: isPassed ? '#dcfce7' : '#fee2e2', 
                        color: isPassed ? '#15803d' : '#b91c1c', 
                        fontWeight: 'bold', fontSize: '14px'
                      }}>
                        {isPassed ? '🎉 축하합니다! 교육 이수 기준을 충족했습니다.' : '⚠️ 점수가 기준에 미달하여 이수 처리가 되지 않았습니다.'}
                      </div>
                    </div>

                    {/* O/X 상세 리스트 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '4px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', margin: '16px 0' }}>
                      {resultsList.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ flex: 1, paddingRight: '8px', minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                              {idx + 1}번 문제
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              선택: {res.userAnswerText}
                            </div>
                          </div>
                          <div style={{ 
                            fontSize: '18px', fontWeight: 'extrabold', 
                            color: res.isCorrect ? '#16a34a' : '#ef4444',
                            width: '30px', height: '30px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: res.isCorrect ? '#dcfce7' : '#fee2e2',
                            flexShrink: 0
                          }}>
                            {res.isCorrect ? 'O' : 'X'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {isPassed ? (
                      <button 
                        onClick={() => {
                          takeCourse(currentUser.id, activeVideoEdu.id);
                          closeVideoModal();
                        }}
                        style={{ 
                          width: '100%', padding: '16px', 
                          backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', 
                          fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                          boxSizing: 'border-box'
                        }}
                      >
                        이수 완료하기
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          // Reset quiz states for retry
                          setCurrentQuizIndex(0);
                          setSelectedQuizOption(null);
                          setUserAnswers([]);
                          setShowQuizResults(false);
                        }}
                        style={{ 
                          width: '100%', padding: '16px', 
                          backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', 
                          fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          boxSizing: 'border-box'
                        }}
                      >
                        퀴즈 다시 풀기
                      </button>
                    )}
                  </div>
                </div>
              );
            })())}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header" style={{ borderBottom: '1px solid #efefef', backgroundColor: 'white' }}>
        <ArrowLeft className="header-icon" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <BookOpen size={18} /> 교육 관리
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="main-content" style={{ padding: '16px' }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 12px', border:'none', borderRadius:'8px', backgroundColor:'#4b5563', color:'white', fontWeight:'bold', cursor:'pointer' }}>
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary)' }}>
          <div 
            onClick={() => setActiveTab('교육현황')}
            style={{ flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '교육현황' ? 'var(--primary)' : 'white', color: activeTab === '교육현황' ? 'white' : 'var(--primary)', fontWeight: 'bold' }}>
            <BookOpen size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 교육현황
          </div>
          <div 
            onClick={() => setActiveTab('교육결과현황')}
            style={{ flex: 1, textAlign: 'center', padding: '10px', cursor: 'pointer', backgroundColor: activeTab === '교육결과현황' ? 'var(--primary)' : 'white', color: activeTab === '교육결과현황' ? 'white' : 'var(--primary)', fontWeight: 'bold' }}>
            <BookOpen size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 교육결과현황
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayEducations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>해당하는 교육 내역이 없습니다.</div>
          ) : (
            displayEducations.map(edu => (
              <div key={edu.id} className="card" style={{ padding: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--primary)', marginBottom: '16px' }}>
                  {edu.title}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', fontSize: '14px', marginBottom: '16px' }}>
                  <div style={{ color: '#888' }}>교육시작일:</div>
                  <div style={{ textAlign: 'right' }}>{edu.startDate}</div>
                  
                  <div style={{ color: '#888' }}>교육종료일:</div>
                  <div style={{ textAlign: 'right' }}>{edu.endDate}</div>
                  
                  <div style={{ color: '#888' }}>교육진행율:</div>
                  <div style={{ textAlign: 'right' }}>{edu.progress}%</div>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{ width: `${edu.progress}%`, height: '100%', backgroundColor: edu.progress === 100 ? '#10b981' : 'var(--primary)', transition: 'width 0.5s ease-in-out' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#888', fontSize: '14px' }}>수료여부:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ backgroundColor: edu.status === '수료' ? '#dcfce7' : '#fef3c7', color: edu.status === '수료' ? '#16a34a' : '#d97706', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {edu.status}
                    </span>
                    {edu.status !== '수료' && (
                      <button onClick={() => handleTakeCourse(edu)} style={{ padding: '8px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlayCircle size={16} /> 수강하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Education;

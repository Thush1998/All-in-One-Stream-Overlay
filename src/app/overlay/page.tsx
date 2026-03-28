'use client';

import { useSync, ChatEvent } from '@/lib/useSync';
import { useState, useEffect, useRef } from 'react';
import styles from './overlay.module.css';

function useAudioResponsive(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let source: MediaStreamAudioSourceNode;
    let animationId: number;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(dataArray as any);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const average = sum / dataArray.length;
          
          // Make it much more sensitive! (Normal talking average is around 10-30)
          const dynamicScale = 1 + (average / 20) * 2;
          
          if (ref.current) {
            ref.current.style.setProperty('--audio-scale', String(Math.min(dynamicScale, 4)));
          }

          animationId = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.error("Microphone access denied or error:", err);
      }
    };
    
    startAudio();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext) audioContext.close();
    };
  }, [ref]);
}

export default function Overlay() {
  const { state } = useSync();
  const facecamRef = useRef<HTMLDivElement>(null);
  useAudioResponsive(facecamRef);
  const [showVictory, setShowVictory] = useState(false);
  const [lastVictoryTrigger, setLastVictoryTrigger] = useState(0);

  // Chat Popup state
  const [activeChat, setActiveChat] = useState<ChatEvent | null>(null);

  useEffect(() => {
    // Check Victory Trigger
    if (state.triggerVictory > lastVictoryTrigger) {
      setShowVictory(true);
      setLastVictoryTrigger(state.triggerVictory);
      setTimeout(() => setShowVictory(false), 4000);
    }
  }, [state.triggerVictory, lastVictoryTrigger]);

  useEffect(() => {
    if (state.chatEvent && state.chatEvent.id !== activeChat?.id) {
      setActiveChat(state.chatEvent);
      // Auto-hide popup after 4.5 seconds (matches css animation duration)
      setTimeout(() => setActiveChat(null), 4500);
    }
  }, [state.chatEvent, activeChat]);

  const percentage = Math.min(
    100,
    (state.subscriberCount / (state.subscriberGoal || 1)) * 100
  );

  const goalReached = percentage >= 100;

  // Render dummy fireworks particles
  const renderFireworks = (count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const tx = (Math.random() - 0.5) * 800 + 'px';
      const ty = (Math.random() - 0.5) * 800 + 'px';
      return (
        <div 
          key={i} 
          className={styles.glimmer} 
          style={{ '--tx': tx, '--ty': ty, left: '50%', top: '50%' } as any}
        />
      );
    });
  };

  return (
    <div className={styles.overlayContainer}>
      
      {/* Live Social Ticker */}
      <div className={styles.tickerContainer}>
        <div className={styles.tickerWrapper}>
          {[1, 2].map((loop) => (
            <div key={loop} style={{display:'inline-flex'}}>
              <div className={styles.tickerItem}>
                <span>▶</span><span>{state.socialHandles?.youtube || '/DragXQueen'}</span>
              </div>
              <div className={`${styles.tickerItem} ${styles.pink}`}>
                <span>📷</span><span>{state.socialHandles?.instagram || '@DragXQueenIG'}</span>
              </div>
              <div className={styles.tickerItem}>
                <span>f</span><span>{state.socialHandles?.facebook || '/DragXQueenGaming'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Subscriber Goal Box */}
      <div className={`${styles.goalBox} ${goalReached ? styles.completed : ''}`}>
        <div className={styles.goalTitle}>
          {goalReached ? 'Subscriber Goal Reached!' : 'Subscriber Goal'}
        </div>
        <div className={styles.goalNumbers}>
          <span>{state.subscriberCount}</span>
          <span>{state.subscriberGoal}</span>
        </div>
        <div className={styles.barContainer}>
          <div className={styles.barFill} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>

      {/* Goal Reached Fireworks */}
      {goalReached && (
        <div className={styles.fireworksOverlay}>
          <div className={styles.goalReachedText}>GOAL REACHED!</div>
          {renderFireworks(20)}
        </div>
      )}

      {/* Interactive Chat Popup */}
      {activeChat && (
        <div key={activeChat.id} className={`${styles.chatPopup} ${activeChat.text.toLowerCase() === 'queen' ? styles.queenAlert : ''}`}>
          <div className={styles.chatIcon}>
            {activeChat.text.toLowerCase() === 'queen' ? '👑' : '🔥'}
          </div>
          <div className={styles.chatContent}>
            <h4>NEW ALERT</h4>
            <p>"{activeChat.text}" in chat!</p>
          </div>
        </div>
      )}

      {/* Dynamic Logo Upload Box */}
      {state.logoDataUrl && (
        <div className={styles.logoContainer}>
          <img 
            src={state.logoDataUrl}
            alt="Stream Logo"
          />
        </div>
      )}

      {/* Animated Audio-Reactive Facecam Frame */}
      <div 
        ref={facecamRef}
        className={styles.facecamContainer} 
      >
        <div className={styles.facecamText}>DragXQueen</div>
      </div>

      {/* Full-Screen Victory Animation Area */}
      <div className={`${styles.victoryOverlay} ${showVictory ? styles.active : ''}`}>
        {showVictory && (
          <div className={styles.fireworksOverlay} style={{zIndex: 0}}>
            {renderFireworks(40)}
          </div>
        )}
        <div className={styles.victoryText}>VICTORY</div>
      </div>

    </div>
  );
}

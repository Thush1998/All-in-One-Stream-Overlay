'use client';

import { useSync, ChatEvent, SupporterSpotlight, BgmiAlertKey, PlatformKey, Corner, SocialSlot } from '@/lib/useSync';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/app/overlay/overlay.module.css';

/* ── Platform Icon Map ────────────────────────────────────────── */
const PLATFORM_ICONS: Record<PlatformKey, string> = {
  youtube:  '▶',
  twitch:   '🟣',
  discord:  '💬',
  twitter:  '𝕏',
  tiktok:   '🎵',
  gameid:   '🎮',
};
const PLATFORM_COLORS: Record<PlatformKey, string> = {
  youtube:  '#ff0000',
  twitch:   '#9147ff',
  discord:  '#92a3ff', // Brighter for better readability on dark/glass backgrounds
  twitter:  '#1da1f2',
  tiktok:   '#ff0050',
  gameid:   '#00f3ff',
};

/* ── SFX ──────────────────────────────────────────────────────── */
function playHighlightSFX() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (_) {}
}

/* ── Audio Hook (auto-start, OBS-compatible, no click gate) ─────── */
function useAudioResponsive(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let audioCtx: AudioContext;
    let animationId: number;
    let fallbackNode: ConstantSourceNode | null = null;

    const startAudio = async () => {
      try {
        // Step 1 — Create AudioContext immediately (no user gesture needed in OBS WebKit)
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Step 2 — OBS fix: force-resume if the context starts suspended
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Step 3 — Provide a silent fallback source so the visualiser loop always runs.
        //           In OBS, mic audio flows through the host app, not the browser mic API.
        //           The fallback keeps the facecam border animation alive without any data.
        fallbackNode = audioCtx.createConstantSource();
        fallbackNode.offset.value = 0; // silent — produces no audible output
        fallbackNode.connect(analyser);
        fallbackNode.start();

        // Step 4 — Silently attempt real mic capture (works in OBS if "Use custom audio device" is on).
        //           If denied, we simply keep the silent fallback — no prompt, no crash.
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((stream) => {
            if (!audioCtx || audioCtx.state === 'closed') return;
            // Disconnect silent fallback now that we have real audio
            fallbackNode?.disconnect();
            fallbackNode?.stop();
            fallbackNode = null;

            const micSource = audioCtx.createMediaStreamSource(stream);
            // Route mic → analyser only; do NOT connect to destination (avoids feedback loop)
            micSource.connect(analyser);
          })
          .catch(() => {
            // No mic access — silent fallback continues; overlay is unaffected
          });

        // Step 5 — Animation tick: read frequency data and drive CSS variable
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, v) => a + v, 0) / dataArray.length;
          if (ref.current) {
            ref.current.style.setProperty(
              '--audio-scale',
              String(Math.min(1 + (avg / 20) * 2, 4))
            );
          }
          animationId = requestAnimationFrame(tick);
        };
        tick();
      } catch (_) {
        // Complete failure (e.g. no Web Audio support) — overlay renders normally without audio
      }
    };

    startAudio();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      try { fallbackNode?.stop(); } catch (_) {}
      if (audioCtx) audioCtx.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ── Lottie Burst ─────────────────────────────────────────────── */
function LottieBurst({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  useEffect(() => {
    if (!active || !containerRef.current) return;
    import('lottie-web').then((lottie) => {
      import('@/lib/starBurst').then(({ default: animData }) => {
        if (animRef.current) animRef.current.destroy();
        if (!containerRef.current) return;
        animRef.current = lottie.default.loadAnimation({
          container: containerRef.current, renderer: 'svg', loop: false, autoplay: true, animationData: animData,
        });
      });
    });
    return () => { if (animRef.current) { animRef.current.destroy(); animRef.current = null; } };
  }, [active]);
  return <div ref={containerRef} className={styles.lottieContainer} />;
}

/* ── Social Slot Cycling Ticker ───────────────────────────────── */
function SocialTicker({ slots, variant }: { slots: SocialSlot[]; variant: 'landscape' | 'portrait' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const slotsTyped = slots;

  useEffect(() => {
    if (slotsTyped.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % slotsTyped.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [slotsTyped.length]);

  if (!slotsTyped.length) return null;
  const slot = slotsTyped[activeIndex];
  if (!slot) return null;

  const containerClass = variant === 'landscape' ? styles.tickerContainer : styles.tickerContainerPortrait;

  return (
    <div className={containerClass}>
      <div
        className={`${styles.socialSlotDisplay} ${visible ? styles.slotVisible : styles.slotHidden}`}
        style={{ '--slot-color': PLATFORM_COLORS[slot.platform] } as any}
      >
        <span className={styles.slotIcon}>{PLATFORM_ICONS[slot.platform]}</span>
        <span className={styles.slotHandle}>{slot.handle}</span>
      </div>
    </div>
  );
}

/* ── Stats Bar ────────────────────────────────────────────────── */
function StatsBar({ killCount, finishes, dayWins, variant, visible }: {
  killCount: number; finishes: number; dayWins: number; variant: 'landscape' | 'portrait'; visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div className={variant === 'landscape' ? styles.statsBar : styles.statsBarPortrait}>
      <div className={styles.statPill}>
        <span className={styles.statIcon}>💀</span>
        <span className={styles.statLabel}>KILLS</span>
        <span className={styles.statValue}>{killCount}</span>
      </div>
      <div className={`${styles.statPill} ${styles.statPillPink}`}>
        <span className={styles.statIcon}>🐔</span>
        <span className={styles.statLabel}>FINISHES</span>
        <span className={styles.statValue}>{finishes}</span>
      </div>
      <div className={`${styles.statPill} ${styles.statPillGreen}`}>
        <span className={styles.statIcon}>🏆</span>
        <span className={styles.statLabel}>WINS</span>
        <span className={styles.statValue}>{dayWins}</span>
      </div>
    </div>
  );
}

/* ── Static Support Card ──────────────────────────────────────── */
function SupportCard({ details, qrCodeUrl, showQrCode, variant }: { details: { gpay: string; paytm: string }, qrCodeUrl: string, showQrCode: boolean, variant: 'landscape' | 'portrait' }) {
  if (!details.gpay && !details.paytm && (!showQrCode || !qrCodeUrl)) return null;
  return (
    <div className={variant === 'landscape' ? styles.supportCard : styles.supportCardPortrait}>
      <div className={styles.supportHeader}>💸 SUPPORT THE STREAM</div>
      <div className={styles.supportBody}>
        <div className={styles.supportDetails}>
          {details.gpay && <div className={styles.supportLine}><span className={styles.supportIcon}>💳</span> GPay: <span className={styles.supportHighlight}>{details.gpay}</span></div>}
          {details.paytm && <div className={styles.supportLine}><span className={styles.supportIcon}>📱</span> Paytm: <span className={styles.supportHighlight}>{details.paytm}</span></div>}
        </div>
        {showQrCode && qrCodeUrl && (
          <div className={styles.supportQr}>
            <img src={qrCodeUrl} alt="QR Code" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Latest Events ────────────────────────────────────────────── */
function LatestEvents({ latestSub, topDonor, latestSuperchat, latestGpaySupport, latestPaytmSupport }: { latestSub: string; topDonor: string, latestSuperchat: string, latestGpaySupport: string, latestPaytmSupport: string }) {
  if (!latestSub && !topDonor && !latestSuperchat && !latestGpaySupport && !latestPaytmSupport) return null;
  return (
    <div className={styles.latestEventsBox}>
      {latestSub && <div className={styles.eventRow}><span className={styles.eventIcon}>🌟</span> <span className={styles.eventLabel}>NEW SUB:</span> <span className={styles.eventValue}>{latestSub}</span></div>}
      {topDonor && <div className={styles.eventRow}><span className={styles.eventIcon}>💎</span> <span className={styles.eventLabel}>TOP DONOR:</span> <span className={styles.eventValue}>{topDonor}</span></div>}
      {latestSuperchat && <div className={styles.eventRow}><span className={styles.eventIcon}>🔥</span> <span className={styles.eventLabel}>SUPERCHAT:</span> <span className={styles.eventValue}>{latestSuperchat}</span></div>}
      {latestGpaySupport && <div className={styles.eventRow}><span className={styles.eventIcon}>💳</span> <span className={styles.eventLabel}>GPAY SUPPORT:</span> <span className={styles.eventValue}>{latestGpaySupport}</span></div>}
      {latestPaytmSupport && <div className={styles.eventRow}><span className={styles.eventIcon}>📱</span> <span className={styles.eventLabel}>PAYTM SUPPORT:</span> <span className={styles.eventValue}>{latestPaytmSupport}</span></div>}
    </div>
  );
}

/* ── BGMI Alert Overlay ───────────────────────────────────────── */
const BGMI_ALERT_CONFIG: Record<BgmiAlertKey, { label: string; sub: string; class: string }> = {
  squadwipe: { label: 'SQUAD WIPE',      sub: '4 enemies eliminated!',  class: styles.alertSquadWipe },
  clutch:    { label: 'PURE CLUTCH',     sub: '1v4 situation survived!', class: styles.alertClutch },
  reflexes:  { label: 'INSANE REFLEXES', sub: 'Impossible shot landed!', class: styles.alertReflexes },
  chicken:   { label: 'CHICKEN DINNER',  sub: 'Winner Winner!',          class: styles.alertChicken },
};

function BgmiAlert({ alertKey }: { alertKey: BgmiAlertKey }) {
  const cfg = BGMI_ALERT_CONFIG[alertKey];
  return (
    <div className={`${styles.highlightOverlay} ${cfg.class}`}>
      <div className={`${styles.highlightCard}`}>
        <div className={styles.highlightGlow} />
        <div className={styles.highlightLines}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.highlightLine} style={{ '--line-angle': `${i * 45}deg` } as any} />
          ))}
        </div>
        <div className={styles.highlightText}>{cfg.label}</div>
        <div className={styles.highlightSub}>{cfg.sub}</div>
        {alertKey === 'chicken' && (
          <div className={styles.chickenParticles}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.chickenParticle} style={{ '--p-angle': `${i * 30}deg`, '--p-delay': `${i * 0.08}s` } as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Facecam Corner Class Map ────────────────────────────────── */
const CORNER_CLASS: Record<Corner, string> = {
  tl: styles.facecamTL,
  tr: styles.facecamTR,
  bl: styles.facecamBL,
  br: styles.facecamBR,
};

/* ── Stream State Takeover Component ──────────────────────────── */
function StreamStateTakeover({ type, logoUrl, socialSlots }: { type: 'starting'|'paused'|'ending', logoUrl: string, socialSlots: SocialSlot[] }) {
  let title = '';
  if (type === 'starting') title = 'STREAM STARTING SOON';
  if (type === 'paused') title = 'BE RIGHT BACK';
  if (type === 'ending') title = 'THANKS FOR WATCHING';

  return (
    <motion.div
      className={styles.streamStateOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {logoUrl && <img src={logoUrl} alt="Brand" className={`${styles.streamStateLogo} ${type === 'paused' ? styles.streamStatePulse : ''}`} />}
      <div className={`${styles.streamStateTitle} ${type === 'paused' ? styles.streamStatePulse : ''}`}>
        {title}
      </div>
      {type === 'ending' && (
        <div className={styles.streamStateBrands}>
          {socialSlots.slice(0, 3).map(s => (
            <div key={s.id} className={styles.streamStateBrand}>
              <span style={{ color: PLATFORM_COLORS[s.platform] }}>{PLATFORM_ICONS[s.platform]}</span> {s.handle}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Main Overlay ─────────────────────────────────────────────── */
export default function OverlayView({ layout = 'landscape' }: { layout?: 'landscape' | 'portrait' }) {
  const { state } = useSync();
  const facecamRef = useRef<HTMLDivElement>(null);
  useAudioResponsive(facecamRef);

  const [showVictory, setShowVictory]         = useState(false);
  const [lastVictoryTrigger, setLVT]          = useState(0);
  const [activeBgmiAlert, setActiveBgmiAlert] = useState<BgmiAlertKey | null>(null);
  const [lastHighlightTrigger, setLHT]        = useState(0);
  const [activeSpotlight, setActiveSpotlight] = useState<SupporterSpotlight | null>(null);
  const [lastSpotlightId, setLSI]             = useState(0);
  const [activeChat, setActiveChat]           = useState<ChatEvent | null>(null);
  const [pulseSub, setPulseSub]               = useState(false);

  // Dynamic Scale calculation for preview
  const isPortrait = layout === 'portrait';
  const BASE_WIDTH = isPortrait ? 1080 : 1920;
  const BASE_HEIGHT = isPortrait ? 1920 : 1080;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [BASE_WIDTH, BASE_HEIGHT]);

  // Pulse animation trigger on subscriber change
  useEffect(() => {
    if (state.subscriberCount > 0) {
      setPulseSub(true);
      const timer = setTimeout(() => setPulseSub(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.subscriberCount]);

  useEffect(() => {
    const tv = Number(state.triggerVictory) || 0;
    if (tv > lastVictoryTrigger) {
      setShowVictory(true); setLVT(tv);
      setTimeout(() => setShowVictory(false), 4000);
    }
  }, [state.triggerVictory, lastVictoryTrigger]);

  useEffect(() => {
    const th = Number(state.triggerHighlight) || 0;
    if (th > lastHighlightTrigger && state.bgmiAlert) {
      setActiveBgmiAlert(state.bgmiAlert);
      setLHT(th);
      playHighlightSFX();
      setTimeout(() => setActiveBgmiAlert(null), 3500);
    }
  }, [state.triggerHighlight, lastHighlightTrigger, state.bgmiAlert]);

  useEffect(() => {
    const sp = state.supporterSpotlight;
    if (sp && sp.id !== lastSpotlightId) {
      setActiveSpotlight(sp); setLSI(sp.id);
      setTimeout(() => setActiveSpotlight(null), 6000);
    }
  }, [state.supporterSpotlight, lastSpotlightId]);

  useEffect(() => {
    if (state.chatEvent && state.chatEvent.id !== activeChat?.id) {
      setActiveChat(state.chatEvent);
      setTimeout(() => setActiveChat(null), 4500);
    }
  }, [state.chatEvent, activeChat]);

  const percentage = Math.min(100, ((Number(state.subscriberCount) || 0) / (Number(state.subscriberGoal) || 1)) * 100);
  const goalReached = percentage >= 100;

  const renderFireworks = (count: number) =>
    Array.from({ length: count }).map((_, i) => {
      const tx = (Math.random() - 0.5) * 800 + 'px';
      const ty = (Math.random() - 0.5) * 800 + 'px';
      return <div key={i} className={styles.glimmer} style={{ '--tx': tx, '--ty': ty, left: '50%', top: '50%' } as any} />;
    });

  const { fontFamily, facecamCorner, newsTickerText, socialSlots, showBgmiStats, dayWins } = state;
  // Guard nested objects — they can be undefined if the API returned partial/corrupt state
  const themeColors   = state.themeColors   ?? { primary: '#00f3ff', secondary: '#ff0055' };
  const donationDetails = state.donationDetails ?? { gpay: '', paytm: '', superchat: '' };

  // Dynamic theming via inline CSS variables
  const themeStyle = {
    '--neon-cyan':      themeColors.primary,
    '--neon-cyan-glow': themeColors.primary + '99',
    '--neon-pink':      themeColors.secondary,
    '--neon-pink-glow': themeColors.secondary + '99',
    fontFamily: `'${fontFamily ?? 'Rajdhani'}', 'Rajdhani', 'Inter', sans-serif`,
  } as React.CSSProperties;

  const cornerClass = CORNER_CLASS[facecamCorner] || styles.facecamBR;

  // Smart Layout Adjustments
  const goalBoxStyle = facecamCorner === 'tr' ? { top: '220px' } : {};
  const logoStyle    = facecamCorner === 'bl' ? { bottom: '220px' } : {};
  const chatStyle    = facecamCorner === 'bl' ? { bottom: '380px' } : {};

  return (
    <div className={styles.overlayWrapper}>
      <style>{`
        html, body { background: transparent !important; }
      `}</style>
      <div
        className={`${styles.overlayContainer} ${isPortrait ? styles.portrait : styles.landscape}`}
        style={{ ...themeStyle, transform: `scale(${scale})` } as any}
      >

      <AnimatePresence mode="wait">
        {state.streamState !== 'live' ? (
          <StreamStateTakeover key="takeover" type={state.streamState} logoUrl={state.logoDataUrl} socialSlots={state.socialSlots} />
        ) : (
        <motion.div
          key="live-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        >
          {/* ── Breaking News Ticker ──────────────────────────────── */}
      {newsTickerText && (
        <div className={styles.newsTicker}>
          <span className={styles.newsLabel}>⚡ BREAKING</span>
          <div className={styles.newsScrollWrapper}>
            <div className={styles.newsScrollContent}>
              {newsTickerText}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{newsTickerText}
            </div>
          </div>
        </div>
      )}

      {/* ── LANDSCAPE LAYOUT ──────────────────────────────────── */}
      {!isPortrait && (
        <>
          <div className={`${styles.goalBox} ${goalReached ? styles.completed : ''}`} style={goalBoxStyle}>
            <div className={styles.goalTitle}>{goalReached ? 'Goal Reached! 🎉' : 'Subscriber Goal'}</div>
            <div className={styles.goalNumbers}>
              <span className={pulseSub ? styles.numberPulse : ''}>{state.subscriberCount}</span>
              <span>{state.subscriberGoal}</span>
            </div>
            <div className={styles.barContainer}><div className={styles.barFill} style={{ width: `${percentage}%` }} /></div>
          </div>
          
          {/* Latest Events on Top-Center */}
          <div className={styles.latestEventsContainer}>
            <LatestEvents 
              latestSub={state.latestSubscriber} 
              topDonor={state.topDonor} 
              latestSuperchat={state.latestSuperchat}
              latestGpaySupport={state.latestGpaySupport}
              latestPaytmSupport={state.latestPaytmSupport}
            />
          </div>

          <StatsBar killCount={state.killCount} finishes={state.finishes} dayWins={dayWins} variant="landscape" visible={showBgmiStats} />

          {/* Socials on Bottom-Left */}
          <SocialTicker slots={socialSlots as any} variant="landscape" />

          {/* Logo on Top-Left or somewhere? The requirements didn't specify Logo for PC, but we can put it Top-Left */}
          <div className={styles.logoContainerLandscape}>
            {state.logoDataUrl && <img src={state.logoDataUrl} alt="Logo" />}
          </div>

          {/* Support Card above Facecam */}
          <div className={styles.supportCardContainerWrapper}>
            <SupportCard details={donationDetails} qrCodeUrl={state.qrCodeUrl} showQrCode={state.showQrCode} variant="landscape" />
          </div>

          {activeChat && (
            <div key={activeChat.id} className={`${styles.chatPopup} ${activeChat.text.toLowerCase() === 'queen' ? styles.queenAlert : ''}`} style={chatStyle}>
              <div className={styles.chatIcon}>{activeChat.text.toLowerCase() === 'queen' ? '👑' : '🔥'}</div>
              <div className={styles.chatContent}><h4>NEW ALERT</h4><p>&quot;{activeChat.text}&quot; in chat!</p></div>
            </div>
          )}

          {state.showFacecam && (
            <div ref={facecamRef} className={`${styles.facecamContainer} ${cornerClass}`}>
              <div className={styles.facecamText}>DragXQueen</div>
            </div>
          )}
        </>
      )}

      {/* ── PORTRAIT LAYOUT ───────────────────────────────────── */}
      {isPortrait && (
        <div className={styles.portraitInternalWrapper}>
          {/* Top Stack: Logo -> Facecam -> Goal -> Stats */}
          <div className={styles.portraitTopStack}>
            <div className={styles.portraitFacecamWrapper} style={{ position: 'relative', overflow: 'visible' }}>

              {state.showFacecam && (
                <div ref={facecamRef} className={`${styles.facecamContainer} ${styles.facecamPortrait}`}>
                  <div className={styles.facecamText}>DragXQueen</div>
                </div>
              )}
            </div>

            <div className={`${styles.goalBoxPortrait} ${goalReached ? styles.completed : ''}`}>
              <div className={styles.goalTitle}>{goalReached ? 'Goal Reached! 🎉' : 'Subscriber Goal'}</div>
              <div className={styles.goalNumbers}>
                <span className={pulseSub ? styles.numberPulse : ''}>{state.subscriberCount}</span>
                <span>{state.subscriberGoal}</span>
              </div>
              <div className={styles.barContainer}><div className={styles.barFill} style={{ width: `${percentage}%` }} /></div>
            </div>

            <StatsBar killCount={state.killCount} finishes={state.finishes} dayWins={dayWins} variant="portrait" visible={showBgmiStats} />
          </div>

          <div className={styles.portraitClearZone} />

          {/* Bottom Stack: Support Card -> Events -> Socials */}
          <div className={styles.portraitBottomStack}>
            {activeChat && (
              <div key={activeChat.id} className={`${styles.chatPopupPortrait} ${activeChat.text.toLowerCase() === 'queen' ? styles.queenAlert : ''}`}>
                <div className={styles.chatIcon}>{activeChat.text.toLowerCase() === 'queen' ? '👑' : '🔥'}</div>
                <div className={styles.chatContent}><h4>NEW ALERT</h4><p>&quot;{activeChat.text}&quot; in chat!</p></div>
              </div>
            )}

            <SupportCard details={donationDetails} qrCodeUrl={state.qrCodeUrl} showQrCode={state.showQrCode} variant="portrait" />
            <LatestEvents 
              latestSub={state.latestSubscriber} 
              topDonor={state.topDonor} 
              latestSuperchat={state.latestSuperchat}
              latestGpaySupport={state.latestGpaySupport}
              latestPaytmSupport={state.latestPaytmSupport}
            />
            <SocialTicker slots={socialSlots as any} variant="portrait" />
          </div>
        </div>
      )}

      {/* ── SHARED: Supporter Spotlight ─────────────────────── */}
      {activeSpotlight && (
        <div key={activeSpotlight.id} className={styles.supporterBanner}>
          <LottieBurst active={true} />
          <div className={styles.supporterInner}>
            <div className={styles.supporterCrown}>👑</div>
            <div className={styles.supporterLabel}>TOP SUPPORTER</div>
            <div className={styles.supporterName}>{activeSpotlight.name}</div>
            <div className={styles.supporterTagline}>Thank you for your love! 💖</div>
          </div>
        </div>
      )}

      {/* ── SHARED: BGMI Alert ───────────────────────────────── */}
      {activeBgmiAlert && <BgmiAlert alertKey={activeBgmiAlert} />}

      {/* ── SHARED: Victory ──────────────────────────────────── */}
      {goalReached && (
        <div className={styles.fireworksOverlay}>
          <div className={styles.goalReachedText}>GOAL REACHED!</div>
          {renderFireworks(20)}
        </div>
      )}
      <div className={`${styles.victoryOverlay} ${showVictory ? styles.active : ''}`}>
        {showVictory && <div className={styles.fireworksOverlay} style={{ zIndex: 0 }}>{renderFireworks(40)}</div>}
        <div className={styles.victoryText}>VICTORY</div>
      </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

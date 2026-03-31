'use client';

import { useSync, SocialSlot, PlatformKey, Corner, BgmiAlertKey } from '@/lib/useSync';
import { useState, useEffect, useRef } from 'react';
import styles from './dashboard.module.css';

// ── Constants ─────────────────────────────────────────────────
const PLATFORM_OPTIONS: { value: PlatformKey; label: string; icon: string }[] = [
  { value: 'youtube',  label: 'YouTube',    icon: '▶' },
  { value: 'twitch',   label: 'Twitch',     icon: '🟣' },
  { value: 'discord',  label: 'Discord',    icon: '💬' },
  { value: 'twitter',  label: 'Twitter/X',  icon: '𝕏' },
  { value: 'tiktok',   label: 'TikTok',     icon: '🎵' },
  { value: 'gameid',   label: 'Gaming ID',  icon: '🎮' },
];

const FONT_OPTIONS = [
  { value: 'Rajdhani',          label: 'Rajdhani (Default)' },
  { value: 'Orbitron',          label: 'Orbitron (Futuristic)' },
  { value: 'Exo 2',             label: 'Exo 2 (Sleek)' },
  { value: 'Bebas Neue',        label: 'Bebas Neue (Bold)' },
  { value: 'Oswald',            label: 'Oswald (Impact)' },
  { value: 'Play',              label: 'Play (Clean)' },
  { value: 'Russo One',         label: 'Russo One (Heavy)' },
  { value: 'Chakra Petch',      label: 'Chakra Petch (Tech)' },
  { value: 'Barlow Condensed',  label: 'Barlow Condensed (Tight)' },
  { value: 'Teko',              label: 'Teko (Display)' },
];

const CORNER_OPTIONS: { value: Corner; label: string }[] = [
  { value: 'tl', label: '↖ TL' },
  { value: 'tr', label: '↗ TR' },
  { value: 'bl', label: '↙ BL' },
  { value: 'br', label: '↘ BR' },
];

const BGMI_ALERTS: { key: BgmiAlertKey; label: string; color: string }[] = [
  { key: 'squadwipe', label: '💀 SQUAD WIPE',       color: '#ff2200' },
  { key: 'clutch',    label: '⚡ PURE CLUTCH',       color: '#00f3ff' },
  { key: 'reflexes',  label: '🔮 INSANE REFLEXES',  color: '#bf00ff' },
  { key: 'chicken',   label: '🐔 CHICKEN DINNER',   color: '#ffd700' },
];

// ── SFX helper ────────────────────────────────────────────────
function playAdminSFX() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12); osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch (_) {}
}

// ── Admin Page ────────────────────────────────────────────────
export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const landscapeFrameRef  = useRef<HTMLDivElement>(null);
  const portraitFrameRef   = useRef<HTMLDivElement>(null);
  const landscapeIframeRef = useRef<HTMLIFrameElement>(null);
  const portraitIframeRef  = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const scale = () => {
      if (landscapeFrameRef.current && landscapeIframeRef.current) {
        const w = landscapeFrameRef.current.clientWidth; const s = w / 1920;
        landscapeIframeRef.current.style.transform = `scale(${s})`;
        landscapeIframeRef.current.style.width = '1920px';
        landscapeIframeRef.current.style.height = `${Math.round(1080 * s)}px`;
        landscapeFrameRef.current.style.height = `${Math.round(1080 * s)}px`;
      }
      if (portraitFrameRef.current && portraitIframeRef.current) {
        const w = portraitFrameRef.current.clientWidth; const s = w / 1080;
        portraitIframeRef.current.style.transform = `scale(${s})`;
        portraitIframeRef.current.style.width = '1080px';
        portraitIframeRef.current.style.height = `${Math.round(1920 * s)}px`;
        portraitFrameRef.current.style.height = `${Math.round(1920 * s)}px`;
      }
    };
    scale(); window.addEventListener('resize', scale);
    return () => window.removeEventListener('resize', scale);
  }, [isAuthenticated]);

  const { state, updateState } = useSync('admin');
  const isHydrated = useRef(false);

  // Local editable copies
  const [localSubCount,  setLocalSubCount]  = useState('0');
  const [localGoal,      setLocalGoal]      = useState('100');
  const [logoDataUrl,    setLogoDataUrl]     = useState('');
  const [newsText,       setNewsText]        = useState('');
  const [fanName,        setFanName]         = useState('');
  const [sfxEnabled,     setSfxEnabled]      = useState(true);
  const [localSlots,     setLocalSlots]      = useState<SocialSlot[]>(state.socialSlots ?? []);
  const [localDonation,  setLocalDonation]   = useState(state.donationDetails ?? { gpay: '', paytm: '', superchat: '' });
  const [localLatestSub, setLocalLatestSub]  = useState(state.latestSubscriber || '');
  const [localTopDonor,  setLocalTopDonor]   = useState(state.topDonor || '');
  const [localLatestSuperchat, setLocalLatestSuperchat] = useState(state.latestSuperchat || '');
  const [localLatestGpay, setLocalLatestGpay] = useState(state.latestGpaySupport || '');
  const [localLatestPaytm, setLocalLatestPaytm] = useState(state.latestPaytmSupport || '');
  const [qrCodeDataUrl,  setQrCodeDataUrl]   = useState(state.qrCodeUrl || '');
  const [localChats,     setLocalChats]      = useState(state.customChats ?? []);

  useEffect(() => {
    // Only update local fields if we haven't hydrated yet AND the state actually has data
    if (isHydrated.current) return;
    
    // Check if state is non-empty (ignore default state if it's still being fetched)
    const hasData = state.subscriberCount !== 0 || state.newsTickerText !== '' || state.logoDataUrl !== '';
    if (!hasData) return;

    setLocalSubCount(state.subscriberCount?.toString() || '0');
    setLocalGoal(state.subscriberGoal?.toString() || '100');
    setLogoDataUrl(state.logoDataUrl || '');
    setQrCodeDataUrl(state.qrCodeUrl || '');
    setNewsText(state.newsTickerText || '');
    setLocalSlots(state.socialSlots ?? []);
    setLocalDonation({
      gpay:      state.donationDetails?.gpay      ?? '',
      paytm:     state.donationDetails?.paytm     ?? '',
      superchat: state.donationDetails?.superchat ?? '',
    });
    setLocalLatestSub(state.latestSubscriber || 'None');
    setLocalTopDonor(state.topDonor || 'None');
    setLocalLatestSuperchat(state.latestSuperchat || 'None');
    setLocalLatestGpay(state.latestGpaySupport || 'None');
    setLocalLatestPaytm(state.latestPaytmSupport || 'None');
    setLocalChats(state.customChats ?? []);
    
    isHydrated.current = true;
  }, [state]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('dxq_auth');
    if (loggedIn) setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { localStorage.setItem('dxq_auth','true'); setIsAuthenticated(true); setAuthError(false); }
    else setAuthError(true);
  };
  const handleLogout = () => { localStorage.removeItem('dxq_auth'); setIsAuthenticated(false); };

  // Social slot mutations
  const addSlot = () => setLocalSlots(prev => [...prev, { id: String(Date.now()), platform: 'youtube' as PlatformKey, handle: '' }]);
  const removeSlot = (id: string) => setLocalSlots(prev => prev.filter(s => s.id !== id));
  const updateSlot = (id: string, field: 'platform' | 'handle', val: string) =>
    setLocalSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  const pushSlots = () => updateState({ socialSlots: localSlots });

  // Custom Chats mutations
  const addChat = () => setLocalChats(prev => [...prev, { id: String(Date.now()), text: '' }]);
  const removeChat = (id: string) => setLocalChats(prev => prev.filter(c => c.id !== id));
  const updateChatText = (id: string, text: string) => setLocalChats(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  const pushChats = () => updateState({ customChats: localChats });

  // BGMI alert
  const fireAlert = (key: BgmiAlertKey) => {
    updateState({ bgmiAlert: key, triggerHighlight: (Number(state.triggerHighlight) || 0) + 1 });
    if (sfxEnabled) playAdminSFX();
  };

  // Steppers — Number() coercion prevents NaN if state arrives as string or undefined
  const changeKills    = (d: number) => updateState({ killCount: Math.max(0, (Number(state.killCount)   || 0) + d) });
  const changeFinishes = (d: number) => updateState({ finishes:  Math.max(0, (Number(state.finishes)    || 0) + d) });
  const changeDayWins  = (d: number) => updateState({ dayWins:   Math.max(0, (Number(state.dayWins)     || 0) + d) });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Keep logo under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Keep QR under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setQrCodeDataUrl(reader.result as string); updateState({ qrCodeUrl: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  // ── Login wall ────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.title} style={{ fontSize:'2rem', marginBottom:'1rem' }}>Restricted Access</h1>
          <form onSubmit={handleLogin} className={styles.inputGroup}>
            <input type="password" className={styles.input} placeholder="Enter Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className={styles.button}>Login</button>
          </form>
          {authError && <p className={styles.loginError}>Access Denied.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className={styles.title}>DragXQueen Stream Engine</h1>
        <button className={styles.buttonPink} style={{ width:'auto', padding:'0.5rem 1.2rem' }} onClick={handleLogout}>Logout</button>
      </header>

      {/* Live Preview */}
      <section className={styles.previewSection}>
        <h2 className={styles.previewSectionTitle}>🖥 Live Preview — Both Channels</h2>
        <div className={styles.previewGrid}>
          <div className={styles.previewCard}>
            <div className={styles.previewLabel}><span className={styles.previewDot}/>📺 Landscape<span className={styles.previewBadge}>16:9</span></div>
            <div className={styles.previewFrame} ref={landscapeFrameRef}>
              <iframe ref={landscapeIframeRef} src="/overlay/landscape" title="Landscape Preview" className={styles.previewIframe} scrolling="no"/>
            </div>
            <a href="/overlay/landscape" target="_blank" rel="noreferrer" className={styles.previewLink}>Open Full Screen ↗</a>
          </div>
          <div className={styles.previewCard}>
            <div className={styles.previewLabel}><span className={`${styles.previewDot} ${styles.previewDotPink}`}/>📱 Portrait<span className={`${styles.previewBadge} ${styles.previewBadgePink}`}>9:16</span></div>
            <div className={styles.previewFrame} ref={portraitFrameRef} style={{ maxWidth:'220px' }}>
              <iframe ref={portraitIframeRef} src="/overlay/portrait" title="Portrait Preview" className={styles.previewIframe} scrolling="no"/>
            </div>
            <a href="/overlay/portrait" target="_blank" rel="noreferrer" className={styles.previewLink}>Open Full Screen ↗</a>
          </div>
        </div>
      </section>

      <main className={styles.grid}>

        {/* ── 🎛️ Stream Controls ─────────────────────────────── */}
        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
          <h2 className={styles.cardTitle}>🎛️ Stream State Controls</h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button className={`${styles.button} ${state.streamState === 'starting' ? styles.buttonPink : ''}`} onClick={() => updateState({ streamState: 'starting' })}>STARTING</button>
            <button className={`${styles.button} ${state.streamState === 'live' ? styles.buttonPink : ''}`} onClick={() => updateState({ streamState: 'live' })}>LIVE</button>
            <button className={`${styles.button} ${state.streamState === 'paused' ? styles.buttonPink : ''}`} onClick={() => updateState({ streamState: 'paused' })}>PAUSED</button>
            <button className={`${styles.button} ${state.streamState === 'ending' ? styles.buttonPink : ''}`} onClick={() => updateState({ streamState: 'ending' })}>ENDING</button>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <label className={styles.sfxToggle} style={{ margin: 0 }}>
              <input type="checkbox" checked={state.showFacecam} onChange={e => updateState({ showFacecam: e.target.checked })} />
              <span style={{ fontWeight: 800 }}>Show Facecam Overlay</span>
            </label>
            <p className={styles.label} style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>Turn this off to hide the facecam frame entirely from the stream view.</p>
          </div>
        </div>

        {/* ── 📡 Social Ticker Slots ─────────────────────────────── */}
        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
          <h2 className={styles.cardTitle}>📡 Social Ticker Slots</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'1rem' }}>
            {localSlots.map(slot => (
              <div key={slot.id} className={styles.socialSlotRow}>
                <select
                  className={styles.slotSelect}
                  value={slot.platform}
                  onChange={e => updateSlot(slot.id, 'platform', e.target.value)}
                >
                  {PLATFORM_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="@handle or /channel"
                  value={slot.handle}
                  onChange={e => updateSlot(slot.id, 'handle', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className={styles.slotRemoveBtn} onClick={() => removeSlot(slot.id)} title="Remove">✕</button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'12px' }}>
            <button className={styles.button} onClick={addSlot} style={{ flex:1 }}>+ Add Slot</button>
            <button className={`${styles.button} ${styles.buttonPink}`} onClick={pushSlots} style={{ flex:1 }}>🔄 Push to Overlays</button>
          </div>
        </div>

        {/* ── 🎨 Theme Controller ────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🎨 Global Theme</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Primary Glow Color</label>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker}
                value={state.themeColors?.primary ?? '#00f3ff'}
                onChange={e => updateState({ themeColors: { ...(state.themeColors ?? { primary: '#00f3ff', secondary: '#ff0055' }), primary: e.target.value } })}
              />
              <span className={styles.colorValue}>{state.themeColors?.primary ?? '#00f3ff'}</span>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Secondary Glow Color</label>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorPicker}
                value={state.themeColors?.secondary ?? '#ff0055'}
                onChange={e => updateState({ themeColors: { ...(state.themeColors ?? { primary: '#00f3ff', secondary: '#ff0055' }), secondary: e.target.value } })}
              />
              <span className={styles.colorValue}>{state.themeColors?.secondary ?? '#ff0055'}</span>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Overlay Font</label>
            <select
              className={styles.input}
              value={state.fontFamily}
              onChange={e => updateState({ fontFamily: e.target.value })}
              style={{ fontFamily: `'${state.fontFamily}', sans-serif` }}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', sans-serif` }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Reset to Default</label>
            <button className={styles.button} onClick={() => updateState({ themeColors: { primary:'#00f3ff', secondary:'#ff0055' }, fontFamily:'Rajdhani' })}>
              ↺ Reset Theme
            </button>
          </div>
        </div>

        {/* ── 📐 Layout Control ─────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📐 Layout Control</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Facecam Position (Landscape)</label>
            <div className={styles.cornerGrid}>
              {CORNER_OPTIONS.map(c => (
                <button
                  key={c.value}
                  className={`${styles.cornerBtn} ${state.facecamCorner === c.value ? styles.cornerBtnActive : ''}`}
                  onClick={() => updateState({ facecamCorner: c.value })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.inputGroup} style={{ marginTop:'1.5rem' }}>
            <label className={styles.label}>Breaking News Bar</label>
            <textarea
              className={styles.input}
              rows={2}
              placeholder="e.g. SEASON 10 NOW LIVE! New map dropping next week..."
              value={newsText}
              onChange={e => setNewsText(e.target.value)}
              style={{ resize:'vertical', minHeight:'60px' }}
            />
            <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
              <button className={styles.button} style={{ flex:1 }} onClick={() => updateState({ newsTickerText: newsText })}>Set Ticker ↗</button>
              <button className={styles.buttonPink} style={{ border:'1px solid var(--neon-pink)', background:'transparent', color:'var(--neon-pink)', borderRadius:'6px', padding:'0.6rem 1rem', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }} onClick={() => { setNewsText(''); updateState({ newsTickerText:'' }); }}>Clear</button>
            </div>
          </div>
        </div>

        {/* ── ⚔️ BGMI Match Stats ───────────────────────────────── */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>⚔️ BGMI Stats HUD</h2>
            <label className={styles.sfxToggle} style={{ margin: 0 }}>
              <input type="checkbox" checked={state.showBgmiStats} onChange={e => updateState({ showBgmiStats: e.target.checked })} />
              <span style={{ fontWeight: 800 }}>Enable Stats</span>
            </label>
          </div>
          <p className={styles.label} style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Turn off to hide the stats bar (e.g., for Just Chatting).</p>

          <div className={styles.inputGroup}>
            <label className={styles.label}>💀 Kills</label>
            <div className={styles.statStepper}>
              <button className={styles.stepperBtn} onClick={() => changeKills(-1)}>−</button>
              <span className={styles.stepperValue}>{Number(state.killCount) || 0}</span>
              <button className={styles.stepperBtn} onClick={() => changeKills(1)}>+</button>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>🐔 Finishes</label>
            <div className={styles.statStepper}>
              <button className={styles.stepperBtn} onClick={() => changeFinishes(-1)}>−</button>
              <span className={styles.stepperValue}>{Number(state.finishes) || 0}</span>
              <button className={styles.stepperBtn} onClick={() => changeFinishes(1)}>+</button>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>🏆 Day Wins (Chicken Dinners)</label>
            <div className={styles.statStepper}>
              <button className={styles.stepperBtn} onClick={() => changeDayWins(-1)}>−</button>
              <span className={styles.stepperValue}>{Number(state.dayWins) || 0}</span>
              <button className={styles.stepperBtn} onClick={() => changeDayWins(1)}>+</button>
            </div>
          </div>
          <button className={styles.button} style={{ marginTop:'0.5rem' }} onClick={() => updateState({ killCount:0, finishes:0, dayWins:0 })}>
            ↺ Reset Round/Day
          </button>
        </div>

        {/* ── 💸 Donation & Support Ticker ──────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>💸 Support Ticker / QR</h2>
          <p className={styles.label} style={{ marginBottom: '1rem', opacity: 0.8 }}>Displays payment details on the bottom right Support Card.</p>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Google Pay (Number/UPI)</label>
            <input type="text" className={styles.input} placeholder="e.g. 9876543210" value={localDonation.gpay} onChange={e => setLocalDonation({...localDonation, gpay: e.target.value})} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Paytm</label>
            <input type="text" className={styles.input} placeholder="e.g. 9876543210" value={localDonation.paytm} onChange={e => setLocalDonation({...localDonation, paytm: e.target.value})} />
          </div>
          <button className={`${styles.button} ${styles.buttonPink}`} style={{ marginTop:'0.5rem' }} onClick={() => updateState({ donationDetails: localDonation })}>
            🔄 Push Donation Text
          </button>
        </div>

        {/* ── 🎬 BGMI Alerts ────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🎬 BGMI Moment Alerts</h2>
          <p className={styles.label} style={{ marginBottom:'1rem' }}>Fire a fullscreen animated alert on both overlays instantly.</p>
          <div className={styles.alertGrid}>
            {BGMI_ALERTS.map(a => (
              <button
                key={a.key}
                className={styles.alertTypeBtn}
                style={{ '--alert-color': a.color } as any}
                onClick={() => fireAlert(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <label className={styles.sfxToggle} style={{ marginTop:'1rem' }}>
            <input type="checkbox" checked={sfxEnabled} onChange={e => setSfxEnabled(e.target.checked)} />
            <span>🔊 Play SFX in Admin Tab</span>
          </label>
        </div>

        {/* ── 🌟 Latest Events ──────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🌟 Latest Events</h2>
          <p className={styles.label} style={{ marginBottom: '1rem', opacity: 0.8 }}>Displayed in the top-center events box.</p>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Latest Subscriber</label>
            <input type="text" className={styles.input} placeholder="e.g. PhoenixFan99" value={localLatestSub} onChange={e => setLocalLatestSub(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Top Donor</label>
            <input type="text" className={styles.input} placeholder="e.g. Raj ($50)" value={localTopDonor} onChange={e => setLocalTopDonor(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Latest Superchat</label>
            <input type="text" className={styles.input} placeholder="e.g. Thanks Raj for $50!" value={localLatestSuperchat} onChange={e => setLocalLatestSuperchat(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Latest GPay Supporter</label>
            <input type="text" className={styles.input} placeholder="e.g. Rahul" value={localLatestGpay} onChange={e => setLocalLatestGpay(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Latest Paytm Supporter</label>
            <input type="text" className={styles.input} placeholder="e.g. Aditi" value={localLatestPaytm} onChange={e => setLocalLatestPaytm(e.target.value)} />
          </div>
          <button className={`${styles.button} ${styles.buttonPink}`} style={{ marginTop:'0.5rem' }} onClick={() => updateState({ latestSubscriber: localLatestSub, topDonor: localTopDonor, latestSuperchat: localLatestSuperchat, latestGpaySupport: localLatestGpay, latestPaytmSupport: localLatestPaytm })}>
            🔄 Push Latest Events
          </button>
        </div>

        {/* ── 👑 Supporter Spotlight ────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>👑 Supporter Spotlight</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Top Fan&apos;s Name</label>
            <input
              type="text" className={styles.input} value={fanName}
              onChange={e => setFanName(e.target.value)}
              placeholder="e.g. PhoenixFan99"
              onKeyDown={e => e.key === 'Enter' && fanName.trim() && (updateState({ supporterSpotlight: { id: Date.now(), name: fanName.trim() } }), setFanName(''))}
            />
          </div>
          <button
            className={`${styles.button} ${styles.spotlightBtn}`}
            onClick={() => { if (fanName.trim()) { updateState({ supporterSpotlight: { id: Date.now(), name: fanName.trim() } }); setFanName(''); } }}
            disabled={!fanName.trim()}
          >✨ Spotlight NOW!</button>
        </div>

        {/* ── Live Stats (Subs) ─────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📊 Subscriber Goal</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Current Subscribers</label>
            <input type="number" className={styles.input} value={localSubCount} onChange={e => setLocalSubCount(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Subscriber Goal</label>
            <input type="number" className={styles.input} value={localGoal} onChange={e => setLocalGoal(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Upload Brand Logo</label>
            <input type="file" accept="image/*" className={styles.input} style={{ padding:'0.8rem' }} onChange={handleLogoUpload} />
            {logoDataUrl && <img src={logoDataUrl} alt="Logo" style={{ marginTop:'1rem', maxHeight:'80px', borderRadius:'4px', border:'1px solid var(--neon-cyan)' }} />}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Upload Payment QR Code</label>
            <input type="file" accept="image/*" className={styles.input} style={{ padding:'0.8rem' }} onChange={handleQrUpload} />
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" style={{ marginTop:'1rem', maxHeight:'80px', borderRadius:'4px', border:'1px solid var(--neon-pink)' }} />}
            <label className={styles.sfxToggle} style={{ margin: '1rem 0 0 0' }}>
              <input type="checkbox" checked={state.showQrCode} onChange={e => updateState({ showQrCode: e.target.checked })} />
              <span style={{ fontWeight: 800 }}>Show QR on Stream</span>
            </label>
          </div>
          <button className={`${styles.button} ${styles.buttonPink}`} style={{ marginTop:'0.5rem' }}
            onClick={(e) => {
              e.preventDefault();
              updateState({ 
                subscriberCount: parseInt(localSubCount)||0, 
                subscriberGoal: parseInt(localGoal)||100, 
                logoDataUrl, 
                qrCodeUrl: qrCodeDataUrl,
                latestSubscriber: localLatestSub,
                topDonor: localTopDonor,
                latestSuperchat: localLatestSuperchat,
                latestGpaySupport: localLatestGpay,
                latestPaytmSupport: localLatestPaytm,
                newsTickerText: newsText
               });
            }}>
            Save &amp; Sync All
          </button>
          <button className={styles.button} style={{ marginTop:'1rem' }} onClick={() => updateState({ triggerVictory: state.triggerVictory + 1 })}>
            🏆 Victory Animation!
          </button>
        </div>

        {/* ── Chat Simulator ────────────────────────────────────── */}
        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
          <h2 className={styles.cardTitle}>💬 Chat Simulator</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'1rem' }}>
            {localChats.map(chat => (
              <div key={chat.id} className={styles.socialSlotRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Chat message (e.g. GG!)"
                  value={chat.text}
                  onChange={e => updateChatText(chat.id, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  className={styles.button} 
                  onClick={() => updateState({ chatEvent: { id: Date.now(), text: chat.text } })}
                  disabled={!chat.text.trim()}
                  style={{ padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
                >
                  🚀 Trigger
                </button>
                <button className={styles.slotRemoveBtn} onClick={() => removeChat(chat.id)} title="Remove">✕</button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'12px' }}>
            <button className={styles.button} onClick={addChat} style={{ flex:1 }}>+ Add Message Option</button>
            <button className={`${styles.button} ${styles.buttonPink}`} onClick={pushChats} style={{ flex:1 }}>🔄 Save Chat Defaults</button>
          </div>
        </div>

      </main>
    </div>
  );
}

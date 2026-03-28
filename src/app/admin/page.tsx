'use client';

import { useSync } from '@/lib/useSync';
import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';

export default function Dashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // Sync State
  const { state, updateState } = useSync();
  const [localSubCount, setLocalSubCount] = useState(state.subscriberCount.toString());
  const [localGoal, setLocalGoal] = useState(state.subscriberGoal.toString());

  // Social Handles State
  const [ytHandle, setYtHandle] = useState(state.socialHandles?.youtube || '');
  const [igHandle, setIgHandle] = useState(state.socialHandles?.instagram || '');
  const [fbHandle, setFbHandle] = useState(state.socialHandles?.facebook || '');
  const [qrUrl, setQrUrl] = useState(state.qrCodeUrl || '');



  useEffect(() => {
    // Check if user previously logged in
    const loggedIn = localStorage.getItem('dxq_auth');
    if (loggedIn) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    setLocalSubCount(state.subscriberCount?.toString() || '0');
    setLocalGoal(state.subscriberGoal?.toString() || '100');
    setYtHandle(state.socialHandles?.youtube || '');
    setIgHandle(state.socialHandles?.instagram || '');
    setFbHandle(state.socialHandles?.facebook || '');
    setQrUrl(state.qrCodeUrl || '');
  }, [state]);



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      localStorage.setItem('dxq_auth', 'true');
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleSyncOverlay = () => {
    updateState({
      subscriberCount: parseInt(localSubCount) || 0,
      subscriberGoal: parseInt(localGoal) || 100,
      socialHandles: {
        youtube: ytHandle,
        instagram: igHandle,
        facebook: fbHandle,
      },
      qrCodeUrl: qrUrl,
    });
  };

  const handleTriggerVictory = () => {
    updateState({
      triggerVictory: state.triggerVictory + 1,
    });
  };



  const handleLogout = () => {
    localStorage.removeItem('dxq_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.title} style={{ fontSize: '2rem', marginBottom: '1rem' }}>Restricted Access</h1>
          <p style={{ marginBottom: '2rem' }}>Please log in to manage your stream overlay.</p>
          <form onSubmit={handleLogin} className={styles.inputGroup}>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="Enter Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className={styles.button}>Login</button>
          </form>
          {authError && <p className={styles.loginError}>Access Denied. Incorrect password (try: admin).</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={styles.title}>Stream Control Center</h1>
        <button className={styles.buttonPink} style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className={styles.grid}>
        {/* Stream Stats Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Live Stats</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Current Subscribers</label>
            <input 
              type="number" 
              className={styles.input} 
              value={localSubCount}
              onChange={(e) => setLocalSubCount(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Subscriber Goal</label>
            <input 
              type="number" 
              className={styles.input} 
              value={localGoal}
              onChange={(e) => setLocalGoal(e.target.value)}
            />
          </div>
        </div>

        {/* Social Handles Editor */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Social Handles</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>YouTube Handle</label>
            <input 
              type="text" 
              className={styles.input} 
              value={ytHandle}
              onChange={(e) => setYtHandle(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Instagram Handle</label>
            <input 
              type="text" 
              className={styles.input} 
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Facebook Handle</label>
            <input 
              type="text" 
              className={styles.input} 
              value={fbHandle}
              onChange={(e) => setFbHandle(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
            <label className={styles.label}>QR Code Target URL</label>
            <input 
              type="text" 
              className={styles.input} 
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Actions Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Full-Screen Sync</h2>
          <div className={styles.inputGroup}>
            <p className={styles.label} style={{marginBottom: '1rem'}}>
              Push all changes to the live overlay synchronously.
            </p>
            <button className={`${styles.button} ${styles.buttonPink}`} onClick={handleSyncOverlay} style={{ marginBottom: '1.5rem' }}>
              Save & Sync All
            </button>
            <p className={styles.label} style={{marginBottom: '1rem'}}>
              Trigger Victory Animation!
            </p>
            <button className={styles.button} onClick={handleTriggerVictory}>
              Winner Winner!
            </button>
          </div>
        </div>

        {/* Chat Alerts Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Chat Simulator</h2>
          <div className={styles.inputGroup}>
            <p className={styles.label} style={{marginBottom: '1rem'}}>
              Simulate chat keywords to trigger overlay alerts.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className={styles.button} 
                onClick={() => updateState({ chatEvent: { id: Date.now(), text: 'GG' } })}
              >
                Trigger "GG"
              </button>
              <button 
                className={`${styles.button} ${styles.buttonPink}`} 
                onClick={() => updateState({ chatEvent: { id: Date.now(), text: 'Queen' } })}
              >
                Trigger "Queen"
              </button>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}

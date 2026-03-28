import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>DragXQueen Platform</h1>
      </header>
      <main className={styles.main}>
        <div className={styles.linkCard}>
          <h2>Stream Dashboard 🚀</h2>
          <p>Control center for your stream.</p>
          <Link href="/admin" className={styles.linkButton}>Open Admin Panel</Link>
        </div>

        <div className={styles.linkCard}>
          <h2>OBS Overlay ✨</h2>
          <p>Transparent overlay for your broadcast software.</p>
          <Link href="/overlay" className={styles.linkButton}>Launch Overlay</Link>
        </div>
      </main>
    </div>
  );
}

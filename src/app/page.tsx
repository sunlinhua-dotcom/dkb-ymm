import ChatInterface from '@/components/ChatInterface';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <ChatInterface />
      </div>
    </main>
  );
}

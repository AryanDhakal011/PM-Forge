import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import styles from "@/components/product/Product.module.css";

const helpItems = [
  {
    question: "How do I start?",
    answer: "Open Today, choose the case on your desk, or browse the scenario library. You can practice without creating an account.",
  },
  {
    question: "Where is my paused session?",
    answer: "Today shows Resume for unfinished work. You can also find saved and completed sessions in History.",
  },
  {
    question: "How do I keep a backup?",
    answer: "Open Settings and choose Export my workspace. Your local JSON backup can be imported with your consent.",
  },
  {
    question: "Do I need a microphone?",
    answer: "No. Typed and spoken responses follow the same practice flow. Speech is optional and controlled in Settings.",
  },
  {
    question: "Where is my work saved?",
    answer: "Guest work stays in this browser. Use a workspace export before clearing browser data or moving devices.",
  },
  {
    question: "How is feedback scored?",
    answer: "A provisional rubric checks the structure and evidence in your recorded decisions. It is not a hiring assessment.",
  },
];

export default function AppHelpPage() {
  return (
    <div className={styles.content}>
      <div className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>Workspace help</span>
          <h1>A clear next move.</h1>
          <p>Quick answers about practice, saved work, privacy, and feedback.</p>
        </div>
        <Link href="/app" className={styles.primary}>
          Return to Today
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className={styles.grid3}>
        {helpItems.map((item) => (
          <details className={styles.panel} key={item.question}>
            <summary>{item.question}</summary>
            <p className={styles.prose}>{item.answer}</p>
          </details>
        ))}
      </div>
      <div className={styles.notice} style={{ marginTop: 28 }}>
        <Compass size={18} />
        <span>Still stuck? Your saved work stays on this device until you export or remove it.</span>
      </div>
    </div>
  );
}

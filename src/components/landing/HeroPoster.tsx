import styles from "./HeroPoster.module.css";

export function HeroPoster({ note = false }: { note?: boolean }) {
  return (
    <div
      className={styles.poster}
      role="img"
      aria-label="A brass decision engine on a wooden workbench, surrounded by pinned customer evidence, metrics and constraints."
    >
      <div className={styles.halo} />
      <div className={styles.engine}>
        <span className={styles.ringOuter} />
        <span className={styles.ringMiddle} />
        <span className={styles.ringInner} />
        <span className={styles.meridian} />
        <span className={styles.core} />
        <span className={styles.plane} />
        <span className={styles.dial}>
          <span className={styles.needle} />
        </span>
        <span className={styles.lamp} />
      </div>

      <div className={`${styles.card} ${styles.cardA}`}>
        <span>Revenue signal</span>
        <strong>Mobile conversion</strong>
        <em>−22%</em>
        <svg viewBox="0 0 100 34" aria-hidden="true">
          <path d="M2 8 L22 10 L38 6 L52 16 L68 22 L84 25 L98 31" />
        </svg>
      </div>
      <div className={`${styles.card} ${styles.cardB}`}>
        <span>Customer quote</span>
        <strong>“I tried to pay twice, then I gave up.”</strong>
      </div>
      <div className={`${styles.card} ${styles.cardC}`}>
        <span>Support</span>
        <strong>Login tickets doubled</strong>
      </div>
      <div className={`${styles.sticky} ${styles.stickyA}`}>User Needs</div>
      <div className={`${styles.sticky} ${styles.stickyB}`}>Market Trends</div>
      <div className={`${styles.sticky} ${styles.stickyC}`}>Constraints</div>
      <div className={`${styles.why} ${note ? styles.whyVisible : ""}`}>why?</div>
      <div className={styles.mug} />
      <div className={styles.plant}>
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

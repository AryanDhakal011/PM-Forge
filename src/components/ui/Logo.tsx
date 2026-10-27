import styles from "./Logo.module.css";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`${styles.logo} ${light ? styles.light : ""}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.2 14.9 23.6 5.4l-6.4 18.9-3.6-7.7-9.4-1.7Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m13.6 16.6 4.1-4.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M4.2 14.9 13.6 16.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.word}>
        PM<span className={styles.forge}>Forge</span>
      </span>
    </span>
  );
}

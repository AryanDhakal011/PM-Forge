import styles from "@/styles/pages.module.css";

type PageHeroProps = {
  kicker: string;
  title: React.ReactNode;
  lede: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  wide?: boolean;
};

export function PageHero({
  kicker,
  title,
  lede,
  children,
  aside,
  wide = false,
}: PageHeroProps) {
  return (
    <header className={`${styles.hero} ${wide ? styles.heroWide : ""}`}>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={`${styles.title} display`}>{title}</h1>
          <p className={styles.lede}>{lede}</p>
          {children ? <div className={styles.actions}>{children}</div> : null}
        </div>
        {aside ? <aside className={styles.heroAside}>{aside}</aside> : null}
      </div>
    </header>
  );
}

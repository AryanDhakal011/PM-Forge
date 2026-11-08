import styles from './Logo.module.css';

/** The Fold: a decision sheet folded into an F, with an amber turning point. */
export function BrandMark({size=32}:{size?:number}) {
  return <svg data-brand-mark="pmforge" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><rect width="40" height="40" rx="10" fill="#203d2d"/><path d="M11 31V9H30L24 15H17V19H26L20 25H17V31H11Z" fill="#fff8e8"/><path d="M24 9H30L24 15V9Z" fill="#efbd85"/></svg>;
}
export function Logo({light=false}:{light?:boolean}) {
  return <span className={`${styles.logo} ${light?styles.light:''}`}><BrandMark/><span className={styles.word}>PM<span className={styles.forge}>Forge</span></span></span>;
}

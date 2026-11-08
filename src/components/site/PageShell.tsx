import { LandingHeader } from "@/components/landing/LandingControls";
import { Footer } from "@/components/landing/Footer";
import styles from "@/styles/pages.module.css";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingHeader />
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <Footer />
    </>
  );
}

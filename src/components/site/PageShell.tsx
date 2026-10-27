import { Navigation } from "@/components/landing/Navigation";
import { Footer } from "@/components/landing/Footer";
import styles from "@/styles/pages.module.css";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <Footer />
    </>
  );
}

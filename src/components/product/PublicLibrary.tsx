"use client";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { LibraryView, QuestionDetail } from "./WorkspaceViews";
import styles from "./Product.module.css";
export default function PublicLibrary({ slug }: { slug?: string }) {
  return (
    <WorkspaceProvider>
      <div className={styles.product} style={{ minHeight: 0 }}>
        <div className={styles.content}>
          {slug ? (
            <QuestionDetail slug={slug} publicView />
          ) : (
            <LibraryView publicView />
          )}
        </div>
      </div>
    </WorkspaceProvider>
  );
}

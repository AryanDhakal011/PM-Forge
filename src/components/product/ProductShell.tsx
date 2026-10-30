"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bookmark,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  FileText,
  BriefcaseBusiness,
  History,
  House,
  Library,
  Menu,
  Play,
  Search,
  Settings,
  ShieldCheck,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  CircleHelp,
  UserRound,
  Download,
} from "lucide-react";
import gsap from "gsap";
import { useWorkspace } from "./WorkspaceProvider";
import { GatePanel } from "./EntryGate";
import { Dialog } from "@/components/ui/Dialog";
import { useSettings } from "@/components/providers/SettingsProvider";
import { questions, categoryOf } from "@/lib/product/content";
import { projects } from "@/lib/projects/content";
import { entryHref } from "@/lib/product/routes";
import styles from "./Product.module.css";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/product/db";
import { exportWorkspace } from "@/lib/product/db";
import OfflineSupport from "./OfflineSupport";
import GuestImportPrompt from "./GuestImportPrompt";
import LandingCarryPrompt from "./LandingCarryPrompt";

const links = [
  { href: "/app", label: "Today", icon: House },
  { href: "/app/practice", label: "Practice", icon: Library },
  { href: "/app/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/app/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/app/portfolio", label: "Portfolio", icon: FileText },
];
export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [thought, setThought] = useState("Clarity is a practice.");
  const { profile, loading, error, reload, sync } = useWorkspace();
  const { reducedMotion } = useSettings();
  const [theme, setTheme] = useState("light");
  const [searchOpen, setSearchOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const waiting = useLiveQuery(async () => {
    if (!profile) return [0, 0];
    return Promise.all([
      db.runs
        .where("ownerId")
        .equals(profile.id)
        .filter((r) => !r.completedAt)
        .count(),
      db.projectRuns
        .where("ownerId")
        .equals(profile.id)
        .filter((r) => r.phase !== "debrief")
        .count(),
    ]);
  }, [profile?.id]) || [0, 0];
  useLayoutEffect(() => {
    const current = root.current?.querySelector<HTMLElement>(
      'nav[aria-label="Workspace"] a[aria-current="page"]',
    );
    if (!current || !indicator.current) return;
    const context = gsap.context(() => {
      gsap.to(indicator.current, {
        y: current.offsetTop,
        height: current.offsetHeight,
        duration: reducedMotion ? 0 : 0.26,
        ease: "power2.inOut",
        overwrite: true,
      });
    }, root);
    return () => context.revert();
  }, [pathname, collapsed, loading, profile?.id, reducedMotion]);
  const isRun =
    pathname.startsWith("/app/run/") ||
    /^\/app\/projects\/[a-z0-9-]+\/run\//.test(pathname);
  useEffect(() => {
    document.documentElement.dataset.product = "true";
    const update = () =>
      setTheme(localStorage.getItem("pmforge.theme") || "light");
    update();
    setCollapsed(localStorage.getItem("pmforge.sidebar") === "collapsed");
    const thoughts = [
      "A good question changes everything.",
      "Leave room for what you do not know.",
      "Make the next decision clearer.",
      "Small tests. Better judgment.",
      "Listen for the missing signal.",
      "Tradeoffs deserve daylight.",
      "Clarity is a practice.",
    ];
    const index = Number(
      sessionStorage.getItem("pmforge.thought") ?? new Date().getDay(),
    );
    sessionStorage.setItem("pmforge.thought", String(index));
    setThought(thoughts[index % thoughts.length]);
    window.addEventListener("pmforge:theme", update);
    let prefixAt = 0;
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }
      const target = event.target as HTMLElement;
      if (
        target.isContentEditable ||
        /INPUT|TEXTAREA|SELECT/.test(target.tagName) ||
        target.closest("[role=dialog]")
      )
        return;
      if (event.key.toLowerCase() === "g") prefixAt = performance.now();
      else if (prefixAt && performance.now() - prefixAt < 900) {
        const destination = (
          { h: "/app", p: "/app/practice", r: "/app/projects" } as Record<
            string,
            string
          >
        )[event.key.toLowerCase()];
        prefixAt = 0;
        if (destination) {
          event.preventDefault();
          router.push(destination);
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      delete document.documentElement.dataset.product;
      window.removeEventListener("keydown", key);
      window.removeEventListener("pmforge:theme", update);
    };
  }, []);
  useEffect(() => {
    if (reducedMotion || loading || !profile) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-enter]",
        { opacity: 0, y: 9 },
        {
          opacity: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.045,
          ease: "power2.out",
          clearProps: "opacity,transform",
        },
      );
    }, content);
    return () => context.revert();
  }, [pathname, reducedMotion, loading, profile?.id]);
  useEffect(() => {
    setMore(false);
    setSearchOpen(false);
  }, [pathname]);
  const backup = async () => {
    if (!profile) return;
    try {
      const data = await exportWorkspace(profile);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "pmforge-workspace.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupStatus("Backup exported.");
    } catch {
      setBackupStatus("Export failed. Please retry in Settings.");
    }
  };
  const active = (href: string) =>
    href === "/app" ? pathname === href : pathname.startsWith(href);
  const title = pathname.split("/")[2] || "Today";
  if (loading)
    return (
      <div className={styles.product}>
        <div
          className={styles.content}
          style={{ maxWidth: 900, paddingTop: 80 }}
        >
          <span className={styles.brand}>
            <Compass />
            PMForge
          </span>
          <div className={styles.skeleton} />
          <p className={styles.muted}>Opening your workspace…</p>
          <noscript>
            <p>
              Enable JavaScript for saved interactive practice, or{" "}
              <a href="/questions">browse the public scenario catalogue</a>.
            </p>
          </noscript>
        </div>
      </div>
    );
  if (error)
    return (
      <div className={styles.product}>
        <div className={styles.onboarding}>
          <p role="alert" className={styles.error}>
            {error}
          </p>
          <button onClick={reload} className={styles.primary}>
            Retry storage
          </button>
          <Link href="/" className={styles.secondary}>
            Back to PMForge
          </Link>
        </div>
      </div>
    );
  if (!profile)
    return (
      <div className={styles.product}>
        <div className={styles.onboarding}>
          <Link href="/" className={styles.brand}>
            <Compass />
            PMForge
          </Link>
          <GatePanel next={pathname} />
          <noscript>
            <a href={`/login?next=${encodeURIComponent(pathname)}`}>
              Sign in to open this workspace
            </a>
          </noscript>
        </div>
      </div>
    );
  return (
    <div
      ref={root}
      className={styles.product}
      data-theme={theme}
      data-collapsed={collapsed}
      data-room={pathname === "/app/projects" ? "projects" : undefined}
    >
      <OfflineSupport />
      <GuestImportPrompt />
      <LandingCarryPrompt />
      {!isRun && (
        <aside className={styles.sidebar}>
          <div>
            <Link
              href="/"
              className={styles.brand}
              aria-label="PMForge landing page"
            >
              <Compass size={24} />
              <span>PMForge</span>
            </Link>
            <button
              className={styles.collapseButton}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => {
                const next = !collapsed;
                setCollapsed(next);
                localStorage.setItem(
                  "pmforge.sidebar",
                  next ? "collapsed" : "expanded",
                );
              }}
            >
              {collapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
          </div>
          <nav className={styles.nav} aria-label="Workspace">
            <span
              ref={indicator}
              className={styles.navIndicator}
              aria-hidden="true"
            />
            {links.map((item) => (
              <Link
                key={item.href}
                title={item.label}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {((item.href === "/app/practice" && waiting[0] > 0) ||
                  (item.href === "/app/projects" && waiting[1] > 0)) && (
                  <i className={styles.navDot} aria-label="Practice waiting" />
                )}
              </Link>
            ))}
          </nav>
          <div className={styles.sideNote}>{thought}</div>
          <nav className={styles.navBottom} aria-label="Workspace support">
            <Link
              href="/app/settings"
              aria-current={active("/app/settings") ? "page" : undefined}
              title="Settings"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <Link href="/help" title="Help">
              <CircleHelp size={20} />
              <span>Help</span>
            </Link>
          </nav>
        </aside>
      )}
      <div className={isRun ? undefined : styles.body}>
        {!isRun && (
          <>
            <header className={styles.topbar}>
              <div className={styles.breadcrumb}>
                <Link href="/app">Workspace</Link>
                <ChevronRight size={12} />
                <span>{title}</span>
              </div>
              <div className={styles.topActions}>
                <details className={styles.storageMenu}>
                  <summary className={styles.storage}>
                    <i />
                    {profile.identity === "guest"
                      ? "On this device"
                      : "Sync status"}
                  </summary>
                  <div className={styles.popover}>
                    <strong>
                      {profile.identity === "guest"
                        ? "Your device, your workspace"
                        : sync}
                    </strong>
                    <p>
                      Your practice and notes are stored in this browser.
                      Browser data can be cleared. Keep a backup.
                    </p>
                    <button onClick={() => void backup()}>
                      <Download size={16} />
                      Export backup
                    </button>
                    {profile.identity === "guest" && (
                      <Link
                        href={entryHref(pathname, "storage") + "&upgrade=1"}
                      >
                        Create account ↗
                      </Link>
                    )}
                    <span role="status">{backupStatus}</span>
                  </div>
                </details>
                <button
                  className={styles.searchButton}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search the workspace"
                >
                  <Search size={16} />
                  <span>Find a scenario</span>
                  <kbd>⌘ K</kbd>
                </button>
                <details className={styles.accountMenu}>
                  <summary
                    className={styles.avatar}
                    aria-label="Your workspace menu"
                  >
                    {profile.identity === "guest" ? (
                      <UserRound size={18} />
                    ) : (
                      (profile.name || "You").slice(0, 2).toUpperCase()
                    )}
                  </summary>
                  <div className={styles.popover}>
                    <Link href="/app/settings">Settings</Link>
                    <button onClick={() => void backup()}>Export backup</button>
                    {profile.identity === "guest" && (
                      <Link href={entryHref(pathname, "avatar") + "&upgrade=1"}>
                        Create account
                      </Link>
                    )}
                    <Link href="/">Back to PMForge ↗</Link>
                  </div>
                </details>
              </div>
            </header>
            {sync.startsWith("Session expired") && (
              <div className={styles.guestBanner}>
                <span>
                  You were signed out. Your work is saved on this device.
                </span>
                <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                  Sign in to resume sync
                </Link>
              </div>
            )}
          </>
        )}
        <main
          id="main"
          ref={content}
          className={isRun ? undefined : styles.content}
          tabIndex={-1}
        >
          {!isRun &&
            (pathname.startsWith("/app/projects/") ||
              pathname.includes("/practice/") ||
              pathname.includes("/portfolio/")) && (
              <Link
                href={
                  pathname.startsWith("/app/projects/")
                    ? "/app/projects"
                    : pathname.includes("/practice/")
                      ? "/app/practice"
                      : "/app"
                }
                className={`${styles.textButton} ${styles.small}`}
                style={{ minHeight: 30, marginBottom: 15 }}
              >
                <ArrowLeft size={13} />
                Back to{" "}
                {pathname.startsWith("/app/projects/")
                  ? "projects"
                  : pathname.includes("/practice/")
                    ? "practice"
                    : "Home"}
              </Link>
            )}
          {children}
        </main>
      </div>
      {!isRun && (
        <nav className={styles.mobileNav} aria-label="Mobile workspace">
          <Link
            href="/app"
            aria-current={pathname === "/app" ? "page" : undefined}
          >
            <House />
            Today
          </Link>
          <Link
            href="/app/practice"
            aria-current={active("/app/practice") ? "page" : undefined}
          >
            <Library />
            Practice
          </Link>
          <Link
            href="/app/projects"
            aria-current={active("/app/projects") ? "page" : undefined}
          >
            <BriefcaseBusiness />
            Projects
          </Link>
          <Link
            href="/app/progress"
            aria-current={active("/app/progress") ? "page" : undefined}
          >
            <ChartNoAxesCombined />
            Progress
          </Link>
          <button onClick={() => setMore(true)} aria-expanded={more}>
            <Menu />
            More
          </button>
        </nav>
      )}
      <Dialog
        open={more}
        onClose={() => setMore(false)}
        title="Your workspace"
        size="sm"
      >
        <div
          className={styles.product}
          data-theme={theme}
          style={{ minHeight: 0 }}
        >
          <nav className={styles.nav}>
            {[
              {
                href: "/app/projects",
                label: "Projects",
                icon: BriefcaseBusiness,
              },
              { href: "/app/portfolio", label: "Portfolio", icon: FileText },
              { href: "/help", label: "Help", icon: CircleHelp },
              { href: "/app/settings", label: "Settings", icon: Settings },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Dialog>
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Find your next decision"
        size="md"
      >
        <div
          className={styles.product}
          data-theme={theme}
          style={{ minHeight: 0, background: "none" }}
        >
          <label className={styles.field}>
            Search the scenario library
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ‘conversion’, ‘AI’, or ‘leadership’"
            />
          </label>
          <p className={styles.small}>
            Shortcuts: g then h for Today, p for Practice, r for Projects.
          </p>
          <div className={styles.commandList} aria-live="polite">
            <h3>Pages & actions</h3>
            {[
              ...links,
              { href: "/app?resume=1", label: "Resume practice" },
              { href: "/app/practice?view=saved", label: "Saved" },
              { href: "/app/progress?tab=history", label: "History" },
              { href: "/app/settings", label: "Settings" },
            ]
              .filter((p) =>
                p.label.toLowerCase().includes(query.toLowerCase()),
              )
              .map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setSearchOpen(false)}
                >
                  {p.label}
                </Link>
              ))}
            <h3>Projects</h3>
            {projects
              .filter((p) =>
                `${p.title} ${p.skill}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(0, 4)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  onClick={() => setSearchOpen(false)}
                >
                  {p.title}
                  <small>Real World Project · 3 chapters · 45–75 min</small>
                </Link>
              ))}
            <h3>Scenarios</h3>
            {questions
              .filter((q) =>
                `${q.title} ${categoryOf(q.category).label}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(0, 12)
              .map((q) => (
                <Link
                  key={q.id}
                  href={`/app/practice/${q.slug}`}
                  onClick={() => setSearchOpen(false)}
                >
                  {q.title}
                  <small>
                    {categoryOf(q.category).label} · {q.level} · {q.minutes} min
                  </small>
                </Link>
              ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

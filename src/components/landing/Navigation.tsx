"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Dialog } from "@/components/ui/Dialog";
import { navLinks, modules, projectScenarios } from "@/lib/content";
import { useActiveSectionId } from "@/hooks/useChapter";
import { track } from "@/lib/analytics";
import styles from "./Navigation.module.css";

const NAV_KEYS: Record<string, string> = {
  Home: "home",
  Modules: "modules",
  "Interview Prep": "interview",
  Projects: "projects",
  Tools: "tools",
  Resources: "resources",
};

const HOME_ANCHORS: Record<string, string> = {
  Home: "#top",
  Modules: "#learning",
  "Interview Prep": "#interview",
  Projects: "#projects",
  Tools: "#career",
  Resources: "/resources",
};

type SearchItem = {
  label: string;
  detail: string;
  href: string;
  kind: string;
};

const resourceIndex: SearchItem[] = [
  {
    label: "Signal test",
    detail: "Isolate the strongest evidence from ten conflicting inputs.",
    href: "/#signal",
    kind: "Practice",
  },
  {
    label: "Decision workbench",
    detail: "Work a live project with conflicting stakeholder pressure.",
    href: "/projects",
    kind: "Practice",
  },
  {
    label: "Interview simulator",
    detail: "Two-minute branching interview with rubric feedback.",
    href: "/practice",
    kind: "Practice",
  },
  {
    label: "Decision blueprint",
    detail: "Turn a decision into a document you can defend.",
    href: "/#blueprint",
    kind: "Tool",
  },
  {
    label: "Career board",
    detail: "See how practice becomes portfolio evidence.",
    href: "/career",
    kind: "Tool",
  },
  {
    label: "Interview question bank",
    detail: "Prompts, pivots, and what a strong answer includes.",
    href: "/questions",
    kind: "Resource",
  },
  {
    label: "PM reading room",
    detail: "Short, useful reads on judgment under pressure.",
    href: "/resources",
    kind: "Resource",
  },
  {
    label: "Attribution & credits",
    detail: "Photography, fonts, textures, and licences.",
    href: "/credits",
    kind: "About",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const sectionId = useActiveSectionId();
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const linksRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  const routeKey = useMemo(() => {
    if (pathname.startsWith("/learn")) return "modules";
    if (pathname.startsWith("/practice")) return "interview";
    if (pathname.startsWith("/projects")) return "projects";
    if (
      pathname.startsWith("/tools") ||
      pathname.startsWith("/career") ||
      pathname.startsWith("/dashboard")
    ) {
      return "tools";
    }
    if (pathname.startsWith("/resources") || pathname.startsWith("/credits")) {
      return "resources";
    }
    return null;
  }, [pathname]);

  const activeKey = onHome ? null : routeKey;
  const dark = onHome && sectionId === "projects";

  useEffect(() => {
    const readProfile = () => {
      try {
        setSignedIn(
          Boolean(window.localStorage.getItem("pmforge.product.identity")),
        );
      } catch {
        setSignedIn(false);
      }
    };
    readProfile();
    window.addEventListener("storage", readProfile);
    window.addEventListener("pmforge:progress", readProfile);
    window.addEventListener("pmforge:identity", readProfile);
    return () => {
      window.removeEventListener("storage", readProfile);
      window.removeEventListener("pmforge:progress", readProfile);
      window.removeEventListener("pmforge:identity", readProfile);
    };
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    let scrollable = 0;
    let compact = false;
    const measure = () => {
      scrollable = document.documentElement.scrollHeight - window.innerHeight;
    };
    const paint = () => {
      frame = 0;
      const next = window.scrollY > 24;
      if (next !== compact) {
        compact = next;
        setScrolled(next);
      }
      const progress =
        scrollable > 0
          ? Math.max(0, Math.min(1, window.scrollY / scrollable))
          : 0;
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    measure();
    paint();
    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const parent = linksRef.current;
    if (!parent) return;

    const update = () => {
      const target = activeKey ? linkRefs.current.get(activeKey) : null;
      if (!target) {
        setIndicator((current) =>
          current.visible ? { ...current, visible: false } : current,
        );
        return;
      }
      setIndicator({
        left: target.offsetLeft,
        width: target.offsetWidth,
        visible: true,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    window.addEventListener("resize", update);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    void fonts?.ready.then(update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = menuRef.current;
    document.body.classList.add("no-scroll");
    panel?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
      previous?.focus?.({ preventScroll: true });
    };
  }, [menuOpen]);

  const searchItems = useMemo<SearchItem[]>(
    () => [
      ...modules.map((module) => ({
        label: `${module.number} · ${module.title}`,
        detail: module.short,
        href: `/learn/${module.slug}`,
        kind: "Module",
      })),
      ...projectScenarios.map((scenario) => ({
        label: scenario.name,
        detail: scenario.descriptor,
        href: `/projects#${scenario.id}`,
        kind: "Project",
      })),
      ...resourceIndex,
    ],
    [],
  );

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return searchItems.slice(0, 7);
    return searchItems
      .filter((item) =>
        `${item.label} ${item.detail} ${item.kind}`
          .toLowerCase()
          .includes(trimmed),
      )
      .slice(0, 8);
  }, [query, searchItems]);

  const isActive = useCallback(
    (label: string) => NAV_KEYS[label] === activeKey,
    [activeKey],
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    // On small screens the trigger lives inside the menu and unmounts with it.
    // Return focus to the persistent menu button instead of dropping it to body.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      window.setTimeout(() => {
        menuButtonRef.current?.focus({ preventScroll: true });
      }, 60);
    }
  }, []);

  return (
    <>
      <header
        className={`${styles.header} ${
          scrolled || menuOpen ? styles.solid : ""
        } ${scrolled ? styles.compact : ""}`}
        data-theme="light"
        data-home={onHome}
      >
        {onHome ? (
          <span
            className={styles.progress}
            ref={progressRef}
            aria-hidden="true"
          />
        ) : null}
        <div className={styles.inner}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="PMForge home"
            onClick={() => setMenuOpen(false)}
          >
            <Logo />
          </Link>

          <nav
            ref={linksRef}
            className={styles.links}
            aria-label="Primary navigation"
          >
            <span
              className={styles.spy}
              data-visible={indicator.visible}
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.left}px)`,
              }}
              aria-hidden="true"
            />
            {navLinks.map((link) => {
              const key = NAV_KEYS[link.label] ?? link.label;
              const active = isActive(link.label);
              const href = onHome
                ? (HOME_ANCHORS[link.label] ?? link.href)
                : link.href;
              return (
                <Link
                  key={link.label}
                  href={href}
                  ref={(element) => {
                    if (element) linkRefs.current.set(key, element);
                    else linkRefs.current.delete(key);
                  }}
                  className={`${styles.link} ${active ? styles.active : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Search modules, projects, and resources"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
                setQuery("");
                track("search_open");
              }}
            >
              <Search size={18} strokeWidth={1.7} aria-hidden="true" />
            </button>
            {signedIn ? (
              <Link href="/app" className={`${styles.account} btn btnSm`}>
                Open app
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.login}>
                  Log in
                </Link>
                <Link href="/signup" className={`${styles.signup} btn btnSm`}>
                  Sign Up
                </Link>
              </>
            )}
            <button
              type="button"
              ref={menuButtonRef}
              className={styles.menuButton}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X size={21} strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Menu size={21} strokeWidth={1.7} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          ref={menuRef}
          className={styles.mobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-theme={dark ? "dark" : "light"}
        >
          <button
            type="button"
            className={styles.mobileSearch}
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
              setQuery("");
              track("search_open");
            }}
          >
            <Search size={18} strokeWidth={1.7} aria-hidden="true" />
            Search modules, projects, and resources
          </button>
          <nav aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={
                  onHome ? (HOME_ANCHORS[link.label] ?? link.href) : link.href
                }
                className={styles.mobileLink}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileActions}>
            {signedIn ? (
              <Link
                href="/dashboard"
                className={`${styles.mobileAuth} ${styles.mobileAccount}`}
                onClick={() => setMenuOpen(false)}
              >
                Your workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${styles.mobileAuth} ${styles.mobileLogin}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={`${styles.mobileAuth} ${styles.mobileSignup}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
          <p className={styles.mobileNote}>
            A flight simulator for product judgment. Practice the decisions that
            matter.
          </p>
        </div>
      ) : null}

      <Dialog
        open={searchOpen}
        onClose={closeSearch}
        title="Search the workspace"
        description="Modules, project scenarios, practice tools, and resources."
        size="md"
      >
        <div className={styles.searchWrap}>
          <Search size={17} strokeWidth={1.7} aria-hidden="true" />
          <input
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “prioritisation”, “checkout”, or “interview”"
            autoComplete="off"
            aria-label="Search"
          />
        </div>
        <p className={styles.resultCount} aria-live="polite">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
        <ul className={styles.results}>
          {results.map((item) => (
            <li key={`${item.kind}-${item.label}`}>
              <Link
                href={item.href}
                className={styles.result}
                onClick={() => setSearchOpen(false)}
              >
                <span className={styles.resultKind}>{item.kind}</span>
                <span className={styles.resultBody}>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 ? (
          <p className={styles.empty}>
            Nothing matched that yet. Try a broader term, or browse{" "}
            <Link href="/learn" onClick={() => setSearchOpen(false)}>
              all modules
            </Link>
            .
          </p>
        ) : null}
      </Dialog>
    </>
  );
}

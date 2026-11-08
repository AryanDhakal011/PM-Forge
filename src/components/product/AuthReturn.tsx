"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { db, IDENTITY_KEY,importWorkspace } from "@/lib/product/db";
import { safeNext } from "@/lib/product/routes";
import type { Profile } from "@/lib/product/types";
import styles from "./Product.module.css";
export default function AuthReturn() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (result) => {
        if (!result.user)
          throw Error("Sign-in did not finish. Your device work is unchanged.");
        const user = result.user;
        const previous=localStorage.getItem(IDENTITY_KEY);if(previous&&previous!==user.id){const guest=await db.profiles.get(previous);if(guest?.identity==='guest')sessionStorage.setItem('pmforge.pendingGuest',previous)}
        let existing = await db.profiles.get(user.id);
        if(!existing){const response=await fetch('/api/workspace',{cache:'no-store'});if(!response.ok)throw Error('Could not restore your account workspace. Please retry.');const remote=await response.json();if(remote.data){if(remote.data.profile?.id!==user.id)throw Error('The account identity changed. Please sign in again.');await importWorkspace(remote.data,{...remote.data.profile,identity:'member'},false);existing={...remote.data.profile,identity:'member'}}}

        const profile: Profile = existing || {
          id: user.id,
          name: user.name,
          identity: "member",
          role: "Aspiring PM",
          level: "easy",
          timeline: "Exploring",
          onboardingComplete: false,
          updatedAt: new Date().toISOString(),
        };
        await db.profiles.put(profile);
        localStorage.setItem(IDENTITY_KEY, user.id);
        if (active)
          router.replace(
            profile.onboardingComplete
              ? safeNext(params.get("next"))
              : `/onboarding?next=${encodeURIComponent(safeNext(params.get("next")))}`,
          );
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [router, params]);
  return (
    <div className={styles.product}>
      <main id="main" className={styles.onboarding}>
        <h1>
          {error ? "A sign-in pause." : "Putting your workspace in place…"}
        </h1>
        {error && (
          <>
            <p className={styles.error} role="alert">
              {error}
            </p>
            <Link href="/login" className={styles.primary}>
              Try again or continue as a guest
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

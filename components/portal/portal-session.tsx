"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalSession() {
  const [idleLeft, setIdleLeft] = useState(15 * 60);
  const [pending, setPending] = useState(false);
  const active = useRef(true);
  const warned = idleLeft <= 60;

  useEffect(() => {
    let cancelled = false;
    const mark = () => {
      active.current = true;
    };
    window.addEventListener("pointerdown", mark);
    window.addEventListener("keydown", mark);
    const tick = window.setInterval(() => {
      setIdleLeft((current) => Math.max(0, current - 1));
    }, 1000);
    const beat = window.setInterval(() => {
      if (!active.current) return;
      active.current = false;
      void touch();
    }, 20000);

    async function touch() {
      const response = await fetch("/api/portal/session", { method: "POST" });
      if (response.status === 401) {
        window.location.assign("/account?mode=sign-in&next=/portal&timeout=1");
        return;
      }
      const data = (await response.json()) as { idleLeft?: number };
      if (!cancelled && typeof data.idleLeft === "number") setIdleLeft(data.idleLeft);
    }

    void touch();
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearInterval(beat);
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  useEffect(() => {
    if (idleLeft > 0) return;
    void fetch("/api/portal/session", { method: "POST" }).then(async (response) => {
      if (!response.ok) {
        window.location.assign("/account?mode=sign-in&next=/portal&timeout=1");
        return;
      }
      const data = (await response.json()) as { idleLeft?: number };
      if (typeof data.idleLeft === "number" && data.idleLeft > 0) setIdleLeft(data.idleLeft);
    });
  }, [idleLeft]);

  async function stay() {
    setPending(true);
    const response = await fetch("/api/portal/session", { method: "POST" });
    setPending(false);
    if (!response.ok) {
      window.location.assign("/account?mode=sign-in&next=/portal&timeout=1");
      return;
    }
    const data = (await response.json()) as { idleLeft?: number };
    if (typeof data.idleLeft === "number") setIdleLeft(data.idleLeft);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/account?mode=sign-in");
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={() => void signOut()}>
        Sign out
      </Button>
      {warned ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-white px-4 py-4" role="alertdialog" aria-labelledby="portal-timeout-title">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p id="portal-timeout-title" className="text-sm">
              This portal signs out after 15 minutes without activity. {idleLeft} seconds remain.
            </p>
            <Button type="button" size="sm" disabled={pending} onClick={() => void stay()}>
              Stay signed in
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

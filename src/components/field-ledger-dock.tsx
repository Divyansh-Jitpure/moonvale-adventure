"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LiveQuestPanel } from "@/components/live-quest-panel";
import {
  AUDIO_SETTINGS_EVENT,
  readStoredAudioEnabled,
  saveStoredAudioEnabled,
} from "@/lib/audio-settings";

const controls = [
  "Move: WASD, arrows, stick, or D-pad",
  "Sprint: Shift or south face button",
  "Attack: Space or east face button",
  "Talk: E or west face button",
];

export function FieldLedgerDock() {
  const [open, setOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() =>
    typeof window === "undefined" ? true : readStoredAudioEnabled(window.localStorage),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setAudioEnabled(customEvent.detail);
        return;
      }
      setAudioEnabled(readStoredAudioEnabled(window.localStorage));
    };

    window.addEventListener(AUDIO_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(AUDIO_SETTINGS_EVENT, sync);
  }, []);

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-3">
      {open ? (
        <div className="relative w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-[26px] border border-[#e3c983]/35 bg-[#1a120a]/92 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.46)] backdrop-blur-sm">
          <Image
            src="/assets/ui/hud/regular-paper-crop.png"
            alt=""
            fill
            className="object-cover opacity-35"
          />
          <div className="relative grid gap-4">
            <LiveQuestPanel />

            <section className="relative overflow-hidden rounded-[22px] border border-[#dfc487]/28 bg-[#161009]/86 p-4">
              <Image
                src="/assets/ui/hud/wood-table-crop.png"
                alt=""
                fill
                className="object-cover opacity-18"
              />
              <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#f3d988]">
                  Field Notes
                </p>
                <div className="mt-3 grid gap-2">
                  {controls.map((control) => (
                    <div
                      key={control}
                      className="rounded-[16px] border border-[#f3dfab]/10 bg-black/18 px-3 py-2 text-sm leading-6 text-[#f6ecd0]"
                    >
                      {control}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <HudButton
          label={audioEnabled ? "Sound" : "Muted"}
          icon="/assets/ui/tiny-swords/icons/icon-06.png"
          onClick={() => {
            const next = !audioEnabled;
            setAudioEnabled(next);
            saveStoredAudioEnabled(next);
          }}
        />

        <HudButton
          label={open ? "Close" : "Ledger"}
          icon="/assets/ui/tiny-swords/icons/icon-01.png"
          onClick={() => setOpen((value) => !value)}
        />

        <Link href="/milestones" className="group">
          <HudButtonShell
            label="Log"
            icon="/assets/ui/tiny-swords/icons/icon-09.png"
            tone="green"
          />
        </Link>
      </div>
    </div>
  );
}

function HudButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}>
      <HudButtonShell label={label} icon={icon} tone="blue" />
    </button>
  );
}

function HudButtonShell({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: string;
  tone: "blue" | "green";
}) {
  const ringClass =
    tone === "green"
      ? "border-[#95c18c]/28 bg-[linear-gradient(180deg,rgba(18,35,23,0.92),rgba(12,22,16,0.9))]"
      : "border-[#86b7cb]/28 bg-[linear-gradient(180deg,rgba(16,31,43,0.92),rgba(11,21,30,0.9))]";

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 shadow-[0_14px_26px_rgba(0,0,0,0.32)] transition group-hover:brightness-110 ${ringClass}`}
    >
      <div className="relative h-10 w-10 shrink-0">
        <Image
          src="/assets/ui/hud/button-round-crop.png"
          alt=""
          fill
          className={`object-fill ${tone === "green" ? "hue-rotate-[88deg] saturate-75 brightness-95" : "brightness-95"}`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={icon}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain"
          />
        </div>
      </div>
      <span className="pr-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f8efcf]">
        {label}
      </span>
    </div>
  );
}

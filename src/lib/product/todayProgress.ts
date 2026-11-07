"use client";

import { CATEGORIES, questions } from "./content";
import type { Question, Run } from "./types";

export const TODAY_PROGRESS_KEY = "pmforge.today-progress.v1";

export type TodayProgress = {
  schemaVersion: 1;
  lit: Record<string, { litAt: string; roomId: string }>;
  inProgress: { scenarioId: string; step: number; startedAt: string } | null;
  daily: { date: string; scenarioId: string; rerolls: number };
  activity: Record<string, number>;
  lastBackupAt: string | null;
  seenLit: string[];
};

const empty = (date = todayKey(), scenarioId = ""): TodayProgress => ({
  schemaVersion: 1,
  lit: {},
  inProgress: null,
  daily: { date, scenarioId, rerolls: 0 },
  activity: {},
  lastBackupAt: null,
  seenLit: [],
});

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function readTodayProgress(): TodayProgress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(TODAY_PROGRESS_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<TodayProgress>;
    if (parsed.schemaVersion !== 1) return empty();
    return {
      ...empty(),
      ...parsed,
      lit: parsed.lit && typeof parsed.lit === "object" ? parsed.lit : {},
      activity: parsed.activity && typeof parsed.activity === "object" ? parsed.activity : {},
      seenLit: Array.isArray(parsed.seenLit) ? parsed.seenLit : [],
    };
  } catch {
    return empty();
  }
}

export function writeTodayProgress(next: TodayProgress) {
  try {
    localStorage.setItem(TODAY_PROGRESS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverageByRoom(runs: Run[]) {
  const done = new Set(runs.filter((run) => run.completedAt).map((run) => run.questionId));
  return Object.fromEntries(
    CATEGORIES.map((room) => [
      room.id,
      questions.filter((q) => q.category === room.id && done.has(q.id)).length,
    ]),
  ) as Record<string, number>;
}

export function litCount(runs: Run[]) {
  return new Set(runs.filter((run) => run.completedAt).map((run) => run.questionId)).size;
}

export function streak(runs: Run[], now = new Date()) {
  const dates = new Set(
    runs
      .filter((run) => run.completedAt)
      .map((run) => todayKey(new Date(run.completedAt!))),
  );
  let count = 0;
  const cursor = new Date(now);
  if (!dates.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(todayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function weekActivity(activity: Record<string, number>, now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - 6 + index);
    const key = todayKey(date);
    return {
      key,
      date,
      count: activity[key] || 0,
      today: index === 6,
    };
  });
}

export function dailyPick(runs: Run[], localUserId: string, offset = 0) {
  const done = new Set(runs.filter((run) => run.completedAt).map((run) => run.questionId));
  const coverage = coverageByRoom(runs);
  let pool = questions.filter((q) => !done.has(q.id));
  if (!pool.length) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRoom = readTodayProgress().daily.scenarioId
    ? questions.find((q) => q.id === readTodayProgress().daily.scenarioId)?.category
    : undefined;
  const avoidingYesterday = pool.filter((q) => q.category !== yesterdayRoom);
  if (avoidingYesterday.length) pool = avoidingYesterday;

  const minRoomCount = Math.min(...pool.map((q) => coverage[q.category] || 0));
  let weighted = pool.filter((q) => (coverage[q.category] || 0) === minRoomCount);
  if (litCount(runs) < 3) {
    const easy = weighted.filter((q) => q.level === "easy");
    if (easy.length) weighted = easy;
  }

  const seed = hash(`${localUserId}:${todayKey()}`);
  const ranked = [...weighted].sort((a, b) => {
    const da = hash(`${seed}:${a.id}`);
    const db = hash(`${seed}:${b.id}`);
    return da === db ? a.id.localeCompare(b.id) : da - db;
  });
  return ranked[((offset % ranked.length) + ranked.length) % ranked.length];
}

export function nextUnlitInRoom(runs: Run[], roomId: string) {
  const done = new Set(runs.filter((run) => run.completedAt).map((run) => run.questionId));
  return questions.find((q) => q.category === roomId && !done.has(q.id)) || null;
}

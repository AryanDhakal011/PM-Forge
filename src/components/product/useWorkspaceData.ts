"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/product/db";
import { useWorkspace } from "./WorkspaceProvider";
export function useWorkspaceData() {
  const { profile } = useWorkspace();
  const runs =
    useLiveQuery(
      () =>
        profile
          ? db.runs
              .where("ownerId")
              .equals(profile.id)
              .reverse()
              .sortBy("updatedAt")
          : [],
      [profile?.id],
    ) || [];
  const records =
    useLiveQuery(
      () =>
        profile
          ? db.records
              .where("ownerId")
              .equals(profile.id)
              .reverse()
              .sortBy("updatedAt")
          : [],
      [profile?.id],
    ) || [];
  const bookmarks =
    useLiveQuery(
      () =>
        profile
          ? db.bookmarks.where("ownerId").equals(profile.id).toArray()
          : [],
      [profile?.id],
    ) || [];
  return { runs, records, bookmarks };
}

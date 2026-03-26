"use client";

import { useSyncExternalStore, useCallback, useState } from "react";
import { Icon } from "@/components/design-system";
import { ThumbsUp, ThumbsDown } from "@/lib/icons";

interface FeedbackWidgetProps {
  pathSlug: string;
  pathTitle: string;
}

function getStorageKey(pathSlug: string) {
  return `kcvv:feedback:${pathSlug}`;
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function FeedbackWidget({ pathSlug, pathTitle }: FeedbackWidgetProps) {
  const storageKey = getStorageKey(pathSlug);

  const getSnapshot = useCallback(
    () => localStorage.getItem(storageKey) === "1",
    [storageKey],
  );
  const getServerSnapshot = useCallback(() => false, []);

  const hasVotedInStorage = useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    getServerSnapshot,
  );

  const [votedLocal, setVotedLocal] = useState(false);
  const voted = hasVotedInStorage || votedLocal;

  const handleVote = async (vote: "up" | "down") => {
    localStorage.setItem(storageKey, "1");
    setVotedLocal(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathSlug, pathTitle, vote }),
      });
    } catch (error) {
      console.error("[FeedbackWidget] Failed to submit feedback:", error);
    }
  };

  if (voted) {
    return (
      <div className="mt-4 text-center text-sm text-gray-500">
        Bedankt voor je feedback!
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-500">
      <span>Was dit nuttig?</span>
      <button
        type="button"
        aria-label="Nuttig"
        onClick={() => handleVote("up")}
        className="rounded-md border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50"
      >
        <Icon icon={ThumbsUp} size="sm" />
      </button>
      <button
        type="button"
        aria-label="Niet nuttig"
        onClick={() => handleVote("down")}
        className="rounded-md border border-gray-200 px-3 py-1 transition-colors hover:bg-gray-50"
      >
        <Icon icon={ThumbsDown} size="sm" />
      </button>
    </div>
  );
}

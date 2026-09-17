"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("FlexGain error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="max-w-md text-center">
        <p className="font-mono-label text-accent-red mb-2">ERROR · SOMETHING BROKE</p>
        <h1 className="text-3xl font-semibold mb-3">
          We hit a rough <span className="text-accent-red">rep.</span>
        </h1>
        <p className="text-fg-muted text-sm mb-6">
          {error.message || "Unexpected error."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-accent-red text-white h-11 px-5 rounded font-medium hover:bg-[#ff4d44]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-border-strong h-11 px-5 rounded font-medium inline-flex items-center hover:border-accent-red"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

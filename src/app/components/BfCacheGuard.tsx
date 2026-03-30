"use client";

import { useEffect } from "react";

export default function BfCacheGuard() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || window.performance?.navigation?.type === 2) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}

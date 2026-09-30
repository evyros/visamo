"use client";

import { useEffect } from "react";

// Document cards start collapsed. When the URL points to one (#doc-…, like
// the history page's link back), open it and bring it into view.
export function OpenLinkedCard() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!(target instanceof HTMLDetailsElement)) return;
      target.open = true;
      target.scrollIntoView();
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}

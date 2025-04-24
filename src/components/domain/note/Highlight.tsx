"use client";

import hljs from "highlight.js";
import { useEffect } from "react";

export function Highlight() {
  useEffect(() => {
    hljs.highlightAll();
  }, []);

  return null;
}

"use client";
import { useEffect } from "react";
import { initLenis } from "@/lib/lenis";

export default function SmoothScroll() {
  useEffect(() => initLenis(), []);
  return null;
}

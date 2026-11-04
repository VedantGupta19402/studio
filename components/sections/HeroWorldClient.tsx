"use client";
import dynamic from "next/dynamic";

// client-only WebGL — never SSR'd (canvas needs window)
const HeroWorld = dynamic(() => import("./HeroWorld"), { ssr: false });

export default function HeroWorldClient() {
  return <HeroWorld />;
}

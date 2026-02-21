"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/auth/user-menu";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          GitHub Profile Analyse
        </Link>
        <nav>{session?.user && <UserMenu />}</nav>
      </div>
    </header>
  );
}

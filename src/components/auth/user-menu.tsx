"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name ?? "Avatar"}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}
      <span className="text-sm font-medium text-white">
        {session.user.name}
      </span>
      <button
        onClick={() => signOut()}
        className="rounded-md bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 cursor-pointer"
      >
        Sair
      </button>
    </div>
  );
}

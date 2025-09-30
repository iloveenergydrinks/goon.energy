"use client";

import { AdminNav } from "./AdminNav";

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  return (
    <header className="space-y-4">
      <AdminNav />
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500">{description}</p>
        )}
      </div>
    </header>
  );
}

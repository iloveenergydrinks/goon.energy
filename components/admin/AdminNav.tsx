import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();
  const isAdminRoot = pathname === "/admin";
  
  if (isAdminRoot) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        ← Return to Builder
      </Link>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        ← Admin Panel
      </Link>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
      >
        Builder
      </Link>
    </div>
  );
}

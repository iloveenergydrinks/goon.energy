export default function Home() {
  return (
    <div className="min-h-screen p-10 bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)] mb-8">
          Welcome to Goon Energy
        </h1>
        <div className="flex gap-4 justify-center">
          <a
            href="/industrial"
            className="px-6 py-3 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            ⚗️ Industrial Complex
          </a>
          <a
            href="/shipbuilder"
            className="px-6 py-3 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            🚀 Ship Builder
          </a>
          <a
            href="/admin"
            className="px-6 py-3 rounded-md border border-neutral-700/70 text-neutral-400 hover:border-neutral-500 hover:text-white transition-colors"
          >
            ⚙️ Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <div 
      className="min-h-screen p-10 flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/9ofk1qvcuwxe1.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0a0a0a'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="text-center relative z-10">
        <h1 className="text-4xl font-bold tracking-[0.35em] uppercase text-white mb-8 drop-shadow-2xl">
          Welcome to Goon Energy
        </h1>
        <div className="flex gap-4 justify-center">
          <a
            href="/industrial"
            className="px-6 py-3 rounded-md bg-black/70 backdrop-blur-sm border border-white/30 text-white hover:bg-black/80 hover:border-white/50 transition-all"
          >
            ⚗️ Industrial Complex
          </a>
          <a
            href="/shipbuilder"
            className="px-6 py-3 rounded-md bg-black/70 backdrop-blur-sm border border-white/30 text-white hover:bg-black/80 hover:border-white/50 transition-all"
          >
            🚀 Ship Builder
          </a>
          <a
            href="/admin"
            className="px-6 py-3 rounded-md bg-black/70 backdrop-blur-sm border border-white/30 text-white hover:bg-black/80 hover:border-white/50 transition-all"
          >
            ⚙️ Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
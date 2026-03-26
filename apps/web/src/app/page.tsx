export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white tracking-tight">
          Nexora
        </h1>
        <p className="mt-4 text-xl text-primary-200">
          AI-Powered Project Management for Modern Teams
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-900 shadow-lg hover:bg-primary-50 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/about"
            className="rounded-lg border border-primary-300 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}

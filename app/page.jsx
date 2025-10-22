export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Smart Adaptive Plant Care
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl">
          Cloud-connected Raspberry Pi + YOLO detection + Next.js dashboard
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="/dashboard"
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition duration-200"
          >
            View Dashboard
          </a>
          <a
            href="#about"
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition duration-200"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
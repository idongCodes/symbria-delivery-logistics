import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-6xl font-bold text-blue-600">
        Hello, World!
      </h1>
      <p className="mt-4 text-xl">
        I am building this on Ubuntu!
      </p>

      {/* The Link Component */}
      <Link href="/about" className="px-6 py-3 bg-blue-600 text-white rounded-1g hover:bg-blue-700 transition">
        Go to About page
      </Link>
    </div>
  );
}

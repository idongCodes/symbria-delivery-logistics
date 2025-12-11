import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-6xl font-bold text-blue-600">
        Symbria RX Logistics
      </h1>
      <p className="mt-4 text-xl">
        Sign in to submit Pre-Trip and more
      </p>

      <Link href="/login" className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
        Login
      </Link>
    </div>
  );
}

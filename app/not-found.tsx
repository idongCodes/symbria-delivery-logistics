export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-700">
        <h1 className="text-9xl font-extrabold text-blue-900 tracking-tighter drop-shadow-sm">
          404
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
          Oops! App temporarily disabled until further notice. Check the driver room as it seems more pre/post-trip papers continue to be printed 🤷🏽‍♂️ .
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      
      {/* Profile Card Container */}
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg">
        
        {/* NextJS Image Component */}
        <Image src="/me.jpg" alt="My Profile Picture" width={150} height={150} className="rounded-full mx-auto mb-6 border-4 border-blue-100" />
	
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
	  Your Name Here
	</h1>

	<p className="text-gray-600 mb-6 leading-relaxed">
	  I am a developer learning Next.js on Ubuntu.
	  I love building fast websites and learning new technologies!
	</p>

	<div className="flex justify-center gap-4">
          <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition transform hover:scale-105">
            Home
	  </Link>

	  <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-300 transition">
            Contact
	  </button>
	</div>

      </div>
    </div>
  );
}

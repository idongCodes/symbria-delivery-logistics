import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 text-center text-sm text-gray-400 border-t border-gray-200 bg-white mt-auto">
      <p>&copy; {currentYear} Symbria Delivery Logistics. All rights reserved.</p>
    </footer>
  );
}

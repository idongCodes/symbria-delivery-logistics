"use client";

import { useState, useEffect } from "react";

export default function BreaksPage() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [breakDuration, setBreakDuration] = useState("15");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnBreak && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnBreak, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleBreak = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const newBreakState = !isOnBreak;
    setIsOnBreak(newBreakState);
    
    if (newBreakState) {
      setTimeLeft(parseInt(breakDuration, 10) * 60);
    } else {
      setTimeLeft(0);
    }

    setNotification(newBreakState ? "You have started your break!" : "You have ended your break!");
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-950 text-center">
        Ready to take a break?
      </h1>
      <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
        All Drivers are permitted to take two 15 minute breaks and one 30 minute break. Please use the buttons below to log your breaks properly.
      </p>

      {notification && (
        <div className="mt-6 p-4 rounded-md text-center text-white bg-green-600 transition-opacity animate-in fade-in duration-300">
          {notification}
        </div>
      )}
      
      <form className="mt-8 max-w-md mx-auto flex flex-col gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm p-2 border transition-colors" 
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name
          </label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm p-2 border transition-colors" 
            required
          />
        </div>
        <div>
          <label htmlFor="breakDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            How long will you be on break?
          </label>
          <select
            id="breakDuration"
            name="breakDuration"
            value={breakDuration}
            onChange={(e) => setBreakDuration(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm p-2 border transition-colors"
            required
            disabled={isOnBreak}
          >
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
          </select>
        </div>
        <button
          onClick={toggleBreak}
          className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOnBreak 
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" 
              : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          }`}
        >
          {isOnBreak ? "End Break" : "Start Break"}
        </button>
      </form>

      {isOnBreak && (
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Time remaining ...
          </h2>
          <div className={`text-5xl font-mono font-bold mt-4 tracking-wider transition-colors ${
            timeLeft <= 40 
              ? "text-red-600 animate-pulse" 
              : "text-blue-600 dark:text-blue-400"
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      )}
    </div>
  );
}
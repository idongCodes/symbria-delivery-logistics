"use client";

import { useState, useEffect } from "react";
import { startBreak, endBreak, getUserBreaks } from "@/app/actions/break-actions";

export default function BreaksPage() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [breakDuration, setBreakDuration] = useState("15");
  const [timeLeft, setTimeLeft] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [activeBreakId, setActiveBreakId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [myBreaks, setMyBreaks] = useState<any[]>([]);
  const [isFetchingBreaks, setIsFetchingBreaks] = useState(false);

  const fetchMyBreaks = async () => {
    if (!firstName || !lastName) {
      setNotification("Please enter first and last name to view history.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsFetchingBreaks(true);
    const result = await getUserBreaks(firstName, lastName);
    if (result.success) {
      setMyBreaks(result.breakLogs || []);
    } else {
      setNotification("Failed to load break history.");
      setTimeout(() => setNotification(null), 3000);
    }
    setIsFetchingBreaks(false);
  };

  // Load existing break state from localStorage on mount
  useEffect(() => {
    const savedBreakId = localStorage.getItem("activeBreakId");
    const savedBreakEnd = localStorage.getItem("activeBreakEnd");
    
    if (savedBreakId && savedBreakEnd) {
      const endTime = parseInt(savedBreakEnd, 10);
      const now = Date.now();
      
      if (now < endTime) {
        setIsOnBreak(true);
        setActiveBreakId(savedBreakId);
        setTimeLeft(Math.floor((endTime - now) / 1000));
        
        // Optionally load saved name and duration
        const savedFirstName = localStorage.getItem("breakFirstName");
        const savedLastName = localStorage.getItem("breakLastName");
        if (savedFirstName) setFirstName(savedFirstName);
        if (savedLastName) setLastName(savedLastName);
      } else {
        // Break has already ended natively
        localStorage.removeItem("activeBreakId");
        localStorage.removeItem("activeBreakEnd");
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isOnBreak && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isOnBreak && timeLeft <= 0) {
      // Time is up, auto-end maybe or just leave it at 0
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isOnBreak, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      setNotification("Please enter your first and last name.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsLoading(true);
    const durationNum = parseInt(breakDuration, 10);
    
    const result = await startBreak({ firstName, lastName, duration: durationNum });
    
    if (result.success && result.breakLogId) {
      const endTime = Date.now() + durationNum * 60 * 1000;
      
      setIsOnBreak(true);
      setActiveBreakId(result.breakLogId);
      setTimeLeft(durationNum * 60);
      
      // Save to localStorage so it persists on reload
      localStorage.setItem("activeBreakId", result.breakLogId);
      localStorage.setItem("activeBreakEnd", endTime.toString());
      localStorage.setItem("breakFirstName", firstName);
      localStorage.setItem("breakLastName", lastName);
      
      setNotification("You have started your break!");
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification("Failed to start break. Please try again.");
      setTimeout(() => setNotification(null), 3000);
    }
    setIsLoading(false);
  };

  const handleEndBreak = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeBreakId) return;

    setIsLoading(true);
    const result = await endBreak(activeBreakId);
    
    if (result.success) {
      setIsOnBreak(false);
      setActiveBreakId(null);
      setTimeLeft(0);
      
      localStorage.removeItem("activeBreakId");
      localStorage.removeItem("activeBreakEnd");
      
      setNotification("You have ended your break!");
      setFirstName("");
      setLastName("");
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification("Failed to end break. Please try again.");
      setTimeout(() => setNotification(null), 3000);
    }
    setIsLoading(false);
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
        <div className={`mt-6 p-4 rounded-md text-center text-white transition-opacity animate-in fade-in duration-300 ${notification.includes("Failed") || notification.includes("Please") ? "bg-red-600" : "bg-green-600"}`}>
          {notification}
        </div>
      )}
      
      <form onSubmit={isOnBreak ? (e) => e.preventDefault() : handleStartBreak} className="mt-8 max-w-md mx-auto flex flex-col gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm p-2 border transition-colors" 
            required
            disabled={isOnBreak || isLoading}
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
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white sm:text-sm p-2 border transition-colors" 
            required
            disabled={isOnBreak || isLoading}
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
            disabled={isOnBreak || isLoading}
          >
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
          </select>
        </div>
        
        {isOnBreak ? (
          <button
            onClick={handleEndBreak}
            disabled={isLoading}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400"
          >
            {isLoading ? "Processing..." : "End Break"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400"
          >
             {isLoading ? "Processing..." : "Start Break"}
          </button>
        )}
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

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
          My Break History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          Enter your first and last name above, then click below to view your past breaks.
        </p>
        <button
          onClick={fetchMyBreaks}
          disabled={isFetchingBreaks || !firstName || !lastName}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isFetchingBreaks ? "Loading..." : "Load My Breaks"}
        </button>

        {myBreaks.length > 0 && (
          <div className="mt-6 space-y-4">
            {myBreaks.map((b) => (
              <div key={b.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {b.first_name} {b.last_name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Started: {new Date(b.start_time).toLocaleString()}</p>
                  {b.end_time && <p>Ended: {new Date(b.end_time).toLocaleString()}</p>}
                  <p>Duration: {b.duration} mins</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

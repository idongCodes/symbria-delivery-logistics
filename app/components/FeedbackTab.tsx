'use client';

import { useEffect, useState } from 'react';
import FeedbackTable from './FeedbackTable';
import { getFeedback } from '@/app/actions/feedback-actions';

export default function FeedbackTab() {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await getFeedback();
      setFeedbackList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Feedback</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading messages..." : `${feedbackList.length} Messages`}
          </p>
        </div>
        <button 
          onClick={fetchFeedback}
          disabled={loading}
          className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      
      <FeedbackTable initialData={feedbackList} onRefresh={fetchFeedback} />
    </div>
  );
}

// app/admin/feedback/page.tsx
import { prisma } from '@/lib/prisma';
import FeedbackTable from './feedback-table';

export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  // 1. Fetch data directly from the database
  const feedbackList = await prisma.feedback.findMany({
    orderBy: {
      createdAt: 'desc', // Newest first
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Feedback</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full">
          {feedbackList.length} Messages
        </span>
      </div>

      {/* 2. Render the interactive table */}
      <FeedbackTable initialData={feedbackList} />
    </div>
  );
}

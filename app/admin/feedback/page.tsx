import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This line ensures the page always fetches the latest data (no caching)
export const dynamic = 'force-dynamic';

export default async function AdminFeedbackPage() {
  // Fetch all feedback, newest first
  const feedbacks = await prisma.feedback.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Feedback Inbox</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {feedbacks.length} Messages
        </span>
      </div>
      
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No feedback messages yet.</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                  <a href={`mailto:${item.email}`} className="text-sm text-blue-600 hover:underline">
                    {item.email}
                  </a>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap">{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

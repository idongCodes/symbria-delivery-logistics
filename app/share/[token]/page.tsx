import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import LogViewer from '@/app/components/LogViewer';
import LogDownloadButton from '@/app/logs/[id]/LogDownloadButton';

export const dynamic = 'force-dynamic';

export default async function PublicLogPage({ 
  params 
}: { 
  params: Promise<{ token: string }> 
}) {
  const { token } = await params;

  const log = await prisma.tripLog.findUnique({
    where: { share_token: token },
  });

  if (!log) return notFound();

  // Prepare data
  const serializableLog = {
    ...log,
    odometer: log.odometer?.toString() || "0",
    created_at: log.created_at.toISOString(),
    updated_at: log.updated_at.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* PUBLIC HEADER */}
        <div className="bg-blue-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Trip Log #{log.id}</h1>
            <p className="text-blue-200 text-sm mt-1">
              Public View • Submitted by {log.driver_name || 'Unknown'}
            </p>
          </div>
          <LogDownloadButton log={serializableLog} />
        </div>

        {/* REUSED VIEWER */}
        <LogViewer log={serializableLog} />
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 text-center text-xs text-gray-500">
          Symbria RX Logistics • Public Record
        </div>
      </div>
    </div>
  );
}
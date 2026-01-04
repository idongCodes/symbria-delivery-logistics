import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LogDownloadButton from './LogDownloadButton';
import ShareButton from './ShareButton';
import LogViewer from '@/app/components/LogViewer'; // 👈 Import new viewer

export const dynamic = 'force-dynamic';

export default async function LogPreviewPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params; 
  const logId = parseInt(id);

  if (isNaN(logId)) return notFound();

  const log = await prisma.tripLog.findUnique({
    where: { id: logId },
  });

  if (!log) return notFound();

  // Prepare data for Client Components
  const serializableLog = {
    ...log,
    odometer: log.odometer?.toString() || "0",
    created_at: log.created_at.toISOString(),
    updated_at: log.updated_at.toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trip Log #{log.id}</h1>
               <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                 log.trip_type === 'Pre-Trip' 
                   ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                   : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
               }`}>
                 {log.trip_type}
               </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Submitted by <span className="font-medium text-gray-800 dark:text-gray-200">{log.driver_name || 'Unknown'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* 👇 SHARE BUTTON */}
            <ShareButton logId={log.id} />
            
            {/* DOWNLOAD BUTTON */}
            <LogDownloadButton log={serializableLog} />
            
            <Link href="/dashboard" className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Back
            </Link>
          </div>
        </div>

        {/* 👇 REUSED LOG VIEWER */}
        <LogViewer log={serializableLog} />

      </div>
    </div>
  );
}
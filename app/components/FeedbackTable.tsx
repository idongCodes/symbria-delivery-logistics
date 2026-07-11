'use client';

import { useState } from 'react';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import EnvelopeOpenIcon from '@heroicons/react/24/outline/EnvelopeOpenIcon';
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon';

import { deleteFeedback, markAsRead } from '@/app/actions/feedback-actions';

type FeedbackItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

export default function FeedbackTable({ initialData, onRefresh }: { initialData: FeedbackItem[], onRefresh: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === initialData.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(initialData.map((item) => item.id)); 
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete the selected items?')) return;
    setIsPending(true);
    try {
      await deleteFeedback(selectedIds);
      setSelectedIds([]); 
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error deleting feedback.");
    } finally {
      setIsPending(false);
    }
  };

  const handleBulkRead = async (status: boolean) => {
    setIsPending(true);
    try {
      await markAsRead(selectedIds, status);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error updating feedback.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    setIsPending(true);
    try {
      await deleteFeedback([id]);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error deleting feedback.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 relative">
      
      {isPending && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 p-4 flex flex-wrap gap-4 items-center border-b border-blue-100 animate-in fade-in slide-in-from-top-2 sticky top-0 z-20">
          <span className="text-sm font-semibold text-blue-800">
            {selectedIds.length} selected
          </span>
          
          <div className="flex gap-2 ml-auto">
            <button 
              onClick={() => handleBulkRead(true)}
              className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
            >
              <EnvelopeOpenIcon className="w-4 h-4" /> <span className="hidden sm:inline">Mark Read</span>
            </button>
            <button 
              onClick={() => handleBulkRead(false)}
              className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
            >
              <EnvelopeIcon className="w-4 h-4" /> <span className="hidden sm:inline">Mark Unread</span>
            </button>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 shadow-sm"
            >
              <TrashIcon className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-200">
            <tr>
              <th scope="col" className="p-4 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={selectedIds.length === initialData.length && initialData.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">From</th>
              <th scope="col" className="px-4 py-3 font-medium w-full">Message</th>
              <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {initialData.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="p-12 text-center text-gray-400 italic flex flex-col items-center">
                    <EnvelopeIcon className="w-12 h-12 text-gray-200 mb-3" />
                    No feedback received yet.
                  </div>
                </td>
              </tr>
            ) : (
              initialData.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${item.read ? 'bg-white text-gray-600' : 'bg-blue-50/30 text-gray-900 font-semibold'}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {item.read ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> New
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[150px]">{item.name}</span>
                      <a href={`mailto:${item.email}`} className="text-xs text-blue-500 hover:underline truncate max-w-[150px]" onClick={e => e.stopPropagation()}>
                        {item.email}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-normal min-w-[300px]">
                    <p className={`text-sm line-clamp-2 ${item.read ? 'text-gray-600' : 'text-gray-800'}`}>
                      {item.message}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDeleteSingle(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

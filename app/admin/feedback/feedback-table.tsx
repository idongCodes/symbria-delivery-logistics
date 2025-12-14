// app/admin/feedback/feedback-table.tsx
'use client';

import { useState } from 'react';
import { 
  TrashIcon, 
  EnvelopeOpenIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';
import { deleteFeedback, markAsRead } from './actions';

type FeedbackItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  read: boolean;
};

export default function FeedbackTable({ initialData }: { initialData: FeedbackItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  // --- HANDLERS ---

  // Toggle a single checkbox
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle "Select All"
  const toggleSelectAll = () => {
    if (selectedIds.length === initialData.length) {
      setSelectedIds([]); // Deselect all
    } else {
      setSelectedIds(initialData.map((item) => item.id)); // Select all
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (!confirm('Are you sure you want to delete the selected items?')) return;
    setIsPending(true);
    await deleteFeedback(selectedIds);
    setSelectedIds([]); 
    setIsPending(false);
  };

  const handleBulkRead = async (status: boolean) => {
    setIsPending(true);
    await markAsRead(selectedIds, status);
    setSelectedIds([]);
    setIsPending(false);
  };

  // Individual Delete
  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    setIsPending(true);
    await deleteFeedback([id]);
    setIsPending(false);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 relative">
      
      {/* LOADING OVERLAY */}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* BULK ACTIONS TOOLBAR (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 p-4 flex gap-4 items-center border-b border-blue-100 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-semibold text-blue-800">
            {selectedIds.length} selected
          </span>
          
          <button 
            onClick={() => handleBulkRead(true)}
            className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            <EnvelopeOpenIcon className="w-4 h-4" /> Mark Read
          </button>
          
          <button 
            onClick={() => handleBulkRead(false)}
            className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 shadow-sm"
          >
            <EnvelopeIcon className="w-4 h-4" /> Mark Unread
          </button>
          
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-xs bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 ml-auto shadow-sm"
          >
            <TrashIcon className="w-4 h-4" /> Delete Selected
          </button>
        </div>
      )}

      {/* TABLE */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left w-10">
              <input 
                type="checkbox" 
                checked={selectedIds.length === initialData.length && initialData.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {initialData.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                No feedback received yet.
              </td>
            </tr>
          ) : (
            initialData.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 transition-colors ${!item.read ? 'bg-blue-50/30' : ''}`}
              >
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                  <br />
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.email}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 line-clamp-2 max-w-prose">
                    {item.message}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.read
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.read ? 'Read' : 'New'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => handleDeleteSingle(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    title="Delete Message"
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
  );
}

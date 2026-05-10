'use client';
import { useState } from 'react';
import { BookOpen, Search, Clock, Trash2, Edit2, ChevronRight, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const mockNotes = [
  { id: '1', questionId: 'q1', content: 'For permutation problems, use nPr = n! / (n-r)!', approach: 'Counting techniques', formula: 'nPr = n!/(n-r)!', createdAt: '2024-01-15T10:30:00', updatedAt: '2024-01-15T10:30:00' },
  { id: '2', questionId: 'q2', content: 'When solving DI sets, start with the easiest questions first', approach: 'Strategy', createdAt: '2024-01-14T15:20:00', updatedAt: '2024-01-14T15:20:00' },
  { id: '3', questionId: 'q3', content: 'Percentage change formula: (New-Old)/Old × 100', approach: 'Percentages', formula: '% change = (N-O)/O × 100', createdAt: '2024-01-13T09:00:00', updatedAt: '2024-01-13T09:00:00' },
];

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<typeof mockNotes[0] | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredNotes = mockNotes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.approach?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
      <div className="w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">My Notes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mockNotes.length} notes</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`w-full p-4 text-left border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                selectedNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{note.content}</p>
              {note.approach && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <Tag className="w-3 h-3" /> {note.approach}
                </span>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDate(note.createdAt)}
              </div>
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notes found</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedNote ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Note Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created {formatDate(selectedNote.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Content</label>
                  <p className="text-gray-900 dark:text-white">{selectedNote.content}</p>
                </div>

                {selectedNote.approach && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Approach</label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
                        {selectedNote.approach}
                      </span>
                    </div>
                  </div>
                )}

                {selectedNote.formula && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Formula</label>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono text-lg text-gray-900 dark:text-white">
                      {selectedNote.formula}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t dark:border-gray-700">
                  <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                    Go to Question <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Select a note to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

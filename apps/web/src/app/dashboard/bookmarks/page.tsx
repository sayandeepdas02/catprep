'use client';
import { useState } from 'react';
import { Bookmark as BookmarkIcon, Search, Clock, Trash2, Tag, Filter, Grid, List, ExternalLink } from 'lucide-react';

const mockBookmarks = [
  { id: '1', questionId: 'q1', questionText: 'If x + y = 10 and x - y = 4, find x and y', difficulty: 'medium', subject: 'Quantitative', tags: ['algebra', 'equations'], createdAt: '2024-01-15T10:30:00' },
  { id: '2', questionId: 'q2', questionText: 'Find the probability of drawing a red ball from a bag containing...', difficulty: 'hard', subject: 'Quantitative', tags: ['probability', 'important'], createdAt: '2024-01-14T15:20:00' },
  { id: '3', questionId: 'q3', questionText: 'Which of the following is not a prime number?', difficulty: 'easy', subject: 'Verbal', tags: ['vocabulary'], createdAt: '2024-01-13T09:00:00' },
  { id: '4', questionId: 'q4', questionText: 'Complete the analogy: Book : Read :: Food : ?', difficulty: 'medium', subject: 'Verbal', tags: ['analogy'], createdAt: '2024-01-12T14:30:00' },
];

const difficultyColors = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function BookmarksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(mockBookmarks.flatMap(b => b.tags)));

  const filteredBookmarks = mockBookmarks.filter(b => {
    const matchesSearch = b.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => b.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <BookmarkIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mockBookmarks.length} saved questions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[bookmark.difficulty as keyof typeof difficultyColors]}`}>
                    {bookmark.difficulty}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(bookmark.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white mb-3 line-clamp-3">{bookmark.questionText}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    {bookmark.subject}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {bookmark.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t dark:border-gray-700">
                  <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    Practice
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Question</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Difficulty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredBookmarks.map((bookmark) => (
                  <tr key={bookmark.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-md">
                      <span className="line-clamp-1">{bookmark.questionText}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{bookmark.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[bookmark.difficulty as keyof typeof difficultyColors]}`}>
                        {bookmark.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(bookmark.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 text-gray-400 hover:text-purple-600">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredBookmarks.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BookmarkIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No bookmarks found</p>
          </div>
        )}
      </div>
    </div>
  );
}

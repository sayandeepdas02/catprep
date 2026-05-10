'use client';
import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutItem {
  key: string;
  category: string;
  description: string;
  action: string;
}

const shortcutsList: ShortcutItem[] = [
  { key: 'Ctrl + N', category: 'Navigation', description: 'New practice session', action: 'Start session' },
  { key: 'Ctrl + K', category: 'Navigation', description: 'Open global search', action: 'Search' },
  { key: 'Ctrl + B', category: 'Navigation', description: 'Go to bookmarks', action: 'Bookmarks' },
  { key: 'Ctrl + D', category: 'Navigation', description: 'Go to dashboard', action: 'Dashboard' },
  { key: 'Escape', category: 'General', description: 'Close modal or dialog', action: 'Close' },
  { key: '?', category: 'General', description: 'Show keyboard shortcuts', action: 'Help' },
  { key: 'Space', category: 'Practice', description: 'Start/pause timer', action: 'Timer' },
  { key: 'Ctrl + S', category: 'Practice', description: 'Submit answer', action: 'Submit' },
  { key: 'R', category: 'Practice', description: 'Mark for review', action: 'Review' },
  { key: 'N', category: 'Practice', description: 'Skip to next question', action: 'Next' },
  { key: 'P', category: 'Practice', description: 'Go to previous question', action: 'Previous' },
  { key: 'Ctrl + 1-4', category: 'Practice', description: 'Select answer option', action: 'Select' },
];

const categories = [...new Set(shortcutsList.map(s => s.category))];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {categories.map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {shortcutsList
                      .filter(s => s.category === category)
                      .map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                          <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> anytime to toggle this dialog
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

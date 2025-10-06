'use client';

import { useState } from 'react';

interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link: string;
  pdf_link: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchPapers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setPapers([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, max_results: 10 }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      setPapers(data.papers);
    } catch (err) {
      setError('Failed to search papers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          arXiv Paper Search
        </h1>

        <form onSubmit={searchPapers} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for papers (e.g., machine learning, quantum computing...)"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {papers.length > 0 && (
          <div className="space-y-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {paper.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Authors:</span> {paper.authors.join(', ')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-medium">Published:</span>{' '}
                  {new Date(paper.published).toLocaleDateString()}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                  {paper.summary}
                </p>
                <div className="flex gap-3">
                  <a
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View Abstract
                  </a>
                  <a
                    href={paper.pdf_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline font-medium"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Searching arXiv...</p>
          </div>
        )}

        {!loading && papers.length === 0 && !error && query && (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No papers found. Try a different search query.
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';

interface ArxivPaper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  categories: string[];
  primaryCategory: string;
  link: string;
  pdf_link: string;
  relevanceScore?: number;
}

const ARXIV_CATEGORIES = [
  { value: 'cs.AI', label: 'Artificial Intelligence' },
  { value: 'cs.LG', label: 'Machine Learning' },
  { value: 'cs.CV', label: 'Computer Vision' },
  { value: 'cs.CL', label: 'Computation and Language (NLP)' },
  { value: 'cs.NE', label: 'Neural and Evolutionary Computing' },
  { value: 'stat.ML', label: 'Machine Learning (Statistics)' },
  { value: 'cs.RO', label: 'Robotics' },
  { value: 'cs.CR', label: 'Cryptography and Security' },
  { value: 'quant-ph', label: 'Quantum Physics' },
  { value: 'physics', label: 'Physics' },
  { value: 'math', label: 'Mathematics' },
  { value: 'q-bio', label: 'Quantitative Biology' },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [searchIn, setSearchIn] = useState<'all' | 'title' | 'abstract' | 'author'>('all');

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

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
        body: JSON.stringify({
          query,
          categories: selectedCategories,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          authors: authorFilter || undefined,
          maxResults,
          sortBy,
          searchIn
        }),
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'cs.AI': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'cs.LG': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'cs.CV': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'cs.CL': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'cs.NE': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'stat.ML': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            arXiv Research Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Advanced search with smart relevance ranking
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={searchPapers} className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            {/* Main Search */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for papers (e.g., transformer architectures, quantum entanglement...)"
                className="flex-1 px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>

            {/* Search Options */}
            <div className="flex gap-4 mb-4">
              <select
                value={searchIn}
                onChange={(e) => setSearchIn(e.target.value as 'all' | 'title' | 'abstract' | 'author')}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">Search in: All fields</option>
                <option value="title">Search in: Title only</option>
                <option value="abstract">Search in: Abstract only</option>
                <option value="author">Search in: Author only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="date">Sort by: Date</option>
              </select>

              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="10">Show: 10 results</option>
                <option value="20">Show: 20 results</option>
                <option value="50">Show: 50 results</option>
                <option value="100">Show: 100 results</option>
              </select>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {showFilters ? '▲' : '▼'} Advanced Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      placeholder="From"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>

                {/* Author Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Author
                  </label>
                  <input
                    type="text"
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    placeholder="Enter author name..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ARXIV_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategories.includes(cat.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Results Count */}
        {papers.length > 0 && (
          <div className="mb-4 text-gray-600 dark:text-gray-400">
            Found <span className="font-semibold text-gray-900 dark:text-white">{papers.length}</span> papers
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-4">
            {papers.map((paper, index) => (
              <div
                key={paper.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {sortBy === 'relevance' && paper.relevanceScore && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded">
                          Relevance: {paper.relevanceScore.toFixed(0)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        arXiv:{paper.arxivId}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white leading-tight">
                      {paper.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {paper.categories.slice(0, 5).map((cat) => (
                    <span
                      key={cat}
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(cat)}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Authors:</span>{' '}
                  {paper.authors.slice(0, 5).join(', ')}
                  {paper.authors.length > 5 && ` +${paper.authors.length - 5} more`}
                </p>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span className="font-medium">Published:</span>{' '}
                  {new Date(paper.published).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {paper.summary.length > 300
                    ? paper.summary.substring(0, 300) + '...'
                    : paper.summary}
                </p>

                <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={paper.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    📄 View Abstract
                  </a>
                  <a
                    href={paper.pdf_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    📥 Download PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Searching arXiv with advanced filters...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && papers.length === 0 && !error && (
          <div className="text-center py-16 px-4">
            <div className="text-6xl mb-4">🔬</div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to find the perfect research paper?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Use advanced filters, category selection, and smart relevance ranking to find exactly what you need.
              Try searching for specific terms, filter by date range, or narrow down by research category.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

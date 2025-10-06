import { NextRequest, NextResponse } from 'next/server';

interface SearchFilters {
  query: string;
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  authors?: string;
  maxResults?: number;
  sortBy?: 'relevance' | 'date' | 'citations';
  searchIn?: 'all' | 'title' | 'abstract' | 'author';
}

interface Paper {
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

export async function POST(request: NextRequest) {
  try {
    const body: SearchFilters = await request.json();
    const {
      query,
      categories = [],
      dateFrom,
      dateTo,
      authors,
      maxResults = 20,
      sortBy = 'relevance',
      searchIn = 'all'
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Build advanced search query
    const searchQuery = buildSearchQuery(query, searchIn, categories, authors);

    // Search arXiv with advanced parameters
    const searchParams = new URLSearchParams({
      search_query: searchQuery,
      start: '0',
      max_results: (maxResults * 2).toString(), // Fetch more for better filtering
      sortBy: sortBy === 'date' ? 'submittedDate' : 'relevance',
      sortOrder: 'descending'
    });

    const arxivUrl = `http://export.arxiv.org/api/query?${searchParams}`;
    const response = await fetch(arxivUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch from arXiv API');
    }

    const xmlText = await response.text();

    // Parse XML response
    let papers: Paper[] = parseArxivXML(xmlText);

    // Apply date filtering
    if (dateFrom || dateTo) {
      papers = filterByDate(papers, dateFrom, dateTo);
    }

    // Calculate relevance scores
    const papersWithScores = papers.map(paper => ({
      ...paper,
      relevanceScore: calculateRelevanceScore(paper, query)
    }));

    // Sort based on preference
    if (sortBy === 'relevance') {
      papersWithScores.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else if (sortBy === 'date') {
      papersWithScores.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }

    // Limit results
    const finalPapers = papersWithScores.slice(0, maxResults);

    return NextResponse.json({
      papers: finalPapers,
      total: finalPapers.length,
      filters: {
        categories,
        dateFrom,
        dateTo,
        sortBy
      }
    });
  } catch (error) {
    console.error('Error searching papers:', error);
    return NextResponse.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    );
  }
}

function buildSearchQuery(
  query: string,
  searchIn: string,
  categories: string[],
  authors?: string
): string {
  const searchParts: string[] = [];

  // Search in specific fields
  if (searchIn === 'title') {
    searchParts.push(`ti:"${query}"`);
  } else if (searchIn === 'abstract') {
    searchParts.push(`abs:"${query}"`);
  } else if (searchIn === 'author') {
    searchParts.push(`au:"${query}"`);
  } else {
    searchParts.push(`all:"${query}"`);
  }

  // Add category filters
  if (categories.length > 0) {
    const catQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
    searchParts.push(`AND (${catQuery})`);
  }

  // Add author filter
  if (authors) {
    searchParts.push(`AND au:"${authors}"`);
  }

  return searchParts.join(' ');
}

function calculateRelevanceScore(paper: Paper, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  const titleLower = paper.title.toLowerCase();
  const summaryLower = paper.summary.toLowerCase();

  // Title matching (highest weight)
  queryTerms.forEach(term => {
    if (titleLower.includes(term)) {
      score += 10;
      // Exact phrase bonus
      if (titleLower.includes(queryLower)) {
        score += 20;
      }
    }
  });

  // Abstract matching (medium weight)
  queryTerms.forEach(term => {
    const count = (summaryLower.match(new RegExp(term, 'g')) || []).length;
    score += count * 2;
  });

  // Recent papers bonus (papers from last 6 months)
  const publishedDate = new Date(paper.published);
  const monthsOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld < 6) {
    score += 5;
  }

  // Author count penalty (highly collaborative papers might be less focused)
  if (paper.authors.length > 10) {
    score -= 2;
  }

  // Summary length bonus (detailed papers)
  if (paper.summary.length > 1000) {
    score += 3;
  }

  return score;
}

function filterByDate(papers: Paper[], dateFrom?: string, dateTo?: string): Paper[] {
  return papers.filter(paper => {
    const publishedDate = new Date(paper.published);

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (publishedDate < fromDate) return false;
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (publishedDate > toDate) return false;
    }

    return true;
  });
}

function parseArxivXML(xmlText: string) {
  const papers = [];

  // Simple XML parsing using regex (for basic use)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries = xmlText.match(entryRegex);

  if (!entries) return [];

  for (const entry of entries) {
    try {
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, ' ') || '';
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim().replace(/\s+/g, ' ') || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      const updated = entry.match(/<updated>(.*?)<\/updated>/)?.[1] || published;

      // Extract authors
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g);
      const authors = authorMatches?.map(match => {
        const name = match.match(/<name>(.*?)<\/name>/)?.[1];
        return name || '';
      }).filter(Boolean) || [];

      // Extract categories
      const categoryMatches = entry.match(/<category[^>]*term="([^"]*)"/g);
      const categories = categoryMatches?.map(match => {
        const term = match.match(/term="([^"]*)"/)?.[1];
        return term || '';
      }).filter(Boolean) || [];

      // Extract links
      const linkMatches = entry.match(/<link[^>]*href="([^"]*)"[^>]*type="([^"]*)"/g);
      let pdfLink = '';

      if (linkMatches) {
        for (const link of linkMatches) {
          const href = link.match(/href="([^"]*)"/)?.[1];
          if (href?.includes('pdf')) {
            pdfLink = href;
            break;
          }
        }
      }

      if (!pdfLink) {
        pdfLink = id.replace('/abs/', '/pdf/') + '.pdf';
      }

      // Extract arXiv ID for cleaner display
      const arxivId = id.match(/arxiv\.org\/abs\/([\d.]+)/)?.[1] || '';

      papers.push({
        id,
        arxivId,
        title,
        authors,
        summary,
        published,
        updated,
        categories,
        primaryCategory: categories[0] || 'Unknown',
        link: id,
        pdf_link: pdfLink
      });
    } catch (err) {
      console.error('Error parsing entry:', err);
    }
  }

  return papers;
}

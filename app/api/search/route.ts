import { NextRequest, NextResponse } from 'next/server';

interface ArxivEntry {
  id: { _text: string };
  title: { _text: string };
  summary: { _text: string };
  published: { _text: string };
  author: Array<{ name: { _text: string } }> | { name: { _text: string } };
  link: Array<{ _attributes: { href: string; type?: string } }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, max_results = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Search arXiv directly using their API
    const searchParams = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: max_results.toString(),
      sortBy: 'submittedDate',
      sortOrder: 'descending'
    });

    const arxivUrl = `http://export.arxiv.org/api/query?${searchParams}`;
    const response = await fetch(arxivUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch from arXiv API');
    }

    const xmlText = await response.text();

    // Parse XML response
    const papers = parseArxivXML(xmlText);

    return NextResponse.json({ papers, total: papers.length });
  } catch (error) {
    console.error('Error searching papers:', error);
    return NextResponse.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    );
  }
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

      // Extract authors
      const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g);
      const authors = authorMatches?.map(match => {
        const name = match.match(/<name>(.*?)<\/name>/)?.[1];
        return name || '';
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

      papers.push({
        id,
        title,
        authors,
        summary,
        published,
        link: id,
        pdf_link: pdfLink
      });
    } catch (err) {
      console.error('Error parsing entry:', err);
    }
  }

  return papers;
}

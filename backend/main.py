"""
FastAPI backend for searching arXiv papers.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import arxiv
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="arXiv Paper Search API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    """Request model for paper search."""
    query: str
    max_results: int = 10


class ArxivPaper(BaseModel):
    """Response model for arXiv paper."""
    id: str
    title: str
    authors: List[str]
    summary: str
    published: str
    link: str
    pdf_link: str


class SearchResponse(BaseModel):
    """Response model for search results."""
    papers: List[ArxivPaper]
    total: int


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "arXiv Paper Search API is running"
    }


@app.post("/search", response_model=SearchResponse)
async def search_papers(request: SearchRequest):
    """
    Search for papers on arXiv.

    Args:
        request: SearchRequest containing query and max_results

    Returns:
        SearchResponse with list of papers

    Raises:
        HTTPException: If search fails
    """
    try:
        # Create arXiv search client
        search = arxiv.Search(
            query=request.query,
            max_results=request.max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        papers = []
        for result in search.results():
            paper = ArxivPaper(
                id=result.entry_id,
                title=result.title,
                authors=[author.name for author in result.authors],
                summary=result.summary.replace('\n', ' ').strip(),
                published=result.published.isoformat(),
                link=result.entry_id,
                pdf_link=result.pdf_url
            )
            papers.append(paper)

        return SearchResponse(papers=papers, total=len(papers))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search arXiv: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

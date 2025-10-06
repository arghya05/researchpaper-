# arXiv Research Paper Search

A modern, full-stack web application for searching and exploring the latest research papers from arXiv. Built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- 🔍 **Real-time Search**: Search arXiv papers by keyword with instant results
- 📄 **Paper Details**: View titles, authors, abstracts, and publication dates
- 📥 **Direct Access**: Quick links to paper abstracts and PDF downloads
- 🎨 **Modern UI**: Responsive design with dark mode support
- ⚡ **Fast & Serverless**: Optimized for Vercel deployment with no backend needed
- 🌐 **Production Ready**: Fully deployed and working on Vercel

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: arXiv API (direct integration)
- **Deployment**: Vercel

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/arghya05/researchpaper-.git
cd researchpaper-
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🌐 Deployment

This app is optimized for Vercel deployment:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy with one click - no environment variables needed!

The app works entirely on serverless functions - no separate backend required.

## 🔍 Usage

1. Enter a search term (e.g., "machine learning", "quantum computing", "neural networks")
2. Click "Search" to fetch the latest papers from arXiv
3. Browse through results with titles, authors, and summaries
4. Click "View Abstract" to see full details on arXiv
5. Click "Download PDF" to get the paper

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts    # arXiv API integration
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main search page
│   └── globals.css         # Global styles
├── backend/                # Legacy FastAPI code (not used in production)
├── public/                 # Static assets
└── vercel.json            # Vercel configuration
```

## 🔧 API Endpoint

### `POST /api/search`

Search for papers on arXiv.

**Request Body:**
```json
{
  "query": "machine learning",
  "max_results": 10
}
```

**Response:**
```json
{
  "papers": [
    {
      "id": "http://arxiv.org/abs/2301.12345",
      "title": "Paper Title",
      "authors": ["Author 1", "Author 2"],
      "summary": "Paper summary...",
      "published": "2023-01-15T00:00:00Z",
      "link": "http://arxiv.org/abs/2301.12345",
      "pdf_link": "http://arxiv.org/pdf/2301.12345.pdf"
    }
  ],
  "total": 10
}
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT

## 👨‍💻 Author

Created by [arghya05](https://github.com/arghya05)

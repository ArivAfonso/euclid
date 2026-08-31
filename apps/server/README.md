# Stock Image API - Cloudflare Workers

A Cloudflare Worker API that searches and retrieves CC0/free stock images from Unsplash, Pixabay, and Flickr, plus Google Fonts. Built with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

## Features

- 🔍 Search stock images across multiple platforms
- 📸 Support for Unsplash, Pixabay, and Flickr (CC0 only)
- 🎨 Google Fonts integration with caching
- 🔑 API key validation and graceful fallbacks
- 📋 OpenAPI 3.1 compliant with auto-generated documentation
- ⚡ Fast serverless deployment on Cloudflare Workers
- 💾 Built-in caching for improved performance

## API Endpoints

### Image Search

- `GET /api/images/search` - Search for stock images
  - Query parameters: `query`, `page`, `per_page`, `sources`
  - Returns aggregated results from enabled sources

### Image Details

- `GET /api/images/{imageId}` - Get detailed information about a specific image
  - Returns full image metadata including license info

### Font Search

- `GET /api/fonts/all` - Search Google Fonts
  - Query parameters: `query`, `category`, `sort`, `subset`
  - Returns cached list of Google Fonts that persists indefinitely after the first fetch

### Font Details

- `GET /api/fonts/{fontFamily}` - Get detailed information about a specific font
  - Returns full font metadata including variants, subsets, and files

## Setup & Installation

### 1. Clone and Install

```bash
git clone <your-repo>
cd <your-repo>
npm install
```

### 2. Configure API Keys

Copy the example environment file and add your API keys:

```bash
copy .env.example .env
```

Edit `.env` and add your API keys:

```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
PIXABAY_API_KEY=your_pixabay_api_key_here
FLICKR_API_KEY=your_flickr_api_key_here
GOOGLE_FONTS_API_KEY=your_google_fonts_api_key_here
```

### 3. Get API Keys (Free)

- **Unsplash**: [https://unsplash.com/developers](https://unsplash.com/developers)
- **Pixabay**: [https://pixabay.com/api/docs/](https://pixabay.com/api/docs/)
- **Flickr**: [https://www.flickr.com/services/api/](https://www.flickr.com/services/api/)

## Running Locally

### Development Server

```bash
npm run dev
# or
wrangler dev
```

The API will be available at `http://localhost:8787/`

### View API Documentation

Open `http://localhost:8787/` in your browser to see the interactive Swagger UI where you can test all endpoints.

### Test the API

```bash
# Search for nature images
curl "http://localhost:8787/api/images/search?query=nature&per_page=10"

# Get details for a specific image
curl "http://localhost:8787/api/images/unsplash-abc123"
```

## Deployment

### Deploy to Cloudflare Workers

1. Login to Cloudflare:

```bash
wrangler login
```

2. Set environment variables:

```bash
wrangler secret put UNSPLASH_ACCESS_KEY
wrangler secret put PIXABAY_API_KEY
wrangler secret put FLICKR_API_KEY
```

3. Deploy:

```bash
npm run deploy
# or
wrangler deploy
```

## Project Structure

```
src/
├── index.ts              # Main router and OpenAPI setup
├── types.ts              # TypeScript types and Zod schemas
└── endpoints/
    ├── imageSearch.ts    # Image search endpoint
    ├── imageDetails.ts   # Image details endpoint
    └── task*.ts          # Example task endpoints
```

## API Key Validation

The API gracefully handles missing API keys:

- If an API key is missing, that service is skipped
- Warnings are logged to help with debugging
- Other services continue to work normally
- No errors are thrown to the client

## License & Usage

This API only returns CC0 (Creative Commons Zero) and free-to-use images:

- **Unsplash**: Unsplash License (free for commercial use)
- **Pixabay**: CC0 Public Domain
- **Flickr**: CC0 Public Domain only

Always verify license information before using images in production.

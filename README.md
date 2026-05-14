# WebScience 2026 Festival

React + Vite site for the WebScience 2026 festival.

## Prerequisites

- Node.js 22+ and npm — or Docker

## Run locally (npm)

```bash
npm install
npm run dev
```

The dev server is then available at http://localhost:5173.

Other scripts:

```bash
npm run build      # production build to dist/
npm run preview    # serve the production build locally
npm run lint       # run ESLint
```

## Run locally (Docker)

Build and run the production image:

```bash
docker build -t webscience-2026-festival .
docker run --rm -p 8080:80 webscience-2026-festival
```

Open http://localhost:8080.

### Pull the prebuilt image from GHCR

Every push to `main` publishes a multi-tag image to GitHub Container Registry:

```bash
docker run --rm -p 8080:80 ghcr.io/janmikes/webscience-2026-festival:latest
```

## CI

`.github/workflows/docker.yml` builds the Docker image on every push and pull
request, and pushes tags `latest`, `main`, and `sha-<short>` to
`ghcr.io/janmikes/webscience-2026-festival` on push to `main`.

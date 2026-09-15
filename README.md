# ANS Music Partner API — documentation

The public documentation for the partner API, served at https://apidoc.ansmusic.io.

Plain HTML, CSS and a little JavaScript. No build step. `openapi.yaml` is the
machine-readable twin of the page and is offered for download from it.

## Run locally

    python3 -m http.server 8080
    # → http://localhost:8080

## Deploy (Coolify)

Build pack **Dockerfile**, port **80**. The image is nginx with the files copied
in; `/healthz` answers `ok` for the health check.

## Keep it true

The page describes `src/app/modules/partner` in the `ans-server` repository.
`scripts/probe-partner-api.ts` there walks the whole surface over HTTP; when a
behaviour changes, the probe changes, and then this page changes. Add an entry
to the changelog section for anything a partner would notice.

## Run locally

With pnpm installed:

```bash
pnpm install
pnpm dev
```

The project is now available at http://localhost:5173

## Environment variables

Required for local development:

- `GOOGLE_MAPS_API_KEY`: When set in .env file, the vite middleware will serve this directly. If not set:
- `GOOGLE_MAPS_API_KEY_SECRET`: the middleware will attempt to fetch this resource through @google-cloud/secret-manager. Should be on the form: `"projects/<project-id>/secrets/<secret-name>/versions/latest"`. Requires login.

Used environemnt variables during production:

- `PRODUCTION_MODE=production`
- `GCP_PROJECT_ID`
- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`

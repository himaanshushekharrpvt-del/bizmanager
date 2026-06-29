# Railway Deployment

Deploy this repository as two Railway services from the same GitHub repo.

## Backend service

- Root directory: `bizmanager-backend`
- Railway will use `bizmanager-backend/Dockerfile`.
- Add a Railway MySQL database and set these variables on the backend service:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`

`DB_URL` should be a JDBC URL, for example:

```text
jdbc:mysql://HOST:PORT/railway
```

## Frontend service

- Root directory: `bizmanager-frontend`
- Railway will use `bizmanager-frontend/Dockerfile`.
- Set:
  - `VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN`

After both services deploy, generate public domains for each service in Railway.

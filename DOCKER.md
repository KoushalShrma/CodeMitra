# Docker Guide

This project is containerized as a single Spring Boot image that includes the built React frontend.

The default image is zero-config demo mode:

- no Clerk key required
- no Groq key required
- no Judge0 key required
- no SMTP key required

## 1) Build image locally

```bash
docker build -t koushalsharma/code_mitra:latest .
```

Optional: build with real Clerk auth enabled:

```bash
docker build \
  --build-arg VITE_ENABLE_CLERK_AUTH=true \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=your_real_clerk_key \
  -t koushalsharma/code_mitra:latest .
```

## 2) Push image to Docker Hub

```bash
docker login
docker push koushalsharma/code_mitra:latest
```

Optional version tag:

```bash
docker tag koushalsharma/code_mitra:latest koushalsharma/code_mitra:v1
docker push koushalsharma/code_mitra:v1
```

## 3) Friend run steps

Your friend can clone this repo and run:

```bash
docker compose pull
docker compose up -d
```

Open:

- http://localhost:5000

The compose file runs:

- `koushalsharma/code_mitra:latest` (app)
- `mysql:8.4` (database)

In zero-config mode, student Clerk auth screens are intentionally disabled.
Use institution login/admin login flows to test the app without external keys.

## 4) Stop

```bash
docker compose down
```

To also delete MySQL/app data volumes:

```bash
docker compose down -v
```

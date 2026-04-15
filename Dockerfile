# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS frontend-build
WORKDIR /workspace

ARG VITE_ENABLE_CLERK_AUTH=false
ARG VITE_CLERK_PUBLISHABLE_KEY=
ARG VITE_API_BASE_URL=http://localhost:5000
ARG VITE_GROQ_API_KEY=
ARG VITE_GROQ_MODEL=llama3-8b-8192
ARG VITE_JUDGE0_ENDPOINT=https://ce.judge0.com
ARG VITE_JUDGE0_RAPIDAPI_KEY=
ARG VITE_JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com

ENV VITE_ENABLE_CLERK_AUTH=$VITE_ENABLE_CLERK_AUTH \
    VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY \
    VITE_GROQ_MODEL=$VITE_GROQ_MODEL \
    VITE_JUDGE0_ENDPOINT=$VITE_JUDGE0_ENDPOINT \
    VITE_JUDGE0_RAPIDAPI_KEY=$VITE_JUDGE0_RAPIDAPI_KEY \
    VITE_JUDGE0_RAPIDAPI_HOST=$VITE_JUDGE0_RAPIDAPI_HOST

COPY package*.json ./
RUN npm ci

COPY index.html postcss.config.js tailwind.config.js vite.config.js ./
COPY src ./src

RUN npm run build


FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /workspace/backend

COPY backend/pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -q -DskipTests dependency:go-offline

COPY backend/src ./src
COPY --from=frontend-build /workspace/dist ./src/main/resources/static

RUN --mount=type=cache,target=/root/.m2 mvn -DskipTests clean package


FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

RUN addgroup --system codemitra && adduser --system --ingroup codemitra codemitra

COPY --from=backend-build /workspace/backend/target/*.jar /app/app.jar

RUN mkdir -p /app/uploads && chown -R codemitra:codemitra /app

USER codemitra

EXPOSE 5000

ENV DB_HOST=mysql \
    DB_PORT=3306 \
    DB_NAME=codemitra \
    DB_USER=codemitra \
    DB_PASSWORD=codemitra \
    CLERK_SECRET_KEY=dev_clerk_secret \
    CLERK_JWKS_URL=https://example.com/.well-known/jwks.json \
    ADMIN_JWT_SECRET=dev_admin_secret_change_me_1234567890 \
    INSTITUTION_JWT_SECRET=dev_institution_secret_change_me_1234567890 \
    ADMIN_BOOTSTRAP_PASSWORD=admin123 \
    GROQ_API_KEY=disabled \
    GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions \
    GROQ_MODEL=llama3-8b-8192 \
    GROQ_MODEL_HINT=llama3-8b-8192 \
    GROQ_MODEL_REVIEW=llama3-70b-8192 \
    GROQ_MODEL_SUMMARY=llama3-8b-8192 \
    GROQ_MODEL_CHAT=llama3-8b-8192 \
    JUDGE0_RAPIDAPI_KEY= \
    JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com \
    JUDGE0_FALLBACK_ENDPOINT=https://ce.judge0.com \
    APP_MAIL_ENABLED=false \
    SMTP_HOST=localhost \
    SMTP_PORT=587 \
    SMTP_USERNAME= \
    SMTP_PASSWORD= \
    SMTP_FROM_ADDRESS=no-reply@codemitra.local \
    INSTITUTION_LOGIN_URL=http://localhost:5000/institution/login \
    REDIS_URL=disabled \
    SCRAPER_ENABLED=false

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

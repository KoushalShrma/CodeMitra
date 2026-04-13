#!/bin/bash
# Load .env from project root and start backend
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

set -a
source ../.env
set +a

if [ -f "./mvnw" ]; then
  ./mvnw spring-boot:run
else
  mvn spring-boot:run
fi

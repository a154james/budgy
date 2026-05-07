#!/bin/sh
set -e

# Run Prisma db push to ensure SQLite schema is created on the persistent volume
echo "Initializing database..."
npx -y prisma db push

# Start the standalone Next.js server
echo "Starting Next.js server..."
exec node server.js

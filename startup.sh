#!/bin/sh
# Container entrypoint for Azure App Services
# Runs once each time the container starts.
set -e

# ─── Persistent storage ────────────────────────────────────────────────────────
# In Azure App Services for Linux containers, /home is an Azure Files share
# that survives container restarts and redeployments.
# Everything else in the container is ephemeral.

DATA_DIR="/home/data"
UPLOADS_DIR="/home/uploads"

mkdir -p "$DATA_DIR" "$UPLOADS_DIR"

# ─── SQLite database path ──────────────────────────────────────────────────────
# DATABASE_URL must be set as an App Setting in Azure to:
#   file:/home/data/prod.db
#
# On first boot this file does not exist — prisma db push creates it.
# On subsequent boots it is already there and prisma db push is a no-op (unless
# the schema changed, in which case it applies the diff).

echo "→ Applying database schema..."
./node_modules/.bin/prisma db push --skip-generate

# ─── Seed on first boot ────────────────────────────────────────────────────────
# Check whether the guides table already has rows.  If not, this is a fresh DB
# and we run the seed script to populate the guide list and admin user.

GUIDE_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.guide.count()
  .then(n => { process.stdout.write(String(n)); return p.\$disconnect(); })
  .catch(() => { process.stdout.write('0'); return p.\$disconnect(); });
")

if [ "$GUIDE_COUNT" = "0" ]; then
  echo "→ Fresh database detected — seeding..."
  node prisma/seed.js
else
  echo "→ Database already seeded ($GUIDE_COUNT guides found), skipping."
fi

# ─── Persistent uploads ────────────────────────────────────────────────────────
# Uploaded images are written to public/uploads/ by the /api/upload route.
# Replace the directory in the container image with a symlink to /home/uploads
# so that files survive container restarts.

if [ -d "public/uploads" ] && [ ! -L "public/uploads" ]; then
  # Copy any files baked into the image (e.g. .gitkeep) to the persistent dir
  cp -n public/uploads/* "$UPLOADS_DIR/" 2>/dev/null || true
  rm -rf public/uploads
  ln -s "$UPLOADS_DIR" public/uploads
elif [ ! -e "public/uploads" ]; then
  ln -s "$UPLOADS_DIR" public/uploads
fi

# ─── One-time content import ──────────────────────────────────────────────────
# If /home/data/guide_content.json exists, import content into all guides
# then delete the file so it only runs once.

CONTENT_FILE="$DATA_DIR/guide_content.json"
if [ -f "$CONTENT_FILE" ]; then
  echo "→ Found guide_content.json — importing content..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const p = new PrismaClient();
const guides = JSON.parse(fs.readFileSync('$CONTENT_FILE', 'utf8'));
Promise.all(
  guides.map(g => p.guide.update({ where: { slug: g.slug }, data: { content: g.content, status: 'published' } }))
).then(r => {
  console.log('  Imported content for', r.length, 'guides');
  return p.\$disconnect();
}).catch(e => { console.error(e); return p.\$disconnect(); });
"
  rm -f "$CONTENT_FILE"
  echo "→ Import complete, trigger file removed."
fi

# ─── Start Next.js ─────────────────────────────────────────────────────────────
echo "→ Starting server on port ${PORT:-3000}..."
exec node server.js

# Bagdja POS Admin (Next.js App Router) — build image untuk deploy di Coolify.
#
# CATATAN: tidak ada Dockerfile Next.js lain di ekosistem Bagdja untuk
# dicontoh (semua app Next.js sejauh ini dijalankan tanpa Docker) — pola di
# bawah ini pola standar Next.js "standalone output" (lihat next.config.js
# `output: 'standalone'`), BUKAN hasil menyalin konvensi yang sudah ada.
#
# NEXT_PUBLIC_* WAJIB di-set sebagai build arg (bukan cuma env var runtime),
# karena Next.js meng-inline nilai NEXT_PUBLIC_* ke bundle client saat
# `next build` — kalau cuma diset di runtime container, browser tidak akan
# pernah melihatnya. Isi build arg ini di konfigurasi build Coolify.

# Stage 1: install deps
#
# CATATAN: `npm install`, BUKAN `npm ci` — lockfile yang di-generate di
# macOS/Windows tidak selalu punya entri optional-dependency platform Linux
# (mis. @emnapi/* punya banyak varian native per-platform), jadi `npm ci`
# yang strict akan gagal "out of sync" di base image Linux ini walau
# package.json tidak berubah sama sekali. `npm install` lebih toleran —
# tetap terikat package.json, cuma boleh resolve ulang optional deps yang
# memang platform-specific.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Stage 2: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_CLIENT_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_REDIRECT_URI
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_CLIENT_ID=$NEXT_PUBLIC_CLIENT_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_REDIRECT_URI=$NEXT_PUBLIC_REDIRECT_URI

RUN npm run build

# Stage 3: production — cuma copy hasil standalone (server.js minimal +
# node_modules hasil dependency tracing), jauh lebih kecil dari full node_modules.
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Default; bisa dioverride lewat env var Coolify. Harus cocok dengan
# core/docs/port.md (bagdja-pos-admin = 5007). Standalone server.js Next.js
# otomatis baca process.env.PORT, tidak perlu flag -p.
ENV PORT=5007
EXPOSE 5007

# Secret server-side (OAUTH_CLIENT_SECRET) diinjeksi sebagai env var runtime
# biasa di Coolify, BUKAN build arg — jangan sampai kebawa ke image/log build.

# Healthcheck Coolify: GET /api/health
CMD ["node", "server.js"]

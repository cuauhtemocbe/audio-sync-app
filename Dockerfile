FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS builder

WORKDIR /app

# pnpm se instala vía npm, no corepack: corepack resuelve la versión pineada a través del
# paquete @pnpm/exe, que solo publica binarios linkeados contra glibc y se rompe en silencio
# sobre esta imagen Alpine (musl). npm install -g funciona igual en cualquier libc.
RUN npm install -g pnpm@11.14.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Etapa separada para las dependencias de producción: server/index.js solo necesita "express" en
# runtime, no todo devDependencies (vite, vitest, eslint, ...) que sí hacen falta para el build.
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS deps

WORKDIR /app
RUN npm install -g pnpm@11.14.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Antes esta etapa final era nginx sirviendo solo el estático de dist/ — pero server/index.js
# (agregado para el proxy de ElevenLabs) ya sirve dist/ vía express.static Y expone /api/tts desde
# el mismo proceso. Con un único servicio en Railway, nginx nunca podía llegar a /api/tts (no tenía
# ninguna location para esa ruta: nginx respondía 405 en vez de proxyearlo a nada, porque no había
# nada corriendo del otro lado) — la app en producción quedaba sirviendo solo el frontend estático,
# sin backend real. Correr server/index.js directo acá es la forma mínima de tener un solo proceso
# que sirva ambas cosas, sin agregar un segundo servicio en Railway ni reintroducir nginx como proxy.
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node server ./server

USER node

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE ${PORT}

# server/index.js expone /healthz (200 JSON) para este healthcheck — evita depender de curl/wget,
# que ya no vienen instalados en esta imagen (no hace falta purgarlos como en la etapa nginx de antes).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/index.js"]

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

FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# La imagen ya trae un usuario "nginx" (uid 101) sin privilegios; solo falta darle
# permiso de escritura donde nginx necesita escribir en runtime y escuchar en un
# puerto no privilegiado (>1024) para no requerir root. chown en /run (no solo en
# nginx.pid) es necesario porque unlink() de un archivo requiere permiso de escritura
# sobre el directorio que lo contiene, no sobre el archivo — sin esto, nginx tira
# "unlink() /run/nginx.pid failed (13: Permission denied)" en cada shutdown/reload.
# Ojo: se usa /run y no /var/run — el chown de BusyBox (Alpine) no sigue symlinks para
# el último componente del path, así que "chown /var/run" solo re-dueña el symlink en
# sí (/var/run -> /run), dejando el directorio real /run intacto como root:root.
RUN chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d /run && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# curl y nginx-module-image-filter vienen instalados por default en nginx:alpine pero no se usan en runtime
# (nginx no enlaza contra libcurl, y nginx.conf no carga image_filter). Removerlos purga también sus
# dependencias huérfanas (c-ares, libcurl, libgd, fontconfig, libexpat, ...) y elimina las CVEs HIGH que
# arrastraban (ver issue #17). wget queda intacto para el HEALTHCHECK.
RUN apk del curl nginx-module-image-filter

# worker_processes auto detecta los cores del host, no la cuota de CPU del contenedor (Railway: 1 vCPU) —
# en ese entorno "auto" resolvía a ~78 workers, y el fork de todos ellos tardaba lo suficiente como para
# que el healthcheck de arranque matara el proceso (SIGQUIT) antes de que nginx llegara a aceptar
# conexiones: el contenedor quedaba "corriendo" en Railway pero rechazando toda conexión (502).
# La directiva "user nginx;" del nginx.conf base se quita porque ya corremos como USER nginx (no root):
# con root ya cedido, esa línea no hace nada salvo tirar un warning en cada arranque.
RUN sed -i \
    -e 's/worker_processes  auto;/worker_processes 1;/' \
    -e '/^user  nginx;/d' \
    /etc/nginx/nginx.conf

USER nginx

ENV PORT=8080

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
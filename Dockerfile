FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine@sha256:54f2a904c251d5a34adf545a72d32515a15e08418dae0266e23be2e18c66fefa

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# La imagen ya trae un usuario "nginx" (uid 101) sin privilegios; solo falta darle
# permiso de escritura donde nginx necesita escribir en runtime y escuchar en un
# puerto no privilegiado (>1024) para no requerir root.
RUN chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# curl y nginx-module-image-filter vienen instalados por default en nginx:alpine pero no se usan en runtime
# (nginx no enlaza contra libcurl, y nginx.conf no carga image_filter). Removerlos purga también sus
# dependencias huérfanas (c-ares, libcurl, libgd, fontconfig, libexpat, ...) y elimina las CVEs HIGH que
# arrastraban (ver issue #17). wget queda intacto para el HEALTHCHECK.
RUN apk del curl nginx-module-image-filter

USER nginx

ENV PORT=8080

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
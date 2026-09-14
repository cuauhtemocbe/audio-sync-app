.DEFAULT_GOAL := help

.PHONY: help dev up-d rebuild-dev down test coverage build lint license-check lock-check validate

# UID/GID de quien invoca make, para que Dockerfile.dev cree el usuario "node" con ese UID/GID
# (ver el porqué en Dockerfile.dev) — así el bind mount de docker-compose.dev.yml queda
# escribible sin correr el contenedor como root. En CI (ci.yml) esto toma el UID/GID del
# usuario "runner" automáticamente, sin necesitar lógica separada para ese caso.
export UID := $(shell id -u)
export GID := $(shell id -g)

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

dev: ## Levanta el entorno de desarrollo en Docker (foreground, puerto 5173)
	docker compose -f docker-compose.dev.yml up --build

up-d: ## Levanta el entorno de desarrollo en Docker (background, espera a que esté healthy; no reconstruye la imagen)
	# Solo el servicio audio-sync-app: es el único que exec'ean lint/test/coverage/lock-check.
	# Traer también "server" acá requeriría el .env real (ELEVENLABS_API_KEY) para que su
	# healthcheck pase, lo que rompe "up -d --wait" en CI (no hay .env en el runner).
	docker compose -f docker-compose.dev.yml up -d --wait audio-sync-app

rebuild-dev: ## Reconstruye la imagen de dev (correr tras cambiar Dockerfile.dev, package.json o pnpm-lock.yaml)
	docker compose -f docker-compose.dev.yml build

down: ## Detiene el entorno de desarrollo
	docker compose -f docker-compose.dev.yml down

test: up-d ## Corre la suite de tests dentro de Docker
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app pnpm test

coverage: up-d ## Genera el reporte de cobertura dentro de Docker (visible en host en coverage/)
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app pnpm run test:coverage

build: ## Construye la imagen de producción
	docker build -t audio-sync-app:prod .

lint: up-d ## Corre ESLint dentro de Docker
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app pnpm run lint

license-check: ## Verifica que exista el archivo LICENSE
	@test -f LICENSE

lock-check: up-d ## Verifica que pnpm-lock.yaml esté sincronizado con package.json
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app pnpm install --frozen-lockfile

validate: lock-check lint coverage build license-check ## Corre la validación completa (lock-check + lint + coverage + build + license-check), se detiene en el primer paso que falla
	@echo "validate OK"

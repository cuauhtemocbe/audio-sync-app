.DEFAULT_GOAL := help

.PHONY: help dev up-d down test coverage build lint license-check validate

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

dev: ## Levanta el entorno de desarrollo en Docker (foreground, puerto 5173)
	docker compose -f docker-compose.dev.yml up --build

up-d: ## Levanta el entorno de desarrollo en Docker (background)
	docker compose -f docker-compose.dev.yml up -d --build

down: ## Detiene el entorno de desarrollo
	docker compose -f docker-compose.dev.yml down

test: up-d ## Corre la suite de tests dentro de Docker
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app npm test

coverage: up-d ## Genera el reporte de cobertura dentro de Docker (visible en host en coverage/)
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app npm run test:coverage

build: ## Construye la imagen de producción
	docker build -t audio-sync-app:prod .

lint: up-d ## Corre ESLint dentro de Docker
	docker compose -f docker-compose.dev.yml exec -T audio-sync-app npm run lint

license-check: ## Verifica que exista el archivo LICENSE
	@test -f LICENSE

validate: lint test build license-check ## Corre la validación completa (lint + test + build + license-check), se detiene en el primer paso que falla
	@echo "validate OK"

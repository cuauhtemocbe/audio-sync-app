.DEFAULT_GOAL := help

.PHONY: help dev up-d down test coverage build lint validate

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

lint: ## Corre el linter (placeholder hasta milestone-3, US #5)
	@echo "lint: pendiente de configurar ESLint (milestone-3, issue #5)"

validate: test build ## Corre la validación completa (test + build; lint se suma en milestone-3)
	@echo "validate OK (lint todavía no forma parte de esta cadena, ver milestone-3)"

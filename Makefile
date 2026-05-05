.PHONY: help up down build install install-bun install-rails logs-bun logs-rails shell prod-build prod-run prod-clean

COMPOSE = podman compose
BUN = bun
RAILS = rails

IMAGE_NAME = template-nuxt-prod
CONTAINER_NAME = template-nuxt-prod
PORT = 3000

help:
	@echo ""
	@echo "Development workflow:"
	@echo ""
	@echo "  First time setup:"
	@echo "    1. make build          → Build the containers"
	@echo "    2. make install        → Install all dependencies"
	@echo "    3. make up             → Start the services"
	@echo ""
	@echo "  Daily usage:"
	@echo "    make up                → Start services in background"
	@echo "    make down              → Stop services"
	@echo "    make logs-bun          → Follow Bun/Nuxt logs"
	@echo "    make logs-rails        → Follow Rails logs"
	@echo "    make shell             → Open shell inside the Bun container"
	@echo ""
	@echo "  Dependencies:"
	@echo "    make install           → Install Bun and Rails dependencies"
	@echo "    make install-bun       → Install JS deps with bun install --ignore-scripts"
	@echo "    make install-rails     → Install Ruby gems with bundle install"
	@echo ""
	@echo "  Production:"
	@echo "    make prod-build        → Build production image"
	@echo "    make prod-run          → Run production container"
	@echo "    make prod-clean        → Remove production container/image"
	@echo ""

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

install: install-rails install-bun

install-bun:
	$(COMPOSE) run --rm $(BUN) bun install --ignore-scripts

logs-bun:
	$(COMPOSE) logs -f $(BUN)

install-rails:
	$(COMPOSE) run --rm $(RAILS) bundle install

logs-rails:
	$(COMPOSE) logs -f $(RAILS)

shell:
	$(COMPOSE) exec $(BUN) sh

prod-build:
	podman build -t $(IMAGE_NAME) .

prod-run:
	podman run --rm \
		--name $(CONTAINER_NAME) \
		-p 127.0.0.1:$(PORT):3000 \
		$(IMAGE_NAME)

prod-clean:
	-podman rm -f $(CONTAINER_NAME)
	-podman rmi $(IMAGE_NAME)

COMPOSE      := docker compose
DEV_COMPOSE  := docker compose -f docker-compose.yml -f docker-compose.dev.yml
BACKEND      := Jivora-backend

.PHONY: env dev prod up build logs ps down clean nuke \
        db-bootstrap db-seed db-seed-admin route-check shell-backend shell-db

env:
	@test -f .env.dev  || cp .env.example .env.dev
	@test -f .env.prod || cp .env.example .env.prod
	@echo "env files ready -- fill in .env.prod before make prod"

dev:
	$(DEV_COMPOSE) --env-file .env.dev up -d

prod up:
	$(COMPOSE) --env-file .env.prod up -d --build

build:
	$(COMPOSE) --env-file .env.prod build

logs:
	$(COMPOSE) logs -f $(S)

ps:
	$(COMPOSE) ps

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down --remove-orphans

nuke:
	$(COMPOSE) down -v --remove-orphans

db-bootstrap:
	$(COMPOSE) exec backend npm run db:bootstrap

db-seed:
	$(COMPOSE) exec backend npm run db:seed

db-seed-admin:
	$(COMPOSE) exec backend npm run db:seed-admin

route-check:
	cd $(BACKEND) && npm run route:check

shell-backend:
	$(COMPOSE) exec backend sh

shell-db:
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-jivora} $${POSTGRES_DB:-jivora}

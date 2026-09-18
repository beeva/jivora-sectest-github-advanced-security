# Container detail

Two Compose files. `docker-compose.yml` is the production stack (`db`,
`backend`, `web`, `admin`, ordered by `depends_on: condition: service_healthy`).
`docker-compose.dev.yml` is the development overlay: each app runs its dev
server against bind-mounted source, built from the Dockerfile `deps` stage.

| Service | Default host port | Container |
| --- | --- | --- |
| `db` | 5432 | 5432 |
| `backend` | 7002 (dev 4001) | `PORT` |
| `web` | 4000 | 4000 |
| `admin` | 4002 | 4002 |

Host ports are overridable via `*_PUBLISH_PORT`.

## Network wiring

Server-side Next reaches the backend at the internal `http://backend:<PORT>`.
The browser — admin client calls and member Socket.IO — must use the
host-published URL, because it cannot resolve the internal backend hostname, and
in production it must be `https` to avoid mixed content.

Compose-injected env always wins over `.env.*` file values, and the backend
service is force-wired to the bundled Postgres (`DB_HOST=db`).

## Reverse proxy: upload size

Uploads are capped at 50 MB across at most 5 files. The reverse proxy
(`client_max_body_size`) and Next's server-action cap sit in front and must
allow at least as much.

## Images

Multi-stage Dockerfiles with a `deps` stage shared by development and a
build/runtime stage for production. Both Next apps build to `standalone` output.
Admin's `NEXT_PUBLIC_*` values are inlined at build time as build args.

## Infrastructure manifests

`infra/terraform/` and `infra/k8s/` describe a cloud deployment of the same
topology. They exist so IaC and container-posture scanning has real input; they
are not applied anywhere.

запуск докера

docker compose -f docker/docker-infrastructure.yml -f docker/docker-app.yml --env-file envs/local/gate/app.env --env-file envs/local/database/minio.env --env-file envs/local/database/postgres.env --env-file envs/local/database/redis.env up -d 

docker compose -f docker/docker-infrastructure.yml --env-file envs/local/gate/app.env --env-file envs/local/database/minio.env --env-file envs/local/database/postgres.env --env-file envs/local/database/redis.env up -d 
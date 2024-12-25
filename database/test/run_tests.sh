docker compose -f database-test-docker.yml up --detach
pytest
docker compose -f database-test-docker.yml stop 
docker compose -f database-test-docker.yml rm
docker volume rm -f pgdata
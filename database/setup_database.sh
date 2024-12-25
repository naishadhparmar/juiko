initdb -D database/data
pg_ctl -D database/data start
createdb juikodb
psql -h localhost -p 5432 -d juikodb -f database/sql/create_tables.sql
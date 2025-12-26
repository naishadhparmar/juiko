createdb -h localhost -p 5430 -U postgres -O postgres juiko_db
psql -h localhost -p 5430 -U postgres -d juiko_db -f sql/create_tables.sql
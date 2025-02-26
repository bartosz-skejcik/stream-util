#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER postgres WITH PASSWORD 'postgres';
    ALTER USER postgres WITH SUPERUSER;
    CREATE DATABASE streamer_util;
    GRANT ALL PRIVILEGES ON DATABASE streamer_util TO postgres;
EOSQL

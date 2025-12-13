SELECT 'CREATE DATABASE ' || dbname
FROM (
     VALUES
         ('local'),
         ('prod'),
         ('dev')
 ) AS t(dbname)
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = t.dbname);

\gexec

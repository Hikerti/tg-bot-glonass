запуск докера

docker compose `
-f docker/docker-infrastructure.yml `                                                                                                                                                                                         
--env-file envs/gate/app.env `                                                                                                                                                                                                
--env-file envs/database/minio.env `                                                                                                                                                                                          
--env-file envs/database/postgres.env `                                                                                                                                                                                       
up -d    
/*
  Warnings:

  - A unique constraint covering the columns `[tg_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_tg_id_key" ON "user"("tg_id");

/*
  Warnings:

  - You are about to drop the column `category` on the `transactions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT', 'DEBIT', 'CASH', 'BOLETO');

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "category",
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "currentInstallment" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "installmentsCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PIX',
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetLimit" DOUBLE PRECISION,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_userId_key" ON "categories"("name", "userId");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

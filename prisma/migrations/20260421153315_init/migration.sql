-- CreateTable
CREATE TABLE "StockPrice" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockPrice_pkey" PRIMARY KEY ("id")
);

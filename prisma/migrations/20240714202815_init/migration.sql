-- CreateTable
CREATE TABLE "aits" (
    "id" TEXT NOT NULL,
    "nome" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TIMESTAMP(3) NOT NULL,
    "nome_do_agente" TEXT NOT NULL,
    "nome_do_condutor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',

    CONSTRAINT "aits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancelamentos" (
    "id" TEXT NOT NULL,
    "aitId" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "aceita" BOOLEAN NOT NULL,

    CONSTRAINT "cancelamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aits_id_key" ON "aits"("id");

-- CreateIndex
CREATE UNIQUE INDEX "cancelamentos_id_key" ON "cancelamentos"("id");

-- CreateIndex
CREATE UNIQUE INDEX "cancelamentos_aitId_key" ON "cancelamentos"("aitId");

-- AddForeignKey
ALTER TABLE "cancelamentos" ADD CONSTRAINT "cancelamentos_aitId_fkey" FOREIGN KEY ("aitId") REFERENCES "aits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

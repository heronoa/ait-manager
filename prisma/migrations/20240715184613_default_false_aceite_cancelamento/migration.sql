-- AlterTable
ALTER TABLE "aits" ALTER COLUMN "nome" DROP DEFAULT,
ALTER COLUMN "nome" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "cancelamentos" ADD COLUMN     "parecer" TEXT,
ALTER COLUMN "aceita" SET DEFAULT false;

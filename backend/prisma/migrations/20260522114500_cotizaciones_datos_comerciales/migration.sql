ALTER TABLE "cotizaciones"
  ADD COLUMN "contacto_cliente" VARCHAR(180),
  ADD COLUMN "cuit_cliente" VARCHAR(80),
  ADD COLUMN "email_cliente" VARCHAR(255),
  ADD COLUMN "fecha_emision" TIMESTAMP(3),
  ADD COLUMN "validez_dias" INTEGER DEFAULT 30,
  ADD COLUMN "moneda_base" "Moneda" NOT NULL DEFAULT 'USD';

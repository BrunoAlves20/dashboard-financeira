import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://admin:admin_password@localhost:5432/financial_dashboard?schema=public",
  },
});
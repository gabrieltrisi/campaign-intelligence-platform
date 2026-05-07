import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const user = await prisma.user.upsert({
    where: {
      email: 'demo@gteck.com.br',
    },

    update: {
      password: passwordHash,
    },

    create: {
      name: 'Demo Gteck',
      email: 'demo@gteck.com.br',
      password: passwordHash,
    },
  });

  await prisma.campaign.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.$transaction([
    prisma.campaign.create({
      data: {
        name: 'Meta Ads - Conversao',
        cost: 2500,
        revenue: 12500,
        fees: 300,
        expenses: 450,
        userId: user.id,
      },
    }),

    prisma.campaign.create({
      data: {
        name: 'Google Search - Leads',
        cost: 1800,
        revenue: 7200,
        fees: 200,
        expenses: 250,
        userId: user.id,
      },
    }),

    prisma.campaign.create({
      data: {
        name: 'Remarketing - Carrinho',
        cost: 950,
        revenue: 5100,
        fees: 120,
        expenses: 180,
        userId: user.id,
      },
    }),

    prisma.campaign.create({
      data: {
        name: 'TikTok Ads - Awareness',
        cost: 2200,
        revenue: 3100,
        fees: 180,
        expenses: 300,
        userId: user.id,
      },
    }),

    prisma.campaign.create({
      data: {
        name: 'LinkedIn Ads - B2B',
        cost: 3200,
        revenue: 6400,
        fees: 350,
        expenses: 500,
        userId: user.id,
      },
    }),
  ]);

  console.log('✅ Seed executado com sucesso.');
  console.log('----------------------------------------');
  console.log('👤 Usuario demo: demo@gteck.com.br');
  console.log('🔑 Senha demo: 123456');
  console.log('----------------------------------------');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Alimentari', color: '#10B981', icon: '🛒' },
  { name: 'Ristoranti', color: '#F59E0B', icon: '🍽️' },
  { name: 'Trasporti', color: '#3B82F6', icon: '🚗' },
  { name: 'Shopping', color: '#EC4899', icon: '🛍️' },
  { name: 'Bollette', color: '#EF4444', icon: '📄' },
  { name: 'Casa', color: '#8B5CF6', icon: '🏠' },
  { name: 'Salute', color: '#14B8A6', icon: '⚕️' },
  { name: 'Sport', color: '#06B6D4', icon: '⚽' },
  { name: 'Intrattenimento', color: '#F97316', icon: '🎬' },
  { name: 'Viaggi', color: '#84CC16', icon: '✈️' },
  { name: 'Abbigliamento', color: '#A855F7', icon: '👕' },
  { name: 'Tecnologia', color: '#6366F1', icon: '💻' },
  { name: 'Istruzione', color: '#0EA5E9', icon: '📚' },
  { name: 'Regali', color: '#D946EF', icon: '🎁' },
  { name: 'Stipendio', color: '#22C55E', icon: '💰' },
  { name: 'Altro', color: '#64748B', icon: '📌' },
];

async function main() {
  console.log('🌱 Inizio seeding del database...');

  // Crea categorie di default
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        id: `default-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `default-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: category.name,
        color: category.color,
        icon: category.icon,
        isDefault: true,
      },
    });
  }

  console.log(`✅ ${defaultCategories.length} categorie di default create`);
  console.log('🎉 Seeding completato!');
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

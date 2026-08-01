import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding vaccines database...');

  const defaultVaccines = [
    { name: 'BCG', description: 'Previne as formas graves de tuberculose', targetAgeMonths: 0 },
    { name: 'Hepatite B', description: 'Previne a hepatite B', targetAgeMonths: 0 },
    { name: 'Penta (1ª dose)', description: 'Previne difteria, tétano, coqueluche, hepatite B e infecções por Hib', targetAgeMonths: 2 },
    { name: 'VIP (1ª dose)', description: 'Poliomielite inativada', targetAgeMonths: 2 },
    { name: 'Pneumocócica 10V (1ª dose)', description: 'Previne infecções por pneumococo (meningite, pneumonia, otite)', targetAgeMonths: 2 },
    { name: 'Rotavírus (1ª dose)', description: 'Previne diarreia por rotavírus', targetAgeMonths: 2 },
    { name: 'Meningocócica C (1ª dose)', description: 'Previne doença meningocócica do sorogrupo C', targetAgeMonths: 3 },
    { name: 'Penta (2ª dose)', description: 'Segunda dose da vacina pentavalente', targetAgeMonths: 4 },
    { name: 'VIP (2ª dose)', description: 'Segunda dose da poliomielite inativada', targetAgeMonths: 4 },
    { name: 'Pneumocócica 10V (2ª dose)', description: 'Segunda dose da pneumocócica 10V', targetAgeMonths: 4 },
    { name: 'Rotavírus (2ª dose)', description: 'Segunda dose da vacina contra rotavírus', targetAgeMonths: 4 },
    { name: 'Meningocócica C (2ª dose)', description: 'Segunda dose da meningocócica C', targetAgeMonths: 5 },
    { name: 'Penta (3ª dose)', description: 'Terceira dose da vacina pentavalente', targetAgeMonths: 6 },
    { name: 'VIP (3ª dose)', description: 'Terceira dose da poliomielite inativada', targetAgeMonths: 6 },
    { name: 'Febre Amarela (Dose inicial)', description: 'Previne a febre amarela', targetAgeMonths: 9 },
    { name: 'Tríplice Viral (1ª dose)', description: 'Previne sarampo, caxumba e rubéola', targetAgeMonths: 12 },
    { name: 'Pneumocócica 10V (Reforço)', description: 'Reforço contra pneumococo', targetAgeMonths: 12 },
    { name: 'Meningocócica C (Reforço)', description: 'Reforço contra meningocócica C', targetAgeMonths: 12 },
    { name: 'DTP (1º Reforço)', description: 'Reforço contra difteria, tétano e coqueluche', targetAgeMonths: 15 },
    { name: 'VOP (1º Reforço)', description: 'Reforço contra poliomielite oral', targetAgeMonths: 15 },
    { name: 'Hepatite A', description: 'Previne hepatite A', targetAgeMonths: 15 },
    { name: 'Tetra Viral', description: 'Sarampo, caxumba, rubéola e varicela', targetAgeMonths: 15 },
  ];

  for (const v of defaultVaccines) {
    await prisma.vaccine.upsert({
      where: { id: v.name },
      update: {},
      create: {
        id: v.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: v.name,
        description: v.description,
        targetAgeMonths: v.targetAgeMonths,
      },
    });
  }

  console.log('Vaccine seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * SEED SCRIPT: Populate LIC Plans Master Data
 * Run: npx ts-node prisma/seed.ts
 */

async function main() {
  console.log('🌱 Seeding LIC Plans Master Data...');

  // Clear existing data
  await prisma.lICPlan.deleteMany();

  // ============= TERM PLANS =============
  const termPlan = await prisma.lICPlan.create({
    data: {
      planName: 'LIC Jeevan Term Plan',
      planCode: 'LJT001',
      planType: 'Term',
      description: 'Pure protection term insurance plan with flexible tenure options',
      minAge: 18,
      maxAge: 65,
      minTerm: 5,
      maxTerm: 40,
      minSA: 500000, // ₹5 Lakhs
      maxSA: 50000000, // ₹5 Crores
      features: {
        bonuses: false,
        riders: ['waiver_of_premium'],
        flexibility: 'high',
        coverageType: 'pure_protection',
      },
      riderOptions: {
        waiver_of_premium: { cost: 0.5, coverage: 'full' },
        critical_illness: { cost: 2.0, coverage: 'lump_sum' },
        accidental_benefit: { cost: 1.0, coverage: 'lump_sum' },
      },
      // Premium table: male/female age-wise rates per 1000 SA
      premiumTable: {
        male: [
          2.5, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.3, 3.5, 3.8,
          4.1, 4.5, 4.9, 5.4, 5.9, 6.5, 7.2, 7.9, 8.7, 9.6,
          10.6, 11.7, 12.9, 14.2, 15.6, 17.2, 18.9, 20.8, 22.8, 25.1,
          27.5, 30.2, 33.1, 36.3, 39.8, 43.6, 47.8, 52.4, 57.4, 62.9,
          68.9, 75.5, 82.8, 90.9, 99.9, 109.9, 121.0, 133.3,
        ],
        female: [
          1.8, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.5, 2.7, 2.9,
          3.1, 3.4, 3.7, 4.1, 4.5, 4.9, 5.4, 5.9, 6.5, 7.1,
          7.8, 8.5, 9.3, 10.2, 11.2, 12.3, 13.5, 14.8, 16.2, 17.8,
          19.5, 21.4, 23.5, 25.8, 28.3, 31.1, 34.1, 37.4, 40.9, 44.8,
          49.0, 53.6, 58.6, 64.1, 70.1, 76.8, 84.4, 92.9,
        ],
      },
      benefitStructure: {
        deathBenefit: 'Sum Assured + Accrued Simple Reversionary Bonus',
        maturityBenefit: 'None (pure protection)',
        survivalBenefit: 'None',
      },
      status: 'active',
    },
  });

  console.log('✅ Created Term Plan:', termPlan.planCode);

  // ============= ENDOWMENT PLANS =============
  const endowmentPlan = await prisma.lICPlan.create({
    data: {
      planName: 'LIC Jeevan Anand',
      planCode: 'LJA001',
      planType: 'Endowment',
      description: 'Endowment plan with survival and death benefits',
      minAge: 18,
      maxAge: 60,
      minTerm: 10,
      maxTerm: 30,
      minSA: 500000,
      maxSA: 25000000, // ₹2.5 Crores
      features: {
        bonuses: true,
        riders: ['waiver_of_premium', 'critical_illness'],
        flexibility: 'medium',
        coverageType: 'mixed',
      },
      riderOptions: {
        waiver_of_premium: { cost: 1.0, coverage: 'full' },
        critical_illness: { cost: 3.0, coverage: 'lump_sum' },
      },
      premiumTable: {
        male: [
          45.0, 45.5, 46.0, 46.5, 47.0, 47.5, 48.5, 49.5, 50.5, 51.5,
          52.5, 54.0, 55.5, 57.0, 58.5, 60.5, 62.5, 64.5, 66.5, 69.0,
          71.5, 74.0, 77.0, 80.0, 83.0, 86.5, 90.0, 94.0, 98.0, 102.5,
          107.5, 113.0, 119.0, 125.5, 132.5, 140.0, 148.0, 156.5, 165.5, 175.0,
          185.0, 195.5, 206.5, 218.0, 230.0, 242.5, 255.5, 269.0,
        ],
        female: [
          35.0, 35.5, 36.0, 36.5, 37.0, 37.5, 38.5, 39.5, 40.5, 41.5,
          42.5, 44.0, 45.5, 47.0, 48.5, 50.5, 52.5, 54.5, 56.5, 59.0,
          61.5, 64.0, 67.0, 70.0, 73.0, 76.5, 80.0, 84.0, 88.0, 92.5,
          97.5, 103.0, 109.0, 115.5, 122.5, 130.0, 138.0, 146.5, 155.5, 165.0,
          175.0, 185.5, 196.5, 208.0, 220.0, 232.5, 245.5, 259.0,
        ],
      },
      benefitStructure: {
        deathBenefit: 'Sum Assured + Accrued Bonus',
        maturityBenefit: 'Sum Assured + Final Bonus + Accrued Bonus',
        survivalBenefit: 'None (unless terminal bonus)',
      },
      status: 'active',
    },
  });

  console.log('✅ Created Endowment Plan:', endowmentPlan.planCode);

  // ============= PENSION PLANS =============
  const pensionPlan = await prisma.lICPlan.create({
    data: {
      planName: 'LIC Jeevan Shanti',
      planCode: 'LJS001',
      planType: 'Pension',
      description: 'Pension plan for post-retirement income security',
      minAge: 30,
      maxAge: 60,
      minTerm: 10,
      maxTerm: 25,
      minSA: 500000,
      maxSA: 50000000,
      features: {
        bonuses: true,
        riders: [],
        flexibility: 'high',
        coverageType: 'pension',
      },
      riderOptions: {},
      premiumTable: {
        male: [
          35.0, 35.5, 36.0, 36.5, 37.0, 37.5, 38.5, 39.5, 40.5, 41.5,
          42.5, 44.0, 45.5, 47.0, 48.5, 50.5, 52.5, 54.5, 56.5, 59.0,
          61.5, 64.0, 67.0, 70.0, 73.0, 76.5, 80.0, 84.0, 88.0, 92.5,
          97.5, 103.0, 109.0, 115.5, 122.5, 130.0, 138.0, 146.5, 155.5, 165.0,
          175.0, 185.5, 196.5, 208.0, 220.0, 232.5, 245.5, 259.0,
        ],
        female: [
          30.0, 30.5, 31.0, 31.5, 32.0, 32.5, 33.5, 34.5, 35.5, 36.5,
          37.5, 39.0, 40.5, 42.0, 43.5, 45.5, 47.5, 49.5, 51.5, 54.0,
          56.5, 59.0, 62.0, 65.0, 68.0, 71.5, 75.0, 79.0, 83.0, 87.5,
          92.5, 98.0, 104.0, 110.5, 117.5, 125.0, 133.0, 141.5, 150.5, 160.0,
          170.0, 180.5, 191.5, 203.0, 215.0, 227.5, 240.5, 254.0,
        ],
      },
      benefitStructure: {
        deathBenefit: 'Lump Sum Benefit',
        maturityBenefit: 'Accumulated Corpus + Bonus',
        survivalBenefit: 'Periodic Pension Payouts',
      },
      status: 'active',
    },
  });

  console.log('✅ Created Pension Plan:', pensionPlan.planCode);

  console.log('🎉 Seeding completed successfully!');
  console.log('📊 Created 3 master LIC plans');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

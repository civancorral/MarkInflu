import { PrismaClient, UserRole, AccountStatus, SocialPlatform, ContentType, CampaignStatus, CampaignVisibility, ApplicationStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  const adminPassword = await hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@markinflu.com' },
    update: {},
    create: {
      email: 'admin@markinflu.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ============================================
  // CREATE SAMPLE BRAND
  // ============================================
  const brandPassword = await hash('Brand123!', 12);
  const brandUser = await prisma.user.upsert({
    where: { email: 'demo-brand@markinflu.com' },
    update: {},
    create: {
      email: 'demo-brand@markinflu.com',
      passwordHash: brandPassword,
      role: UserRole.BRAND,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date(),
      brandProfile: {
        create: {
          companyName: 'TechBrand Inc.',
          legalName: 'TechBrand Incorporated',
          industry: ['Tecnología', 'Software'],
          companySize: 'MEDIUM',
          website: 'https://techbrand.example.com',
          contactName: 'María García',
          contactEmail: 'maria@techbrand.example.com',
        },
      },
    },
    include: { brandProfile: true },
  });
  console.log('✅ Brand user created:', brandUser.email);

  // ============================================
  // CREATE SAMPLE CREATORS
  // ============================================
  const creatorPassword = await hash('Creator123!', 12);

  // Creator 1 - Lifestyle
  const creator1 = await prisma.user.upsert({
    where: { email: 'sofia.lifestyle@markinflu.com' },
    update: {},
    create: {
      email: 'sofia.lifestyle@markinflu.com',
      passwordHash: creatorPassword,
      role: UserRole.CREATOR,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date(),
      creatorProfile: {
        create: {
          displayName: 'Sofía Lifestyle',
          firstName: 'Sofía',
          lastName: 'Martínez',
          bio: 'Creadora de contenido lifestyle y viajes. Comparto mis aventuras y tips para vivir mejor. 🌴✨',
          tagline: 'Lifestyle Creator | 250K+ Followers',
          location: 'Ciudad de México',
          city: 'CDMX',
          country: 'MX',
          timezone: 'America/Mexico_City',
          languages: ['es', 'en'],
          primaryNiche: 'Estilo de vida',
          secondaryNiches: ['Viajes', 'Moda', 'Bienestar'],
          contentTypes: [ContentType.VIDEO_SHORT, ContentType.STORY, ContentType.PHOTO],
          rates: {
            instagram: {
              story: { price: 500, currency: 'USD' },
              reel: { price: 1500, currency: 'USD' },
              post: { price: 1000, currency: 'USD' },
              pack_5_stories: { price: 2000, currency: 'USD', notes: 'Incluye destacados' },
            },
            tiktok: {
              video: { price: 2000, currency: 'USD' },
            },
          },
          minimumBudget: 500,
          currency: 'USD',
          isAvailable: true,
          isVerified: true,
          verifiedAt: new Date(),
          keywords: ['lifestyle', 'viajes', 'moda', 'bienestar', 'influencer mexicana'],
          socialAccounts: {
            create: [
              {
                platform: SocialPlatform.INSTAGRAM,
                username: 'sofia_lifestyle',
                profileUrl: 'https://instagram.com/sofia_lifestyle',
                followers: 250000,
                following: 500,
                postsCount: 1200,
                engagementRate: 4.5,
                avgLikes: 8500,
                avgComments: 350,
                isVerified: true,
              },
              {
                platform: SocialPlatform.TIKTOK,
                username: 'sofia_lifestyle',
                profileUrl: 'https://tiktok.com/@sofia_lifestyle',
                followers: 180000,
                following: 200,
                postsCount: 450,
                engagementRate: 6.2,
                avgLikes: 15000,
                avgViews: 85000,
              },
            ],
          },
        },
      },
    },
    include: { creatorProfile: { include: { socialAccounts: true } } },
  });
  console.log('✅ Creator 1 created:', creator1.email);

  // Creator 2 - Tech
  const creator2 = await prisma.user.upsert({
    where: { email: 'carlos.tech@markinflu.com' },
    update: {},
    create: {
      email: 'carlos.tech@markinflu.com',
      passwordHash: creatorPassword,
      role: UserRole.CREATOR,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date(),
      creatorProfile: {
        create: {
          displayName: 'Carlos Tech Reviews',
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          bio: 'Reviews de tecnología honestos y detallados. Gadgets, software y más. 🎮💻',
          tagline: 'Tech Reviewer | 500K+ YouTube Subs',
          location: 'Monterrey',
          city: 'Monterrey',
          country: 'MX',
          timezone: 'America/Monterrey',
          languages: ['es', 'en'],
          primaryNiche: 'Tecnología',
          secondaryNiches: ['Gaming', 'Software', 'Productividad'],
          contentTypes: [ContentType.VIDEO_LONG, ContentType.VIDEO_SHORT],
          rates: {
            youtube: {
              dedicated_video: { price: 5000, currency: 'USD', notes: '10-15 min review' },
              integration: { price: 2500, currency: 'USD', notes: '60-90 sec mention' },
              short: { price: 1000, currency: 'USD' },
            },
            instagram: {
              reel: { price: 1500, currency: 'USD' },
              story: { price: 400, currency: 'USD' },
            },
          },
          minimumBudget: 1000,
          currency: 'USD',
          isAvailable: true,
          isVerified: true,
          verifiedAt: new Date(),
          preferredBrands: ['Tecnología', 'Software', 'Gaming'],
          excludedBrands: ['Gambling', 'Tobacco'],
          keywords: ['tech', 'reviews', 'gadgets', 'youtube', 'gaming'],
          socialAccounts: {
            create: [
              {
                platform: SocialPlatform.YOUTUBE,
                username: 'CarlosTechReviews',
                profileUrl: 'https://youtube.com/@CarlosTechReviews',
                followers: 520000,
                postsCount: 380,
                engagementRate: 5.8,
                avgViews: 45000,
                avgLikes: 2800,
                avgComments: 420,
                isVerified: true,
              },
              {
                platform: SocialPlatform.INSTAGRAM,
                username: 'carlos_tech',
                profileUrl: 'https://instagram.com/carlos_tech',
                followers: 85000,
                following: 350,
                postsCount: 620,
                engagementRate: 3.8,
                avgLikes: 3200,
                avgComments: 180,
              },
            ],
          },
        },
      },
    },
    include: { creatorProfile: { include: { socialAccounts: true } } },
  });
  console.log('✅ Creator 2 created:', creator2.email);

  // Creator 3 - Fitness
  const creator3 = await prisma.user.upsert({
    where: { email: 'ana.fitness@markinflu.com' },
    update: {},
    create: {
      email: 'ana.fitness@markinflu.com',
      passwordHash: creatorPassword,
      role: UserRole.CREATOR,
      status: AccountStatus.ACTIVE,
      emailVerified: new Date(),
      creatorProfile: {
        create: {
          displayName: 'Ana Fitness Coach',
          firstName: 'Ana',
          lastName: 'López',
          bio: 'Coach certificada 💪 Transformando vidas a través del fitness y nutrición. Rutinas, tips y motivación diaria.',
          tagline: 'Fitness Coach | 150K Community',
          location: 'Guadalajara',
          city: 'Guadalajara',
          country: 'MX',
          timezone: 'America/Mexico_City',
          languages: ['es'],
          primaryNiche: 'Fitness',
          secondaryNiches: ['Salud', 'Nutrición', 'Bienestar'],
          contentTypes: [ContentType.VIDEO_SHORT, ContentType.STORY, ContentType.LIVE_STREAM],
          rates: {
            instagram: {
              reel: { price: 1200, currency: 'USD' },
              story: { price: 350, currency: 'USD' },
              post: { price: 800, currency: 'USD' },
              live_workout: { price: 2000, currency: 'USD', notes: '30 min branded workout' },
            },
            tiktok: {
              video: { price: 1500, currency: 'USD' },
            },
          },
          minimumBudget: 350,
          currency: 'USD',
          isAvailable: true,
          isVerified: false,
          preferredBrands: ['Fitness', 'Salud', 'Suplementos', 'Ropa Deportiva'],
          excludedBrands: ['Alcohol', 'Tobacco', 'Fast Food'],
          keywords: ['fitness', 'gym', 'workout', 'nutrition', 'health', 'coach'],
          socialAccounts: {
            create: [
              {
                platform: SocialPlatform.INSTAGRAM,
                username: 'ana_fitness_coach',
                profileUrl: 'https://instagram.com/ana_fitness_coach',
                followers: 152000,
                following: 680,
                postsCount: 890,
                engagementRate: 5.2,
                avgLikes: 6200,
                avgComments: 280,
              },
              {
                platform: SocialPlatform.TIKTOK,
                username: 'anafitness',
                profileUrl: 'https://tiktok.com/@anafitness',
                followers: 98000,
                postsCount: 320,
                engagementRate: 7.1,
                avgLikes: 12000,
                avgViews: 65000,
              },
            ],
          },
        },
      },
    },
    include: { creatorProfile: { include: { socialAccounts: true } } },
  });
  console.log('✅ Creator 3 created:', creator3.email);

  // ============================================
  // CREATE SAMPLE CAMPAIGNS
  // ============================================
  const brandProfile = await prisma.brandProfile.findFirst({
    where: { userId: brandUser.id },
  });

  if (brandProfile) {
    // Campaign 1 - Active
    const campaign1 = await prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title: 'Lanzamiento App de Productividad',
        slug: 'lanzamiento-app-productividad-2024',
        description: `Buscamos creadores de contenido tech y lifestyle para promocionar nuestra nueva app de productividad.

La app ayuda a organizar tareas, gestionar tiempo y aumentar la productividad personal. Queremos mostrar casos de uso reales.

**Lo que buscamos:**
- Contenido auténtico mostrando el uso real de la app
- Engagement genuino con tu audiencia
- Creatividad en la presentación del producto`,
        brief: {
          objective: 'Brand Awareness & App Downloads',
          keyMessages: [
            'Organiza tu día en minutos',
            'Aumenta tu productividad un 40%',
            'Gratis para uso personal',
          ],
          dos: [
            'Mostrar la app en uso real',
            'Compartir experiencia personal',
            'Incluir link de descarga',
          ],
          donts: [
            'No mencionar competidores',
            'No hacer claims exagerados',
            'No usar música con copyright',
          ],
          hashtags: ['#ad', '#sponsored', '#ProductividadApp'],
          mentions: ['@productividadapp'],
        },
        requirements: {
          minFollowers: 10000,
          platforms: ['INSTAGRAM', 'TIKTOK'],
          niches: ['Tecnología', 'Estilo de vida', 'Productividad'],
          countries: ['MX', 'ES', 'AR', 'CO'],
          languages: ['es'],
          minEngagementRate: 3.0,
        },
        deliverableSpecs: {
          items: [
            { type: 'REEL', quantity: 1, duration: '30-60s', notes: 'Tutorial de uso' },
            { type: 'STORY', quantity: 3, notes: 'Behind the scenes + review' },
          ],
        },
        budgetMin: 800,
        budgetMax: 2500,
        budgetType: 'PER_CREATOR',
        currency: 'USD',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        status: CampaignStatus.PUBLISHED,
        visibility: CampaignVisibility.PUBLIC,
        maxCreators: 5,
        currentCreators: 0,
        publishedAt: new Date(),
      },
    });
    console.log('✅ Campaign 1 created:', campaign1.title);

    // Campaign 2 - Draft
    const campaign2 = await prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title: 'Review de Gadgets Tech Q1 2024',
        slug: 'review-gadgets-tech-q1-2024',
        description: `Campaña para reviews detallados de nuestros nuevos gadgets tecnológicos.

Buscamos tech reviewers con experiencia en análisis de productos electrónicos.`,
        brief: {
          objective: 'Product Reviews & Sales',
          keyMessages: [
            'Innovación tecnológica',
            'Diseño premium',
            'Mejor precio del mercado',
          ],
          dos: ['Review honesto', 'Mostrar características principales'],
          donts: ['No comparar con Apple directamente'],
          hashtags: ['#TechReview', '#GadgetsDelFuturo'],
          mentions: ['@techbrand'],
        },
        requirements: {
          minFollowers: 50000,
          platforms: ['YOUTUBE'],
          niches: ['Tecnología', 'Gaming'],
          countries: ['MX', 'ES'],
          languages: ['es'],
          minEngagementRate: 4.0,
        },
        budgetMin: 3000,
        budgetMax: 6000,
        budgetType: 'PER_CREATOR',
        currency: 'USD',
        status: CampaignStatus.DRAFT,
        visibility: CampaignVisibility.PRIVATE,
        maxCreators: 3,
      },
    });
    console.log('✅ Campaign 2 created:', campaign2.title);

    // ============================================
    // CREATE SAMPLE APPLICATION
    // ============================================
    const creatorProfile1 = await prisma.creatorProfile.findFirst({
      where: { userId: creator1.id },
    });

    if (creatorProfile1) {
      const application = await prisma.application.create({
        data: {
          campaignId: campaign1.id,
          creatorProfileId: creatorProfile1.id,
          status: ApplicationStatus.SHORTLISTED,
          proposedRate: 1800,
          currency: 'USD',
          pitch: `¡Hola! Me encantaría participar en esta campaña.

Mi audiencia está muy interesada en productividad y organización personal. Tengo experiencia probando apps similares y siempre genero muy buen engagement con este tipo de contenido.

Propuesta:
- 1 Reel tutorial creativo (30-45s)
- 3 Stories interactivas con encuestas
- 1 Post en feed con carrusel de tips

Incluyo 1 ronda de revisiones.`,
          proposal: {
            deliverables: [
              { type: 'REEL', quantity: 1, price: 1200, notes: 'Tutorial creativo' },
              { type: 'STORY', quantity: 3, price: 400, notes: 'Con encuestas' },
              { type: 'POST', quantity: 1, price: 200, notes: 'Carrusel bonus' },
            ],
            totalPrice: 1800,
            timeline: '2 semanas',
            revisions: 1,
          },
          portfolioLinks: [
            'https://instagram.com/p/example1',
            'https://instagram.com/p/example2',
          ],
          appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          shortlistedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
      console.log('✅ Sample application created for campaign:', campaign1.title);
    }
  }

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('   Admin:   admin@markinflu.com / Admin123!');
  console.log('   Brand:   demo-brand@markinflu.com / Brand123!');
  console.log('   Creator: sofia.lifestyle@markinflu.com / Creator123!');
  console.log('   Creator: carlos.tech@markinflu.com / Creator123!');
  console.log('   Creator: ana.fitness@markinflu.com / Creator123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

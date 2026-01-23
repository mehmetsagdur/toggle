import { PrismaClient, Environment, StrategyType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for Feature Flag Management System.
 * Creates sample tenants, features, and flags for testing.
 */
async function main(): Promise<void> {
    console.log('🌱 Seeding database...\n');

    // ============================================================================
    // TENANT: Zebra Electronics
    // ============================================================================

    const zebra = await prisma.tenant.upsert({
        where: { slug: 'zebra' },
        update: {},
        create: {
            name: 'Zebra Electronics',
            slug: 'zebra',
            quotaBurst: 200,
            quotaSustained: 2000,
        },
    });
    console.log(`✅ Tenant created: ${zebra.name} (${zebra.id})`);

    // ============================================================================
    // TENANT: YMS Yazılım
    // ============================================================================

    const yms = await prisma.tenant.upsert({
        where: { slug: 'yms' },
        update: {},
        create: {
            name: 'YMS Yazılım',
            slug: 'yms',
            quotaBurst: 100,
            quotaSustained: 1000,
        },
    });
    console.log(`✅ Tenant created: ${yms.name} (${yms.id})`);

    // ============================================================================
    // FEATURES FOR ZEBRA
    // ============================================================================

    const darkMode = await prisma.feature.upsert({
        where: { tenantId_key: { tenantId: zebra.id, key: 'dark_mode' } },
        update: {},
        create: {
            tenantId: zebra.id,
            key: 'dark_mode',
            name: 'Dark Mode',
            description: 'Enable dark theme for the application UI',
        },
    });
    console.log(`  📦 Feature: ${darkMode.name}`);

    const newCheckout = await prisma.feature.upsert({
        where: { tenantId_key: { tenantId: zebra.id, key: 'new_checkout_v2' } },
        update: {},
        create: {
            tenantId: zebra.id,
            key: 'new_checkout_v2',
            name: 'New Checkout Flow V2',
            description: 'Redesigned checkout with improved UX and faster processing',
        },
    });
    console.log(`  📦 Feature: ${newCheckout.name}`);

    const betaFeatures = await prisma.feature.upsert({
        where: { tenantId_key: { tenantId: zebra.id, key: 'beta_features' } },
        update: {},
        create: {
            tenantId: zebra.id,
            key: 'beta_features',
            name: 'Beta Features Access',
            description: 'Access to experimental features for beta users',
        },
    });
    console.log(`  📦 Feature: ${betaFeatures.name}`);

    // ============================================================================
    // FLAGS FOR DARK MODE (Boolean strategy - simple on/off)
    // ============================================================================

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.DEV, featureId: darkMode.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: darkMode.id,
            env: Environment.DEV,
            enabled: true,
            strategyType: StrategyType.BOOLEAN,
        },
    });

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.STAGING, featureId: darkMode.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: darkMode.id,
            env: Environment.STAGING,
            enabled: true,
            strategyType: StrategyType.BOOLEAN,
        },
    });

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.PROD, featureId: darkMode.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: darkMode.id,
            env: Environment.PROD,
            enabled: false, // Not yet in production
            strategyType: StrategyType.BOOLEAN,
        },
    });
    console.log(`    🚩 Flags: dark_mode (DEV: ✓, STAGING: ✓, PROD: ✗)`);

    // ============================================================================
    // FLAGS FOR NEW CHECKOUT (Percentage rollout - gradual release)
    // ============================================================================

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.DEV, featureId: newCheckout.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: newCheckout.id,
            env: Environment.DEV,
            enabled: true,
            strategyType: StrategyType.PERCENTAGE,
            strategyConfig: { percentage: 100 }, // 100% in dev
        },
    });

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.STAGING, featureId: newCheckout.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: newCheckout.id,
            env: Environment.STAGING,
            enabled: true,
            strategyType: StrategyType.PERCENTAGE,
            strategyConfig: { percentage: 50 }, // 50% in staging
        },
    });

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.PROD, featureId: newCheckout.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: newCheckout.id,
            env: Environment.PROD,
            enabled: true,
            strategyType: StrategyType.PERCENTAGE,
            strategyConfig: { percentage: 10 }, // Only 10% in production (canary)
        },
    });
    console.log(`    🚩 Flags: new_checkout_v2 (DEV: 100%, STAGING: 50%, PROD: 10%)`);

    // ============================================================================
    // FLAGS FOR BETA FEATURES (User targeting - specific users)
    // ============================================================================

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: zebra.id, env: Environment.PROD, featureId: betaFeatures.id } },
        update: {},
        create: {
            tenantId: zebra.id,
            featureId: betaFeatures.id,
            env: Environment.PROD,
            enabled: true,
            strategyType: StrategyType.USER_TARGETING,
            strategyConfig: {
                rules: [
                    {
                        attribute: 'userId',
                        operator: 'in',
                        values: ['user_beta_001', 'user_beta_002', 'user_vip_100'],
                    },
                    {
                        attribute: 'email',
                        operator: 'contains',
                        values: ['@zebra-internal.com'],
                    },
                ],
                defaultValue: false,
            },
        },
    });
    console.log(`    🚩 Flags: beta_features (PROD: targeted users only)`);

    // ============================================================================
    // FEATURES FOR YMS
    // ============================================================================

    const aiAssistant = await prisma.feature.upsert({
        where: { tenantId_key: { tenantId: yms.id, key: 'ai_assistant' } },
        update: {},
        create: {
            tenantId: yms.id,
            key: 'ai_assistant',
            name: 'AI Assistant',
            description: 'AI-powered customer support assistant',
        },
    });
    console.log(`  📦 Feature: ${aiAssistant.name} (YMS)`);

    await prisma.featureFlag.upsert({
        where: { tenantId_env_featureId: { tenantId: yms.id, env: Environment.PROD, featureId: aiAssistant.id } },
        update: {},
        create: {
            tenantId: yms.id,
            featureId: aiAssistant.id,
            env: Environment.PROD,
            enabled: true,
            strategyType: StrategyType.PERCENTAGE,
            strategyConfig: { percentage: 25 },
        },
    });
    console.log(`    🚩 Flags: ai_assistant (PROD: 25%)`);

    console.log('\n✨ Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - 2 Tenants (Zebra Electronics, YMS Yazılım)`);
    console.log(`   - 4 Features`);
    console.log(`   - 8 Feature Flags`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

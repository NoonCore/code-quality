const { CodeQualityChecker } = require('../index.js');

// Example 1: Custom tool selection
const customChecker = new CodeQualityChecker({
  tools: ['TypeScript', 'ESLint'], // Only run TypeScript and ESLint
  commands: {
    TypeScript: 'tsc --noEmit',
    ESLint: 'eslint src/ --ext .ts,.tsx'
  }
});

// Example 2: Different configuration for different environments
const isCI = process.env.CI === 'true';
const ciChecker = new CodeQualityChecker({
  tools: isCI ? ['TypeScript', 'ESLint'] : ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
  loadEnv: !isCI // Don't load .env in CI
});

// Example 3: Programmatic usage
async function runQualityCheck() {
  console.log('Running custom quality check...');
  
  const result = await customChecker.run();
  
  if (result.success) {
    console.log('✅ Custom checks passed!');
    return true;
  } else {
    console.log('❌ Custom checks failed!');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runQualityCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runQualityCheck };

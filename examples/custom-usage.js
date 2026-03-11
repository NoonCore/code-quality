const { CodeQualityChecker, runQualityCheck } = require('code-quality-lib')

// ─── Example 1: Run all checks with defaults ────────────────────────────────

async function example1() {
  const result = await runQualityCheck()
  console.log(result.success ? '✅ All passed' : '❌ Some failed')
}

// ─── Example 2: Custom tool selection ────────────────────────────────────────

async function _example2() {
  const checker = new CodeQualityChecker({
    tools: ['TypeScript', 'ESLint'], // only run these
  })
  const result = await checker.run()
  console.log(`Passed: ${result.results.filter((r) => r.success).length}`)
}

// ─── Example 3: Custom commands ──────────────────────────────────────────────

async function _example3() {
  const checker = new CodeQualityChecker({
    tools: ['TypeScript', 'ESLint', 'Prettier'],
    commands: {
      TypeScript: 'tsc --noEmit',
      ESLint: 'eslint src/ --ext .ts,.tsx',
      Prettier: 'prettier --check "src/**/*.{ts,tsx}"',
    },
  })
  await checker.run({ showLogs: true })
}

// ─── Example 4: CI environment ───────────────────────────────────────────────

async function _example4() {
  const isCI = process.env.CI === 'true'
  const checker = new CodeQualityChecker({
    tools: isCI ? ['TypeScript', 'ESLint'] : ['TypeScript', 'ESLint', 'Prettier', 'Knip', 'Snyk'],
    packageManager: 'npm',
    loadEnv: !isCI,
  })
  const result = await checker.run({ showLogs: isCI })
  process.exit(result.success ? 0 : 1)
}

// Run selected example
if (require.main === module) {
  example1()
}

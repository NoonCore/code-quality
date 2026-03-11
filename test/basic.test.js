const { execSync } = require('child_process')
const fs = require('fs')

// Simple test runner
function runTest(testName, testFn) {
  try {
    testFn()
    console.log(`✅ ${testName}`)
    return true
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`)
    return false
  }
}

// Test 1: Required files exist
function testFilesExist() {
  const required = ['index.js', 'index.d.ts', 'package.json', 'README.md', 'LICENSE']
  for (const file of required) {
    if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`)
  }
}

// Test 2: package.json has required fields
function testPackageJson() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const fields = ['name', 'version', 'main', 'types', 'bin', 'engines', 'author', 'license']
  for (const field of fields) {
    if (!pkg[field]) throw new Error(`Missing or empty "${field}" in package.json`)
  }
}

// Test 3: TypeScript definitions match exports
function testTypeScriptDefinitions() {
  const dts = fs.readFileSync('index.d.ts', 'utf8')
  const required = [
    'CodeQualityChecker',
    'CodeQualityOptions',
    'QualityCheckResult',
    'runQualityCheck',
  ]
  for (const symbol of required) {
    if (!dts.includes(symbol)) throw new Error(`Missing "${symbol}" in index.d.ts`)
  }
}

// Test 4: Library exports correct symbols
function testExports() {
  const lib = require('../index.js')

  if (typeof lib.CodeQualityChecker !== 'function') {
    throw new Error('CodeQualityChecker is not exported as a function/class')
  }
  if (typeof lib.runQualityCheck !== 'function') {
    throw new Error('runQualityCheck is not exported as a function')
  }
}

// Test 5: CodeQualityChecker instantiation & options
function testClassInstantiation() {
  const { CodeQualityChecker } = require('../index.js')

  // Default options
  const checker = new CodeQualityChecker({ tools: [] })
  if (!checker.options) throw new Error('options not initialized')
  if (!Array.isArray(checker.options.tools)) throw new Error('tools not an array')
  if (typeof checker.options.packageManager !== 'string')
    throw new Error('packageManager not detected')

  // Custom options
  const custom = new CodeQualityChecker({
    tools: ['TypeScript'],
    packageManager: 'pnpm',
    loadEnv: false,
  })
  if (custom.options.packageManager !== 'pnpm') throw new Error('packageManager override failed')
  if (custom.options.tools.length !== 1) throw new Error('tools override failed')
}

// Test 6: Bundled dependencies exist
function testDependencies() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (!pkg.dependencies) throw new Error('No dependencies in package.json')

  const required = ['typescript', 'eslint', 'prettier', 'knip', 'snyk']
  for (const dep of required) {
    if (!pkg.dependencies[dep]) throw new Error(`Missing dependency: ${dep}`)
  }
}

// Test 7: CLI --help
function testCLIHelp() {
  const result = execSync('node index.js --help', {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 5000,
  })
  if (!result.includes('Usage:')) throw new Error('--help output missing "Usage:"')
  if (!result.includes('--logs')) throw new Error('--help output missing "--logs"')
}

// Test 8: CLI --version
function testCLIVersion() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const result = execSync('node index.js --version', {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 5000,
  })
  if (result.trim() !== pkg.version) {
    throw new Error(`Version mismatch: CLI="${result.trim()}" package="${pkg.version}"`)
  }
}

// ─── Run All ────────────────────────────────────────────────────────────────

function runAllTests() {
  console.log('🧪 Running Code Quality Library Tests\n')

  const tests = [
    { name: 'Required files exist', fn: testFilesExist },
    { name: 'package.json structure', fn: testPackageJson },
    { name: 'TypeScript definitions', fn: testTypeScriptDefinitions },
    { name: 'Library exports', fn: testExports },
    { name: 'Class instantiation & options', fn: testClassInstantiation },
    { name: 'Bundled dependencies', fn: testDependencies },
    { name: 'CLI --help', fn: testCLIHelp },
    { name: 'CLI --version', fn: testCLIVersion },
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    if (runTest(test.name, test.fn)) {
      passed++
    } else {
      failed++
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('🎉 All tests passed!')
  }
}

if (require.main === module) {
  runAllTests()
}

module.exports = { runAllTests }

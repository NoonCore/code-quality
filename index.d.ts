export interface CodeQualityOptions {
  /** Load environment variables from .env file (default: true) */
  loadEnv?: boolean;
  /** Use project's own config files instead of bundled configs (default: true) */
  useProjectConfig?: boolean;
  /** Array of tool names to run (default: all tools) */
  tools?: string[];
  /** Custom commands for each tool, keyed by tool name */
  commands?: Record<string, string>;
  /** Custom descriptions for each tool, keyed by tool name */
  descriptions?: Record<string, string>;
  /** Force a specific package manager (auto-detected if not specified) */
  packageManager?: 'bun' | 'pnpm' | 'yarn' | 'npm';
  /** Show detailed error logs in terminal */
  showLogs?: boolean;
}

export interface CommandResult {
  success: boolean;
  output: string;
}

export interface CheckResult {
  name: string;
  description: string;
  success: boolean;
  output: string;
}

export interface QualityCheckResult {
  success: boolean;
  message: string;
  results: CheckResult[];
}

export class CodeQualityChecker {
  options: Required<Omit<CodeQualityOptions, 'showLogs'>>;

  constructor(options?: CodeQualityOptions);

  /** Execute a single shell command and return the result */
  runCommand(command: string, description: string): CommandResult;

  /** Run all configured quality checks */
  run(options?: { showLogs?: boolean }): Promise<QualityCheckResult>;
}

/** Convenience function to run quality checks without instantiating the class */
export function runQualityCheck(options?: CodeQualityOptions): Promise<QualityCheckResult>;

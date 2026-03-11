export interface CodeQualityOptions {
  loadEnv?: boolean;
  tools?: string[];
  commands?: Record<string, string>;
  descriptions?: Record<string, string>;
  packageManager?: 'bun' | 'pnpm' | 'yarn' | 'npm';
}

export interface CommandResult {
  success: boolean;
  output: string;
}

export interface QualityCheckResult {
  success: boolean;
  message: string;
}

export class CodeQualityChecker {
  constructor(options?: CodeQualityOptions);
  
  runCommand(command: string, description: string): CommandResult;
  
  formatOutput(tool: string, result: CommandResult): string;
  
  checkSnykToken(): boolean;
  
  run(): Promise<QualityCheckResult>;
}

export function runQualityCheck(options?: CodeQualityOptions): Promise<QualityCheckResult>;

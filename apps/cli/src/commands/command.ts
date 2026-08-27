import { INestApplicationContext } from '@nestjs/common';
import { OptionValues } from 'commander';

export interface CommandOption {
  flags: string;
  description?: string;
  defaultValue?: string | boolean | string[];
  required?: boolean;
}

export interface CliCommand {
  name: string;
  description: string;
  options?: CommandOption[];
  run(app: INestApplicationContext, options: OptionValues): Promise<void>;
}

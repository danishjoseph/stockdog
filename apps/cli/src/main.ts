import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Command } from 'commander';
import { CliModule } from './cli.module';
import { CliCommand, commands } from './commands';

const logger = new Logger('stockdog');

let app: INestApplicationContext | null = null;

const getApp = async (): Promise<INestApplicationContext> => {
  if (!app) {
    app = await NestFactory.createApplicationContext(CliModule, {
      logger: ['log', 'warn', 'error'],
      abortOnError: false,
    });
  }
  return app;
};

const closeApp = async (): Promise<void> => {
  if (app) {
    await app.close();
    app = null;
  }
};

const registerCommand = (program: Command, command: CliCommand): void => {
  const parts = command.name.split(' ');
  let cmd = program;
  for (const part of parts) {
    cmd = cmd.command(part);
  }

  cmd.description(command.description);

  for (const option of command.options ?? []) {
    if (option.required) {
      cmd.requiredOption(option.flags, option.description, option.defaultValue);
    } else {
      cmd.option(option.flags, option.description, option.defaultValue);
    }
  }

  cmd.action(async (options) => {
    try {
      const context = await getApp();
      await command.run(context, options);
    } catch (error) {
      logger.error(`Command failed: ${error.message}`);
      await closeApp();
      process.exit(1);
    }
  });
};

const bootstrap = async (): Promise<void> => {
  const program = new Command()
    .name('stockdog')
    .description('Stockdog CLI - market data operations')
    .version(process.env.STOCKDOG_VERSION);

  for (const command of commands) {
    registerCommand(program, command);
  }

  await program.parseAsync(process.argv);
  await closeApp();
};

bootstrap();

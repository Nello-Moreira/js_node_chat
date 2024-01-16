import dotenv from 'dotenv';
import path from 'node:path';
import { Client } from 'pg';
import { migrate, rollback } from './dbFunctions';
import { generateMigrationFile, removeCompiledFolder } from './helpers';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbClient = new Client({
	user: process.env.user,
	password: process.env.password,
	host: process.env.host,
	database: process.env.database,
	port: process.env.port !== undefined ? parseInt(process.env.port) : undefined,
	connectionString: process.env.DATABASE_URL,
});

const knownCommands = ['create', 'migrate', 'rollback'] as const;
type KnownCommands = (typeof knownCommands)[number];
function isKnownCommand(command: string): command is KnownCommands {
	// @ts-expect-error this is a type guard
	return knownCommands.includes(command);
}
async function main(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const [command, ...args] = process.argv.slice(2);
	if (!isKnownCommand(command)) {
		console.error('>>> Error: Unknown command: ' + command);
		console.info('>>> Valid commands: ' + knownCommands.join(', '));
		return;
	}
	await removeCompiledFolder();
	await dbClient.connect();
	switch (command) {
		case 'create':
			if (args.length === 0) {
				console.error('>>> Error: must provide a filename');
				return;
			}
			await generateMigrationFile(args[0]);
			break;
		case 'migrate':
			await migrate(dbClient, args[0] ? Number(args[0]) : undefined);
			break;
		case 'rollback':
			await rollback(dbClient, args[0] ? Number(args[0]) : undefined);
			break;
	}
	await dbClient.end();
	console.log('>>> Done');
}
void main();

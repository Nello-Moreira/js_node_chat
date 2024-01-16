import { build } from 'esbuild';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import type { Client } from 'pg';
import { migrationFileTemplate } from './fileTemplate';

export const migrationFilesDir = path.join(__dirname, `./files`);
export const compileMigrationsDir = path.join(
	migrationFilesDir,
	'../compiledMigrations'
);
export async function generateMigrationFile(
	migrationName: string
): Promise<void> {
	if (!fs.existsSync(migrationFilesDir)) {
		await fsPromises.mkdir(migrationFilesDir);
	}
	const filePath = path.join(
		migrationFilesDir,
		`./${Date.now()}-${migrationName}.ts`
	);
	await fsPromises.writeFile(filePath, migrationFileTemplate);
	console.log('>>> Generated migration file: ' + filePath);
}
export async function removeCompiledFolder(): Promise<void> {
	if (fs.existsSync(compileMigrationsDir)) {
		await fsPromises.rm(compileMigrationsDir, { recursive: true });
	}
}
export async function compileMigrationFiles(
	migrationFiles: string[]
): Promise<void> {
	for (const migrationFile of migrationFiles) {
		await build({
			entryPoints: [path.join(migrationFilesDir, migrationFile)],
			outdir: compileMigrationsDir,
		});
	}
}
type MigrationFile = {
	default: {
		up?: (c: Client) => Promise<void>;
		down?: (c: Client) => Promise<void>;
	};
};
export function isMigrationFile(
	migration: unknown
): migration is MigrationFile {
	return typeof migration === 'object' && !!migration && 'default' in migration;
}

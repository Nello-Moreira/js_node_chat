import fsPromises from 'node:fs/promises';
import path from 'path';
import type { Client } from 'pg';
import {
	compileMigrationFiles,
	compileMigrationsDir,
	isMigrationFile,
	migrationFilesDir,
	removeCompiledFolder,
} from './helpers';

async function runTransaction<T>(
	dbClient: Client,
	fn: (dbClient: Client) => Promise<T>
): Promise<T> {
	await dbClient.query('BEGIN');
	try {
		const result = await fn(dbClient);
		await dbClient.query('COMMIT');
		return result;
	} catch (err) {
		await dbClient.query('ROLLBACK');
		throw err;
	}
}
async function setMigrationTable(dbClient: Client): Promise<void> {
	await dbClient.query(
		'CREATE TABLE IF NOT EXISTS migrations (id TEXT NOT NULL, name TEXT NOT NULL)'
	);
}
async function getRunnedMigrations(dbClient: Client): Promise<string[]> {
	return (
		await dbClient.query<{ id: number; name: string }>(
			'SELECT * FROM migrations ORDER BY id ASC'
		)
	).rows.map(m => `${m.id}-${m.name}`);
}
async function saveMigration(dbClient: Client, file: string): Promise<void> {
	const [id, ...name] = path.parse(file).name.split('-');
	await dbClient.query('INSERT INTO migrations (id, name) VALUES ($1, $2)', [
		id,
		name.join('-'),
	]);
}
async function deleteMigration(dbClient: Client, file: string): Promise<void> {
	const [id, ...name] = path.parse(file).name.split('-');
	await dbClient.query('DELETE FROM migrations WHERE id = $1 and name = $2', [
		id,
		name.join('-'),
	]);
}
async function runMigrations(
	dbClient: Client,
	upOrDown: 'down' | 'up',
	files: string[]
): Promise<void> {
	try {
		for (const file of files) {
			const migration: unknown = await import(
				path.join(compileMigrationsDir, file)
			);
			if (isMigrationFile(migration)) {
				switch (upOrDown) {
					case 'up':
						console.log('>>> Running migration ' + file);
						if (migration.default.up)
							await Promise.all([
								migration.default.up(dbClient),
								saveMigration(dbClient, file),
							]);
						break;
					case 'down':
						console.log('>>> Running rollback: ' + file);
						if (migration.default.down)
							await Promise.all([
								migration.default.down(dbClient),
								deleteMigration(dbClient, file),
							]);
				}
				continue;
			}
			throw new Error('Invalid migration entry');
		}
		await removeCompiledFolder();
	} catch (error) {
		await removeCompiledFolder();
		console.log('>>> Migrations failed: rollback executed');
		throw error;
	}
}
export async function migrate(
	dbClient: Client,
	quantity?: number
): Promise<void> {
	await runTransaction(dbClient, async c => {
		await setMigrationTable(c);
		const runnedMigrations = await getRunnedMigrations(c);
		const files = (await fsPromises.readdir(migrationFilesDir))
			.sort()
			.slice(0, quantity)
			.filter(f => !runnedMigrations.includes(path.parse(f).name));
		if (files.length === 0) {
			console.error('>>> No pending migrations files');
			return;
		}
		await compileMigrationFiles(files);
		const compiledFiles = (
			await fsPromises.readdir(compileMigrationsDir)
		).sort();
		await runMigrations(c, 'up', compiledFiles);
	});
}
export async function rollback(
	dbClient: Client,
	quantity?: number
): Promise<void> {
	await runTransaction(dbClient, async c => {
		await setMigrationTable(c);
		const runnedMigrations = await getRunnedMigrations(c);
		const files = (await fsPromises.readdir(migrationFilesDir))
			.sort()
			.reverse()
			.filter(f => runnedMigrations.includes(path.parse(f).name))
			.slice(0, quantity ?? 1);
		if (files.length === 0) {
			console.error('>>> No pending rollback files');
			return;
		}
		await compileMigrationFiles(files);
		const compiledFiles = (await fsPromises.readdir(compileMigrationsDir))
			.sort()
			.reverse();
		await runMigrations(dbClient, 'down', compiledFiles);
	});
}

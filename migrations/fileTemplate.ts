export const migrationFileTemplate = `import type { Client } from 'pg';

export async function up(client: Client): Promise<void> {
	await client.query('SELECT true');
}
export async function down(client: Client): Promise<void> {
	await client.query('SELECT true');
}
`;

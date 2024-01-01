/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { BuildOptions, Plugin } from 'esbuild';
import { build, context } from 'esbuild';
import { exec, spawn } from 'node:child_process';
import path from 'node:path';

const serverDistDirPath = path.join(__dirname, '../dist/server');
const serverDistFile = path.join(serverDistDirPath, './index.js');

export function server() {
	const config: BuildOptions = {
		entryPoints: [path.join(__dirname, '../src/server/index.ts')],
		bundle: true,
		outfile: serverDistFile,
		assetNames: 'assets/[name].[hash]',
		platform: 'node',
		metafile: true,
		minify: process.env.NODE_ENV !== 'development',
		sourcemap: true,
		jsx: 'automatic',
	};
	return {
		build: async (arg?: { plugins?: Plugin[] }) =>
			build({ ...config, plugins: arg?.plugins }),
		destroy: async () =>
			new Promise<void>(resolve => {
				exec(`rm -rf ${serverDistDirPath}`, () => {
					resolve();
				});
			}),
		run: async () =>
			new Promise<void>(resolve => {
				const p = spawn('yarn', ['node', serverDistFile], { stdio: 'inherit' });
				p.once('close', resolve);
			}),
		'hot-reload': async (arg?: { plugins?: Plugin[] }) => {
			const c = await context({ ...config, plugins: arg?.plugins });
			await c.watch();
			return new Promise<void>(resolve => {
				const n = spawn(
					'nodemon',
					[serverDistFile, '--watch', serverDistFile, '--delay', '1s'],
					{ stdio: ['inherit', 'inherit', 'inherit', 'ipc'] }
				);
				n.on('exit', () => {
					c.dispose()
						.then(resolve)
						.catch(() => {
							console.log('Failed to exit');
						});
				});
			});
		},
	};
}

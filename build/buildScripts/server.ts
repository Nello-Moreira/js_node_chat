/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import type { BuildOptions, Plugin } from 'esbuild';
import { build } from 'esbuild';
import { exec } from 'node:child_process';
import path from 'node:path';

export const serverPath = path.join(__dirname, '../src/server');
const serverDistDirPath = path.join(__dirname, '../dist/server');

export function server() {
	const config: BuildOptions = {
		entryPoints: [`${serverPath}/index.ts`],
		bundle: true,
		outdir: serverDistDirPath,
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
	};
}

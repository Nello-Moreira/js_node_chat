/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { exec } from 'node:child_process';
import path from 'node:path';

const serverDistDirPath = path.join(__dirname, '../dist/server');

export function server() {
	return {
		destroy: async () =>
			new Promise<void>(resolve => {
				exec(`rm -rf ${serverDistDirPath}`, () => {
					resolve();
				});
			}),
	};
}

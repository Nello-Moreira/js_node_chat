import dotenv from 'dotenv';
import type { BuildResult, Plugin, PluginBuild } from 'esbuild';
import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { server } from './buildScripts/server';

dotenv.config({ path: path.join(__dirname, '../.env') });
const promiseExec = promisify(exec);

type Builder = {
	destroy: () => Promise<void>;
	build: (arg?: { plugins?: Plugin[] }) => Promise<BuildResult>;
	run: () => Promise<void>;
	'hot-reload': (arg?: { plugins?: Plugin[] }) => Promise<void>;
};
const builders: Record<KnownProjects[number], Builder> = {
	server: server(),
};
const knownCommands = [
	'build',
	'run',
	'destroy',
	'destroy-all',
	'hot-reload',
] as const;
const knownProjects = ['server'] as const;
type KnownCommands = (typeof knownCommands)[number];
type KnownProjects = typeof knownProjects;
function isKnownCommand(command: string): command is KnownCommands {
	// @ts-expect-error this is a type guard
	return knownCommands.includes(command);
}
function isKnownProject(project: string): project is KnownProjects[number] {
	// @ts-expect-error this is a type guard
	return knownProjects.includes(project);
}
function isKnownProjectList(list: readonly string[]): list is KnownProjects {
	return list.filter(isKnownProject).length === list.length;
}
function logPlugin(
	project: string,
	onStartMessage = '',
	onEndMessage = ''
): Plugin {
	return {
		name: 'log',
		setup: (build: PluginBuild) => {
			if (onStartMessage)
				build.onStart(() => {
					console.log(`>>> ${project}: ${onStartMessage}\n`);
				});
			if (onEndMessage)
				build.onEnd(buildResult => {
					if (buildResult.errors.length > 0) {
						console.error(buildResult.errors);
						return;
					}
					console.log(`>>> ${project}: ${onEndMessage}\n`);
				});
		},
	};
}
async function main(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const [command, ...projects] = process.argv.slice(2);
	if (!isKnownCommand(command)) {
		console.error('>>> Error: Unknown command: ' + command);
		console.info('>>> Valid commands: ' + knownCommands.join(', '));
		return;
	}
	if (!isKnownProjectList(projects)) {
		console.error(
			'>>> Error: Unknown projects: ' +
				projects.filter(p => !isKnownProject(p)).join(', ')
		);
		console.info('>>> Valid projects: ' + knownProjects.join(', '));
		return;
	}
	switch (command) {
		case 'destroy-all':
			await promiseExec(`rm -rf ${path.join(__dirname, '../dist')}`);
			break;
		default:
			await Promise.all(
				projects.map(async (p: KnownProjects[number]) =>
					builders[p][command]({
						plugins: [logPlugin(p, 'building...', 'build completed')],
					})
				)
			);
	}
	console.log('>>> Done');
}
void main();

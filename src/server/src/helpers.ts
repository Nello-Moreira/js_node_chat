import type { Router } from './router';
import { router } from './router';

export type HttpMethods = typeof httpMethods;

export function isValidEndpoint(endpoint: string): endpoint is keyof Router {
	return Object.keys(router).includes(endpoint);
}
const httpMethods = [
	'GET',
	'POST',
	'PUT',
	'DELETE',
	'HEAD',
	'OPTIONS',
	'CONNECT',
	'PATCH',
] as const;
export function isValidHttpMethod(
	method?: string
): method is HttpMethods[number] {
	return method === undefined
		? false
		: // @ts-expect-error helper function
			httpMethods.includes(method);
}

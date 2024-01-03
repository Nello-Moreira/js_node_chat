import http from 'node:http';
import { isValidEndpoint, isValidHttpMethod } from './src/helpers';
import { router } from './src/router';

type Req = http.IncomingMessage;
type Res = http.ServerResponse;

const requestHandler = (req: Req, res: Res): void => {
	if (!isValidHttpMethod(req.method)) {
		res.statusCode = 400;
		res.end('Invalid http method');
		return;
	}
	const url = new URL(req.url ?? '', `http://${req.headers.host}`);
	const endpoint = url.pathname;
	if (!isValidEndpoint(endpoint)) {
		res.statusCode = 404;
		res.end('Invalid endpoint');
		return;
	}
	const fn = router[endpoint][req.method];
	if (!fn) {
		res.statusCode = 400;
		res.end('Invalid method');
		return;
	}
	void fn(req, res);
	return;
};
const defaultPort = 8085;
const s = http
	.createServer(requestHandler)
	.listen({ port: process.env.PORT ?? defaultPort }, () => {
		console.log(
			`>>> server: listening on port ${process.env.PORT ?? defaultPort}`
		);
	})
	.on('close', () => {
		console.log('>>> server: closed');
	});
process.on('SIGINT', () => {
	s.close();
});

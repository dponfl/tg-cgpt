// import fetch from 'node-fetch';

// const test = async () => {
// 	console.log('Run test func');

// 	const body = { a: 1 };

// 	const response = await fetch('https://httpbin.org/post', {
// 		method: 'post',
// 		body: JSON.stringify(body),
// 		headers: { 'Content-Type': 'application/json' }
// 	});
// 	const data = await response.json();

// 	console.log(data);

// };

// test();

import express, { Request, Response } from 'express';

const app = express();

const port = process.env.PORT || 3000;

const html = `
<div>
	<ul>
		<li>
			<a href='/'>Home</a>
		</li>
		<li>
			<a href='/about'>About</a>
		</li>
	</ul>
</div>
`;

app.get('/', (req: Request, res: Response) => {
	res.end(`
${html}

<h1>Home page</h1>
	`);
});

app.get('/about', (req: Request, res: Response) => {
	res.end(`
${html}

<h1>About page</h1>
	`);
});

app.listen(port, () => {
	console.log('App started');
});
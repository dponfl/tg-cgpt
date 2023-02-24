

/**
 * node-fetch test
 */

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

/**
 * Express test
 */

// import express, { Request, Response } from 'express';


// const app = express();

// const port = process.env.PORT || 3000;

// const html = `
// <div>
// 	<ul>
// 		<li>
// 			<a href='/'>Home</a>
// 		</li>
// 		<li>
// 			<a href='/about'>About</a>
// 		</li>
// 	</ul>
// </div>
// `;

// app.get('/', (req: Request, res: Response) => {
// 	res.end(`
// ${html}

// <h1>Home page</h1>
// 	`);
// });

// app.get('/about', (req: Request, res: Response) => {
// 	res.end(`
// ${html}

// <h1>About page</h1>
// 	`);
// });

// app.listen(port, () => {
// 	console.log('App started');
// });


/**
 * openai test
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import express, { Request, Response } from 'express';
import { Configuration, CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from 'openai';
import { exit } from 'process';

if (!process.env.OPENAI_API_KEY) {
	console.error('No OPENAI_API_KEY');
	exit(1);
}

const configuration: Configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();

const port = process.env.PORT || 3000;

const html: string = `
<!DOCTYPE html>
    <html>
        <body>
        <h1>response:</h1>
        <div id="result"></div>
        <script>
        var source = new EventSource("/completion");
        source.onmessage = function(event) {
            document.getElementById("result").innerHTML += event.data + "<br>";
        };
        </script>
        </body>
    </html>
`;

app.get('/', (req: Request, res: Response) => {
	console.log('app.get(/)');
	res.send(html);
});

app.get('/completion', async (req: Request, res: Response) => {

	try {

		console.log('app.get(completion)');

		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Connection', 'keep-alive');
		res.flushHeaders(); // flush the headers to establish SSE with client

		const prompt: string = process.env.PROMPT || 'Capital of France';

		const createCompletionRequest: CreateCompletionRequest = {
			model: 'text-davinci-003',
			prompt,
			max_tokens: 4000 - prompt.length,
			stream: true
		};

		const options: AxiosRequestConfig = {
			responseType: 'stream'
		};

		const response: AxiosResponse = await openai.createCompletion(createCompletionRequest, options);

		response.data.on('data', (data: string): void => {

			console.log(`Data received: ${data}`);

			const lines: string[] = data.toString().split('\n').filter((line: string) => line.trim() !== '');

			for (const line of lines) {
				const message: string = line.replace(/^data: /, '');
				if (message === '[DONE]') {
					res.end();
				}

				const parsed: CreateCompletionResponse = JSON.parse(message);
				res.write(`data: ${parsed.choices[0].text}\n\n`);
			}
		});

	} catch (err) {
		if (err instanceof Error) {
			console.error(`Error: ${err.message}`);
		}
	}

});

app.listen(port, () => {
	// tslint:disable-next-line: no-console
	console.log(`Example app listening on port ${port}`);
});

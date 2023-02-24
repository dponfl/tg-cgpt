// import { AxiosRequestConfig, AxiosResponse } from 'axios';
// import { Configuration, CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from 'openai';
// import { exit } from 'process';

// if (!process.env.OPENAI_API_KEY) {
// 	console.error('No OPENAI_API_KEY');
// 	exit(1);
// }

// const port = process.env.PORT;

// if (!port) {
// 	console.error('No port');
// 	exit(1);
// }

// const callGhatGPT = async () => {

// 	try {

// 		console.log('Sending request to ChatGPT');

// 		const configuration: Configuration = new Configuration({
// 			apiKey: process.env.OPENAI_API_KEY,
// 		});

// 		const openai = new OpenAIApi(configuration);

// 		const prompt: string = process.env.PROMPT || 'Capital of France';

// 		const createCompletionRequest: CreateCompletionRequest = {
// 			model: 'text-davinci-003',
// 			prompt,
// 			max_tokens: 4000 - prompt.length,
// 			stream: true
// 		};

// 		const options: AxiosRequestConfig = {
// 			responseType: 'stream'
// 		};

// 		const textResponse: string[] = [];

// 		const response: AxiosResponse = await openai.createCompletion(createCompletionRequest, options);

// 		response.data.on('data', (data: string): void => {

// 			// console.log(`Data received: ${data}`);

// 			const lines: string[] = data.toString().split('\n').filter((line: string) => line.trim() !== '');

// 			for (const line of lines) {
// 				const message: string = line.replace(/^data: /, '').replace('\n', ' ');
// 				if (message === '[DONE]') {
// 					console.log(`\n\nRequest completed: ${textResponse.join(' ')}`);
// 					return;
// 				}

// 				const parsed: CreateCompletionResponse = JSON.parse(message);

// 				if (typeof parsed.choices[0].text === 'string') {
// 					textResponse.push(`${parsed.choices[0].text} `);
// 					console.log(`data: ${parsed.choices[0].text}`);
// 				} else {
// 					console.log('Received text is not string');
// 				}

// 			}
// 		});

// 	} catch (err) {
// 		if (err instanceof Error) {
// 			console.error(`Error: ${err.message}`);
// 		}
// 	}

// };

// callGhatGPT();


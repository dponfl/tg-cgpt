export interface IAI {
	textRequest(str: string): Promise<string>;
}
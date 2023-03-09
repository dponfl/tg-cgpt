export interface IUserRecord {
	id: number;
	guid: string;
	firstname: string;
	surname: string;
}

export interface IUserStorageSevice {
	getUserById(id: number): Promise<IUserRecord>;
}
export interface AuthKey {
	sign_type: number;
	authkey_ver: number;
	authkey: string;
}

export interface GachaPoolInfo {
	begin_time: string;
	end_time: string;
	gacha_id: string;
	gacha_name: string;
	gacha_type: number;
}
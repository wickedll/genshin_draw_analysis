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

export interface Gacha_Info {
	uid: string;
	gacha_type: string;
	item_id: string;
	count: string;
	time: string;
	name: string;
	lang: string;
	item_type: string;
	rank_type: string;
	id: string;
}

export interface Standard_Gacha {
	info: Standard_Gacha_Info;
	list: Standard_Gacha_Data[];
}

export interface Standard_Gacha_Info {
	uid: string;
	lang: string;
	export_time: string;
	export_timestamp: number;
	export_app: string;
	export_app_version: string;
	uigf_version: string;
	region_time_zone: number;
}

export interface Standard_Gacha_Data {
	id: string | null | undefined;
	name: string;
	item_id: string;
	item_type: string;
	rank_type: string;
	gacha_type: string;
	count: string;
	time: string;
	uigf_gacha_type: string;
}

export interface Standard_Gacha_Excel_Origin_Data {
	count: string;
	gacha_type: string;
	id: string | null | undefined;
	item_id: string;
	item_type: string;
	lang: string;
	name: string;
	rank_type: string;
	time: string;
	uid: string;
	uigf_gacha_type: string;
}

export interface FakeIdFunc {
	(): string;
}

export interface Standard_Gacha_Excel {
	time: string;
	name: string;
	item_type: string;
	rank_type: string;
	gacha_type: string;
}

export interface QiniuOssConfig {
	enable: boolean;
	accessKey: string;
	secretKey: string;
	bucket: string;
	// 带协议头
	domain: string;
	// 上传后的目录
	folder: string;
	uses3: boolean;
	s3endpoint: string;
	s3region: string;
}

/**
 * @api_log_url 接口地址
 * @log_html_url 网页地址（抽卡分析通用URL）
 */
export interface GachaUrl {
	api_log_url: string;
	log_html_url: string;
	cookie?: string;
}
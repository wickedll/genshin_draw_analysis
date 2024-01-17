import { Md5 } from "md5-typescript";
import { AuthKey, FakeIdFunc, GachaPoolInfo, GachaUrl, QiniuOssConfig } from "#/genshin_draw_analysis/util/types";
import Database from "@/modules/database";
import { exec } from "child_process";
import FileManagement from "@/modules/file";
import { generateAuthKey, getSToken, updatePoolId } from "#/genshin_draw_analysis/util/api";
import { getRegion } from "#/genshin/utils/region";
import fetch from "node-fetch";
import bot from "ROOT";
import { createReadStream } from "fs";
import { getRandomString } from "@/utils/random";

async function sleep( ms: number ): Promise<void> {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

function parseID( msg: string ): number {
	if ( !msg ) {
		return 1;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id;
	}
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] );
	} else {
		return 1;
	}
}

function generateDS(): string {
	const n: string = "dWCcD2FsOUXEstC5f9xubswZxEeoBOTc";
	const i: number = Date.now() / 1000 | 0;
	const r: string = getRandomString( 6 ).toLowerCase();
	const c: string = Md5.init( `salt=${ n }&t=${ i }&r=${ r }` );
	
	return `${ i },${ r },${ c }`;
}

export function getGameBiz( first: string ): string {
	switch ( first ) {
		case "1":
		case "2":
		case "3":
		case "4":
			return "hk4e_cn";
		case "5":
			return "hk4e_cn";
		default:
			return "hk4e_global";
	}
}

export function obj2ParamsStr( obj: object ): string {
	const params: string[] = [];
	for ( let key in obj ) {
		params.push( `${ key }=${ obj[key] }` );
	}
	return params.join( '&' );
}

export function cookie2Obj( cookie: string ): any {
	return decodeURIComponent( cookie ).split( ";" )
		.filter( item => !!item && item.trim().length > 0 )
		.map( item => item.split( '=' ) )
		.reduce( ( acc, [ k, v ] ) => ( acc[k.trim().replace( '"', '' )] = v ) && acc, {} );
}

export const fakeIdFn: () => FakeIdFunc = () => {
	let id = 1000000000000000000n;
	return () => {
		id = id + 1n
		return id.toString( 10 );
	}
}

const header_zh_cn = {
	time: '时间',
	name: '名称',
	item_type: '类别',
	rank_type: '星级',
	gacha_type: '祈愿类型'
}

const gacha_types_zh_cn = {
	"301": "角色活动祈愿",
	"400": "角色活动祈愿-2",
	"302": "武器活动祈愿",
	"200": "常驻祈愿",
	"100": "新手祈愿"
};
const gacha_types_en_us = {
	"301": "Character Event Wish",
	"400": "Character Event Wish-2",
	"302": "Weapon Event Wish",
	"200": "Standard Wish",
	"100": "Beginner's Wish"
};

const sheet_names_zh_cn = { "301": "角色活动祈愿", "302": "武器活动祈愿", "200": "常驻祈愿", "100": "新手祈愿" };
const sheet_names_en_us = {
	"301": "Character Event Wish",
	"302": "Weapon Event Wish",
	"200": "Standard Wish",
	"100": "Beginner's Wish"
};

export function get_sheet_name( type: string ): string {
	return sheet_names_zh_cn[type];
}

export function convert2Lang( key: string, lang: string ): string {
	return lang === 'zh-cn' ? header_zh_cn[key] : key;
}

export function convert2Readable( gacha_type: string, lang: string ): string {
	return lang === 'zh-cn' ? gacha_types_zh_cn[gacha_type] : gacha_types_en_us[gacha_type];
}

const rank_color = {
	"3": "ff8e8e8e",
	"4": "ffa256e1",
	"5": "ffbd6932",
}

export function getColor( rank_type: string ): string {
	return rank_color[rank_type];
}

export async function upload2Qiniu( file_path: string, file_name: string, qiniu_config: QiniuOssConfig, redis: Database ): Promise<string> {
	if ( !qiniu_config.enable && qiniu_config.uses3 ) {
		const { S3Client, PutObjectCommand } = require( "@aws-sdk/client-s3" );
		// Create an Amazon S3 service client object.
		const s3Client = new S3Client( {
			region: qiniu_config.s3region, endpoint: `https://${ qiniu_config.s3endpoint }`,
			credentials: {
				accessKeyId: qiniu_config.accessKey,
				secretAccessKey: qiniu_config.secretKey
			}
		} );
		
		// Set the parameters
		const params = {
			Bucket: qiniu_config.bucket,
			Key: `${ qiniu_config.folder }/${ file_name }`,
			Body: createReadStream( file_path )
		};
		
		// Create an object and upload it to the Amazon S3 bucket.
		return new Promise( ( resolve, reject ) => {
			s3Client.send( new PutObjectCommand( params ) ).then( () => {
				resolve( `${ qiniu_config.domain }${ params.Key }?attname=${ file_name }` );
			} ).catch( reason => {
				reject( reason );
			} );
		} )
	}
	
	const {
		form_up: { FormUploader },
		auth: { digest },
		rs: { PutPolicy }
	} = require( "qiniu" );
	
	// 获取上传凭证
	let upload_token: string = await redis.getString( "genshin_gacha.oss.upload_token" );
	if ( !upload_token ) {
		const mac = new digest.Mac( qiniu_config.accessKey, qiniu_config.secretKey );
		const options = {
			scope: qiniu_config.bucket
		};
		const putPolicy = new PutPolicy( options );
		upload_token = putPolicy.uploadToken( mac );
		await redis.setString( "genshin_gacha.oss.upload_token", upload_token, 3600 );
	}
	
	// 开始上传
	const formUploader = new FormUploader();
	return new Promise( ( resolve, reject ) => {
		formUploader.putFile( upload_token, `${ qiniu_config.folder }/${ file_name }`, file_path, null, ( respErr, respBody, respInfo ) => {
			if ( respErr ) {
				reject( respErr );
				return;
			}
			
			if ( respInfo.statusCode !== 200 ) {
				reject( respBody );
				return;
			}
			
			const { key } = respBody;
			resolve( `${ qiniu_config.domain }${ key }?attname=${ file_name }` );
		} );
	} );
}

/* 命令执行 */
export async function execHandle( command: string ): Promise<string> {
	return new Promise( ( resolve, reject ) => {
		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( stdout );
			}
		} )
	} )
}

export function checkDependencies( file: FileManagement, ...dependencies ): string[] {
	const path: string = file.getFilePath( "package.json", "root" );
	const { dependencies: dep } = require( path );
	// 过滤出未安装的依赖
	const keys: string[] = Object.keys( dep );
	return dependencies.filter( dependency => !keys.includes( dependency ) );
}

export async function generatorUrl( cookie: string, game_uid: string, mysID: number, server: string ): Promise<GachaUrl | undefined> {
	let url: string;
	let flag: boolean = false;
	// 如果已有 stoken 就不需要再去请求新的，可以解决 login_ticket 经常过期的问题
	if ( !cookie.includes( "stoken" ) ) {
		const { login_ticket } = cookie2Obj( cookie );
		if ( !login_ticket ) {
			throw "cookie缺少login_ticket无法生成URL";
		}
		if ( !cookie.includes( "stuid" ) ) {
			cookie = cookie + ";stuid=" + mysID;
		}
		if ( !cookie.includes( "login_uid" ) ) {
			cookie = cookie + ";login_uid=" + mysID;
		}
		const { list } = await getSToken( mysID, login_ticket, cookie );
		const sToken: string = list[0].token;
		cookie = cookie + ";stoken=" + sToken;
		flag = true;
	}
	const { authkey, authkey_ver, sign_type }: AuthKey = await generateAuthKey( game_uid, server, cookie );
	const { gacha_id, gacha_type }: GachaPoolInfo = await updatePoolId();
	const game_biz: string = getGameBiz( game_uid[0] );
	const params: object = {
		"authkey_ver": authkey_ver,
		"sign_type": sign_type,
		"auth_appid": "webview_gacha",
		"init_type": `${ gacha_type || "200" }`,
		"gacha_id": `${ gacha_id || "3c9dbe90839b4482907f14f08321b6fed9d7de11" }`,
		"timestamp": ( Date.now() / 1000 | 0 ).toString( 10 ),
		"lang": "zh-cn",
		"device_type": "mobile",
		"plat_type": "android",
		"region": getRegion( game_uid[0] ),
		"authkey": authkey,
		"game_biz": game_biz,
		"gacha_type": "301",
		"page": "1",
		"size": "5",
		"end_id": 0,
	}
	let log_html_url: string;
	if ( game_biz === 'hk4e_cn' ) {
		log_html_url = "https://webstatic.mihoyo.com/hk4e/event/e20190909gacha/index.html?";
		url = "https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?";
	} else {
		log_html_url = "https://webstatic.mihoyo.com/hk4e/event/e20190909gacha/index.html?";
		url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog?";
	}
	const paramsStr = obj2ParamsStr( params );
	url += paramsStr;
	log_html_url += paramsStr;
	log_html_url = encodeURI( log_html_url ).replace( /\+/g, "%2B" ) + "#/log";
	
	// 校验URL
	const tmp: string = encodeURI( url ).replace( /\+/g, "%2B" );
	let response = await fetch( tmp, { method: "GET" } );
	let data = await response.json();
	if ( data.retcode === 0 ) {
		return {
			api_log_url: tmp,
			log_html_url,
			cookie: flag ? cookie : undefined
		}
	} else {
		throw `抽卡链接生成失败: ${ data.message }`;
	}
}

export async function getTimeOut( key: string ): Promise<number> {
	return await bot.redis.client.ttl( key );
}

export function secondToString( ttl: number ): string {
	const hour = Math.floor( ttl / 3600 );
	const minute = Math.floor( ( ttl - hour * 3600 ) / 60 );
	const second = ttl % 60;
	return `${ hour } 时 ${ minute } 分 ${ second } 秒`;
}

export function htmlDecode( str: string ): string {
	str = str.replace( /&#(\d+);/gi, function ( match, numStr ) {
		const num = parseInt( numStr, 10 );
		return String.fromCharCode( num );
	} );
	return str.replace( /&amp;/gi, "&" );
}

export { sleep, parseID, generateDS };
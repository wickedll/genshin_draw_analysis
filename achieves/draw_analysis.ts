import { InputParameter } from "@modules/command";
import fetch from "node-fetch";
import bot from "ROOT";
import { cookie2Obj, getGameBiz, obj2ParamsStr, parseID, sleep } from "../util/util";
import { RenderResult } from "@modules/renderer";
import { pageFunction, renderer } from "../init";
import { Sendable } from "oicq";
import { generateAuthKey, getSToken, updatePoolId } from "#genshin_draw_analysis/util/api";
import { Private } from "#genshin/module/private/main";
import { getPrivateAccount } from "#genshin/utils/private";
import { getRegion } from "#genshin/utils/region";
import { AuthKey, GachaPoolInfo } from "#genshin_draw_analysis/util/types";


export async function analysisHandler( idMsg: string, userID: number, sendMessage: ( content: Sendable, allowAt?: boolean ) => Promise<void> ) {
	let id = parseID( idMsg );
	const res: RenderResult = await renderer.asForFunction(
		id === 1 ? "/analysis-phone.html" : "/analysis.html",
		pageFunction, null,
		{ qq: userID }
	);
	if ( res.code === "ok" ) {
		await sendMessage( res.data );
	} else {
		bot.logger.error( res.error );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}

export async function main(
	{ sendMessage, messageData, redis, auth, logger }: InputParameter
): Promise<void> {
	const { user_id: userID, raw_message: idMsg } = messageData;
	let url = await redis.getString( `genshin_draw_analysis_url-${ userID }` );
	if ( !url || url.indexOf( "http" ) <= -1 ) {
		const info: Private | string = await getPrivateAccount( userID, idMsg, auth );
		if ( typeof info === "string" ) {
			await sendMessage( info );
			return;
		}
		
		let { cookie, uid: game_uid, server, mysID } = info.setting;
		try {
			const { login_ticket } = cookie2Obj( cookie );
			if ( !login_ticket ) {
				await sendMessage( 'cookie缺少login_ticket无法生成URL' );
				return;
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
			if ( game_biz === 'hk4e_cn' ) {
				url = "https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?";
			} else {
				url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog?";
			}
			url = url + obj2ParamsStr( params );
			
			// 校验URL
			const tmp: string = encodeURI( url ).replace( /\+/g, "%2B" );
			let response = await fetch( tmp, { method: "GET" } );
			let data = await response.json();
			if ( data.retcode === 0 ) {
				// 校验成功放入缓存，不需要频繁生成URL
				await redis.setString( `genshin_draw_analysis_url-${ userID }`, tmp, 24 * 60 * 60 );
			}
		} catch ( e ) {
			logger.error( <string>e );
			await sendMessage( <string>e );
			return;
		}
	}
	
	let arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
	let url2 = url.replace( /&(lt|gt|nbsp|amp|quot);/ig, function ( all, t ) {
		return arrEntities[t];
	} );
	// const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '400': '限定池2', '100': '新手池'};
	const cardPool = { '301': '限定池1', '302': '武器池', '200': '常驻池', '100': '新手池' };
	const keys = Object.keys( cardPool );
	let uid = '';
	const urlObj = new URL( url2 );
	for ( let index = 0; index < keys.length; index++ ) {
		let page = 1;
		let size = 20;
		let endCode = '0';
		const element = keys[index];
		const element2 = keys[index];
		let length = size;
		let next = false;
		do {
			const searchParams = urlObj.searchParams;
			searchParams.set( "page", `${ page }` );
			searchParams.set( "size", `${ size }` );
			searchParams.set( "end_id", endCode );
			searchParams.set( "gacha_type", element );
			if ( !searchParams.has( "game_biz" ) ) {
				searchParams.set( "game_biz", "hk4e_cn" );
			}
			url = urlObj.toString().replace( /\+/g, "%2B" )
			let response = await fetch( url, { method: "GET" } );
			let data = await response.json();
			if ( data.retcode !== 0 && data.message && data.message.toLowerCase() == 'visit too frequently' ) {
				await sleep( 5000 );
				response = await fetch( url, { method: "GET" } );
				data = await response.json();
			}
			if ( data.retcode === -101 ) {
				await redis.deleteKey( `genshin_draw_analysis_url-${ userID }` );
				await sendMessage( 'AuthKey 已过期，缓存链接已删除，请重试!' );
				return;
			}
			if ( data.retcode !== 0 ) {
				await sendMessage( data.message ? data.message : "抽卡记录拉取失败，请检查URL！" );
				return;
			}
			length = data.data.list.length;
			for ( let index = 0; index < length; index++ ) {
				const element = data.data.list[index];
				endCode = element.id;
				uid = element.uid;
				let hasKey = await redis.existHashKey( `genshin_draw_analysis_data-${ element2 }-${ element.uid }`, endCode );
				if ( hasKey ) {
					next = true;
					break;
				}
				await redis.setHash( `genshin_draw_analysis_data-${ element2 }-${ element.uid }`, { [endCode]: JSON.stringify( element ) } );
			}
			page++;
			await sleep( 200 );
			if ( next ) {
				break;
			}
		} while ( length === size );
	}
	
	if ( uid !== '' ) {
		await redis.setString( `genshin_draw_analysis_curr_uid-${ userID }`, uid );
	}
	
	await analysisHandler( idMsg, userID, sendMessage );
}
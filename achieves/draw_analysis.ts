import { InputParameter } from "@modules/command";
import fetch from "node-fetch";
import bot from "ROOT";
import { generatorUrl, parseID, sleep } from "../util/util";
import { RenderResult } from "@modules/renderer";
import { pageFunction, renderer } from "../init";
import { Sendable } from "oicq";
import { Private } from "#genshin/module/private/main";
import { getPrivateAccount } from "#genshin/utils/private";
import { GachaUrl } from "#genshin_draw_analysis/util/types";


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
	const { user_id: userID, raw_message } = messageData;
	const reg = new RegExp( /(?<sn>\d+)?(\s)*(?<style>\d+)?/ );
	const res: RegExpExecArray | null = reg.exec( raw_message );
	const style: string = res?.groups?.style || "";
	const sn: string = res?.groups?.sn || "";
	let url = await redis.getString( `genshin_draw_analysis_url-${ userID }.${ sn || "0" }` );
	if ( !url || url.indexOf( "http" ) <= -1 ) {
		let info: Private | string | undefined;
		// 优先从抽卡分析的key中获取Cookie等信息
		let { cookie, uid: game_uid, server, mysID } = await redis.getHash( `genshin_gacha.cookie.${ userID }` );
		if ( !cookie ) {
			// 再从私人服务获取Cookie
			info = await getPrivateAccount( userID, sn, auth );
			if ( typeof info === "string" ) {
				await sendMessage( info );
				return;
			}
			cookie = info.setting.cookie;
			game_uid = info.setting.uid;
			server = info.setting.server;
			mysID = info.setting.mysID;
		}
		let gen_res: GachaUrl | undefined
		try {
			gen_res = await generatorUrl( cookie, game_uid, mysID, server );
		} catch ( e ) {
			logger.error( <string>e );
			await sendMessage( <string>e );
			return;
		}
		if ( gen_res ) {
			const { api_log_url, log_html_url } = gen_res;
			url = api_log_url;
			// 更新ck
			if ( info && info instanceof Private ) {
				await info.replaceCookie( cookie );
			} else {
				await redis.setHashField( `genshin_gacha.cookie.${ userID }`, "cookie", cookie );
			}
			// 校验成功放入缓存，不需要频繁生成URL
			await redis.setString( `genshin_draw_analysis_url-${ userID }.${ sn || "0" }`, url, 24 * 60 * 60 );
			await redis.setString( `genshin_draw_analysis_html_url-${ userID }.${ sn || "0" }`, log_html_url, 24 * 60 * 60 );
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
	
	await analysisHandler( style, userID, sendMessage );
}
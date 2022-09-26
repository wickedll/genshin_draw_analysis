import { InputParameter } from "@modules/command";
import { cookie2Obj } from "#genshin_draw_analysis/util/util";
import { getBaseInfo } from "#genshin/utils/api";
import * as ApiType from "#genshin/types";
import { ErrorMsg } from "#genshin/utils/promise";


export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const { user_id: userID, raw_message: msg } = messageData;
	if ( !msg.includes( "https://" ) ) {
		// 按cookie处理
		try {
			const { login_ticket, login_uid } = cookie2Obj( msg );
			if ( !login_ticket ) {
				await sendMessage( 'Cookie缺少 login_ticket 字段，请到 https://user.mihoyo.com/ 页面登录后获取Cookie' );
				return;
			}
			
			const { retcode, message, data } = await getBaseInfo( login_uid, msg );
			
			if ( !ApiType.isBBS( data ) ) {
				await sendMessage( ErrorMsg.UNKNOWN );
				return;
			} else if ( retcode !== 0 ) {
				await sendMessage( ErrorMsg.FORM_MESSAGE + message );
				return;
			} else if ( !data.list || data.list.length === 0 ) {
				await sendMessage( ErrorMsg.NOT_FOUND );
				return;
			}
			
			const genshinInfo: ApiType.Game | undefined = data.list.find( el => el.gameId === 2 );
			if ( !genshinInfo ) {
				await sendMessage( ErrorMsg.NOT_FOUND );
				return;
			}
			
			const uid: string = genshinInfo.gameRoleId;
			const server: string = genshinInfo.region;
			
			await redis.setHash( `genshin_gacha.cookie.${ userID }`, {
				uid,
				cookie: msg,
				server,
				mysID: login_uid
			} );
			await sendMessage( "米游社通行证Cookie设置成功" );
			return;
		} catch ( error ) {
			logger.error( <string>error );
			await sendMessage( <string>error );
		}
	}
	let api_url = 'https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?';
	try {
		if ( msg.indexOf( "getGachaLog?" ) > -1 ) {
			api_url += msg.split( 'getGachaLog?' )[1].split( '&amp;game_biz=hk4e_cn' )[0];
		} else {
			api_url += msg.split( 'index.html?' )[1].split( '&amp;game_biz=hk4e_cn' )[0];
		}
	} catch ( error ) {
		await sendMessage( "URL输入错误！" );
		return;
	}
	
	await redis.setString( `genshin_draw_analysis_url-${ userID }.0`, api_url, 24 * 60 * 60 );
	await sendMessage( "抽卡记录url设置成功！" );
}
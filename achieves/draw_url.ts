import { InputParameter } from "@modules/command";
import { checkMysCookieInvalid } from "#genshin/utils/cookie";
import { getRegion } from "#genshin/utils/region";


export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const { user_id: userID, raw_message: msg } = messageData;
	if ( !msg.includes( "https://" ) ) {
		// 按cookie处理
		try {
			const { uid, stoken, mysID } = await checkMysCookieInvalid( msg );
			await redis.setHash( `genshin_gacha.cookie.${ userID }`, {
				uid,
				cookie: stoken,
				server: getRegion( uid[0] ),
				mysID
			} );
			
			await sendMessage( "米游社 Cookie 设置成功" );
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
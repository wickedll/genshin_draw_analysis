import { defineDirective } from "@/modules/command";
import { analysisHandler } from "#/genshin_draw_analysis/achieves/draw_analysis";

export default defineDirective( "order", async ( i ) => {
	const { sendMessage, messageData, redis } = i;
	const { user_id: userID, raw_message: idMsg } = messageData;
	let uid = '';
	try {
		uid = await redis.getString( `genshin_draw_analysis_curr_uid-${ userID }` );
	} catch ( error ) {
		await sendMessage( "暂无历史记录" );
		return;
	}
	
	if ( !uid || uid === '' ) {
		await sendMessage( "暂无历史记录" );
		return;
	}
	
	await analysisHandler( idMsg, userID, i );
} )
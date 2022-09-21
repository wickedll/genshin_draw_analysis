import { InputParameter } from "@modules/command";
import { analysisHandler } from "#genshin_draw_analysis/achieves/draw_analysis";

export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
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
	
	await analysisHandler( idMsg, userID, sendMessage );
}
import { defineDirective } from "@/modules/command";

export default defineDirective( "order", async ( { sendMessage, messageData, redis } ) => {
	const { user_id: userID } = messageData;
	let uid: string = "";
	try {
		uid = await redis.getString( `genshin_draw_analysis_curr_uid-${ userID }` );
	} catch ( error ) {
		await sendMessage( "暂无默认账号的历史记录" );
		return;
	}
	
	if ( !uid ) {
		await sendMessage( `暂无默认账号的历史记录` );
		return;
	}
	
	const keys: string[] = [
		`genshin_draw_analysis_curr_uid-${ userID }`,
		`genshin_draw_analysis_data-100-${ uid }`,
		`genshin_draw_analysis_data-200-${ uid }`,
		`genshin_draw_analysis_data-301-${ uid }`,
		`genshin_draw_analysis_data-302-${ uid }`,
		`genshin_draw_analysis_data-400-${ uid }`
	]
	await redis.deleteKey( ...keys );
	
	await sendMessage( `已清除${ uid }的抽卡统计数据。` );
} )
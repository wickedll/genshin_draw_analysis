import { InputParameter } from "@modules/command";
import bot from "ROOT";
import { RenderResult } from "@modules/renderer";
import { renderer } from "../init";


export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const { user_id: userID} = messageData;
	let uid = '';
	try {
		uid = await redis.getString(`genshin_draw_analysis_curr_uid-${userID}`);
	} catch (error) {
		await sendMessage( "暂无历史记录" );
		return;
	}

	if(!uid || uid === ''){
		await sendMessage( "暂无历史记录" );
		return;
	}
	
	const res: RenderResult = await renderer.asCqCode(
		"/analysis.html",
		{ qq: userID }
	);
	if ( res.code === "ok" ) {
		await sendMessage( res.data );
	} else {
		bot.logger.error( res.error );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}
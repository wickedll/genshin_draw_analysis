import { InputParameter } from "@modules/command";



export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const { user_id: userID, raw_message: msg } = messageData;
	let api_url = 'https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?';
	try {
		api_url += msg.split('index.html?')[1].split('&amp;game_biz=hk4e_cn')[0];
	} catch (error) {
		await sendMessage("URL输入错误！");
		return;
	}
	const url = await redis.getString(`genshin_draw_analysis_url-${ userID }`);
	
	if(url && url !== api_url){
		await redis.delHash(`genshin_draw_analysis_data-${ userID }`);
	}

	await redis.setString( `genshin_draw_analysis_url-${ userID }`, api_url );
	await sendMessage("抽卡记录url设置成功！");
}
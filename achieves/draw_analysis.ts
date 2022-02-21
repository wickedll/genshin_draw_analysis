import { InputParameter } from "@modules/command";
import fetch from "node-fetch";
import bot from "ROOT";
import {sleep} from "../util/util";
import { RenderResult } from "@modules/renderer";
import { renderer } from "../init";


export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const { user_id: userID} = messageData;
	const cache = await redis.getHash(`genshin_draw_analysis_data-${ userID }`);
	if(!cache || cache instanceof String || JSON.stringify(cache) == "{}"){
		let url = await redis.getString( `genshin_draw_analysis_url-${ userID }`);
		if(url.indexOf("http") <= -1){
			sendMessage( "请先私聊bot draw_url_set进行抽卡记录url添加！" );
			return;
		}
		var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
		let url2 =  url.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
		// const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '400': '限定池2', '100': '新手池'};
		const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '100': '新手池'};
		const keys = Object.keys(cardPool);
		let dataRes: any[] = [];
		for (let index = 0; index < keys.length; index++) {
			let page = 1;
			let size = 20;
			let endCode = 0;
			const element = keys[index];
			let records : any[] = [];
			let length = size;
			do {
				url = `${url2}&game_biz=hk4e_cn&page=${page}&size=${size}&end_id=${endCode}&gacha_type=${element}`;
				bot.logger.info(url);
				let response = await fetch(url, { method: "GET" });
				let data = await response.json();
				if(data.retcode !== 0){
					await sendMessage(data.message ? data.message : "抽卡记录拉取失败，请检查URL！");
					return;
				}
				length = data.data.list.length;
				for (let index = 0; index < length; index++) {
					const element = data.data.list[index];
					records.push(element);
					endCode = element.id;
				}
				page ++;
				sleep(200);
			} while (length === size);
			dataRes.push({
				key: element,
				name: cardPool[element],
				data: records
			});
		}
		await redis.setHash( `genshin_draw_analysis_data-${ userID }`, {data: JSON.stringify(dataRes)});
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
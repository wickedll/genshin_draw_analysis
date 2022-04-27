import { InputParameter } from "@modules/command";
import fetch from "node-fetch";
import bot from "ROOT";
import {parseID, sleep} from "../util/util";
import { RenderResult } from "@modules/renderer";
import { renderer } from "../init";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";


export async function main(
	{ sendMessage, messageData, redis, auth }: InputParameter
): Promise<void> {
	const { user_id: userID, raw_message: idMsg } = messageData;
	let url = await redis.getString( `genshin_draw_analysis_url-${ userID }`);
	if(url.indexOf("http") <= -1){
		const a: AuthLevel = await auth.get( userID );
		const ANALYSIS_URL = <Order>bot.command.getSingle( "genshin.draw.analysis.url", a );
		sendMessage( `请先私聊bot 使用 ${ ANALYSIS_URL.getHeaders()[0] } 进行抽卡记录url添加！` );
		return;
	}
	var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
	let url2 =  url.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
	// const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '400': '限定池2', '100': '新手池'};
	const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '100': '新手池'};
	const keys = Object.keys(cardPool);
	let uid = '';
	for (let index = 0; index < keys.length; index++) {
		let page = 1;
		let size = 20;
		let endCode = '0';
		const element = keys[index];
		const element2 = keys[index];
		let length = size;
		let next = false;
		do {
			url = `${url2}&game_biz=hk4e_cn&page=${page}&size=${size}&end_id=${endCode}&gacha_type=${element}`;
			let response = await fetch(url, { method: "GET" });
			let data = await response.json();
			if(data.retcode !== 0 && data.message && data.message.toLowerCase() == 'visit too frequently'){
				sleep(5000);
				response = await fetch(url, { method: "GET" });
				data = await response.json();
			}
			if(data.retcode !== 0){
				await sendMessage(data.message ? data.message : "抽卡记录拉取失败，请检查URL！");
				return;
			}
			length = data.data.list.length;
			for (let index = 0; index < length; index++) {
				const element = data.data.list[index];
				endCode = element.id;
				uid = element.uid;
				let hasKey = await redis.existHashKey(`genshin_draw_analysis_data-${element2}-${element.uid}`, endCode);
				if(hasKey){
					next = true;
					break;
				}
				await redis.setHash( `genshin_draw_analysis_data-${element2}-${ element.uid }`, {[endCode]: JSON.stringify(element)});
			}
			page ++;
			sleep(200);
			if(next){
				break;
			}
		} while (length === size);
		if(next){
			continue;
		}
	}
	
	if(uid !== ''){
		await redis.setString(`genshin_draw_analysis_curr_uid-${userID}`, uid);
	}
	
	let id = parseID(idMsg);
	const res: RenderResult = await renderer.asCqCode(
		id ===1 ? "/analysis-phone.html" : "/analysis.html",
		{ qq: userID }
	);
	if ( res.code === "ok" ) {
		await sendMessage( res.data );
	} else {
		bot.logger.error( res.error );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}
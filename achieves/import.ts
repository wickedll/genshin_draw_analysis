import { InputParameter } from "@modules/command";
import fetch from "node-fetch";
import { FileElem, GroupMessageEventData, PrivateMessageEventData, ReplyElem, Ret, TextElem } from "oicq";
import { Gacha_Info, Standard_Gacha } from "#genshin_draw_analysis/util/types";
import { fakeIdFn } from "#genshin_draw_analysis/util/util";

async function import_from_json( file_url, { redis, sendMessage }: InputParameter ): Promise<void> {
	const response: Response = await fetch( file_url );
	const content_type: string = response.headers.get( "Content-Type" ) || "";
	if ( !content_type.includes( "application/json" ) ) {
		await sendMessage( "你上传的不是 JSON 文件，请上传正确的文件。" );
		return;
	}
	const { info, list }: Standard_Gacha = await response.json();
	if ( list ) {
		const func = fakeIdFn();
		for ( let data of list ) {
			const gacha_id: string = data.id || func();
			const gacha_info: Gacha_Info = {
				...data,
				id: gacha_id,
				lang: info.lang,
				uid: info.uid
			}
			delete gacha_info['uigf_gacha_type'];
			await redis.setHash( `genshin_draw_analysis_data-${ data.gacha_type }-${ info.uid }`, { [gacha_id]: JSON.stringify( gacha_info ) } );
		}
		await sendMessage( `${ info.uid } 的 ${ list.length } 条抽卡记录数据已导入。` );
	}
}

async function import_from_excel( file_url: string, { redis, sendMessage }: InputParameter ): Promise<void> {
	const response: Response = await fetch( file_url );
	const content_type: string = response.headers.get( "Content-Type" ) || "";
	if ( !content_type.includes( "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ) ) {
		await sendMessage( "你上传的不是可支持的 Excel 文件，请上传后缀为 xlsx 的 Excel文件。" );
		return;
	}
	const buffer: ArrayBuffer = await response.arrayBuffer();
	const ExcelJS = require( 'exceljs' );
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load( buffer );
	const worksheet = workbook.getWorksheet( "原始数据" );
	if ( !worksheet ) {
		await sendMessage( "没有在Excel中发现[原始数据]表，无法导入你的数据。" );
		return;
	}
	const sheetValues: any[] = worksheet.getSheetValues();
	const headers: string[] = sheetValues[1];
	const func = fakeIdFn();
	let import_uid: string = "";
	sheetValues.filter( ( v, i ) => i > 1 ).forEach( value => {
		const gacha_info: object = {};
		headers.forEach( ( key, idx ) => {
			if ( key === 'id' && !value[idx] ) {
				gacha_info[key] = func();
			} else if ( key !== 'uigf_gacha_type' ) {
				gacha_info[key] = value[idx];
			}
		} )
		// @ts-ignore
		const { gacha_type, uid, id } = gacha_info;
		import_uid = uid;
		redis.setHash( `genshin_draw_analysis_data-${ gacha_type }-${ uid }`, { [id]: JSON.stringify( gacha_info ) } );
	} );
	
	await sendMessage( `${ import_uid } 的 ${ sheetValues.length } 条抽卡记录数据已导入。` );
}

export async function main( bot: InputParameter ): Promise<void> {
	const { sendMessage, messageData, client, logger } = bot;
	const { message, raw_message } = messageData;
	// 从原始信息中获取值，raw_message 已被修改为纯小写，匹配到的链接可能会404
	const textElem: TextElem = <TextElem>message.filter( msg => msg.type === 'text' )[0];
	const origin_message: string = textElem.data.text;
	const reg = new RegExp( /(?<import_type>json|excel)\s*(?<url>https?:\/\/(?:www\.)?[-a-zA-Z\d@:%._+~#=]{1,256}\.[a-zA-Z\d()]{1,6}\b[-a-zA-Z\d()!@:%_+.~#?&/=]*)?/ );
	const exec: RegExpExecArray | null = reg.exec( origin_message );
	const download_url: string = ( exec?.groups?.url || "" ).trim();
	const import_type: string | undefined = exec?.groups?.import_type;
	if ( download_url ) {
		if ( import_type === 'json' ) {
			await import_from_json( download_url, bot );
		} else {
			// excel
			await import_from_excel( download_url, bot );
		}
		return;
	}
	
	const filter = message.filter( msg => msg.type === 'reply' );
	if ( !filter || filter.length === 0 ) {
		await sendMessage( "请回复你上传文件的那条消息的同时使用该指令。" )
		return;
	}
	const { data: { id } }: ReplyElem = <ReplyElem>filter[0]
	const { retcode, error, data }: Ret<PrivateMessageEventData | GroupMessageEventData> = await client.getMsg( id );
	if ( retcode !== 0 ) {
		logger.error( "获取引用消息失败:", error );
		await sendMessage( "获取引用消息失败, " + error?.message );
		return;
	}
	
	if ( data?.message[0].type !== 'file' ) {
		await sendMessage( "请回复你上传的文件的那条消息，否则无法识别你要导入的文件。" );
		return;
	}
	
	const { data: { url } }: FileElem = data.message[0];
	if ( raw_message === 'json' ) {
		await import_from_json( url, bot );
	} else {
		// excel
		await import_from_excel( url, bot );
	}
}
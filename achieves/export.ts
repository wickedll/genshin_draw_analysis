import { defineDirective, InputParameter, Order } from "@/modules/command";
import {
	Gacha_Info,
	GachaUrl,
	Standard_Gacha,
	Standard_Gacha_Data,
	Standard_Gacha_Excel,
	Standard_Gacha_Excel_Origin_Data,
	Standard_Gacha_Info
} from "#/genshin_draw_analysis/util/types";
import moment from "moment";
import fs from "fs";
import { resolve } from "path";
import { isGroupMessage } from "@/modules/message";
import {
	convert2Lang,
	convert2Readable,
	generatorUrl,
	get_sheet_name,
	getColor,
	getTimeOut,
	secondToString,
	upload2Qiniu
} from "#/genshin_draw_analysis/util/util";

import { gacha_config } from "#/genshin_draw_analysis/init";
import bot from "ROOT";
import { Private } from "#/genshin/module/private/main";
import { getPrivateAccount } from "#/genshin/utils/private";
import FileManagement from "@/modules/file";
import { getRandomString } from "@/utils/random";
import { segment } from "@/modules/lib";

const gacha_types = [ "301", "400", "302", "100", "200" ];

async function sendExportResult( url: string, { logger, sendMessage }: InputParameter ) {
	if ( gacha_config.qrcode ) {
		const { toDataURL } = require( "qrcode" );
		const options = {
			errorCorrectionLevel: 'H',
			margin: 1,
			color: {
				dark: '#/000',
				light: '#/FFF',
			}
		}
		toDataURL( url, options, ( err: any, image: string ) => {
			if ( err || !image ) {
				logger.error( "二维码生成失败", err );
				sendMessage( `抽卡记录文件已导出，可在浏览器访问 ${ url } 下载查看。` );
				return;
			}
			image = image.replace( "data:image/png;base64,", "" );
			const qr_code = segment.image( `base64://${ image }` );
			sendMessage( qr_code );
		} )
	} else {
		await sendMessage( `抽卡记录文件已导出，可在浏览器访问 ${ url } 下载查看。` );
	}
}

async function export2JSON( export_data: Standard_Gacha, i: InputParameter ) {
	const { file, sendMessage, messageData, redis, logger, auth } = i;
	if ( export_data.list.length === 0 ) {
		await sendMessage( `当前账号${ export_data.info || "" }无历史抽卡数据.` );
		return;
	}
	export_data.list.sort( ( a, b ) => {
		const a_time = new Date( a.time ).getTime();
		const b_time = new Date( b.time ).getTime();
		if ( a_time > b_time ) {
			return 1;
		} else if ( a_time === b_time ) {
			return a.id!.localeCompare( b.id! );
		} else {
			return -1;
		}
	} )
	const json = JSON.stringify( export_data );
	const file_name = `UIGF-${ export_data.info.uid }-${ moment( export_data.info.export_timestamp * 1000 ).format( "yyMMDDHHmmss" ) }.json`;
	const tmp_path = resolve( file.root, 'tmp' );
	if ( !fs.existsSync( tmp_path ) ) {
		fs.mkdirSync( tmp_path );
	}
	const export_json_path = resolve( tmp_path, file_name );
	const opened: number = fs.openSync( export_json_path, "w" );
	fs.writeSync( opened, json );
	fs.closeSync( opened );
	if ( gacha_config.qiniuOss.enable || gacha_config.qiniuOss.uses3 ) {
		try {
			// 上传到 OSS
			const url: string = await upload2Qiniu( export_json_path, file_name, gacha_config.qiniuOss, redis );
			// 导出后删掉临时文件
			fs.unlinkSync( export_json_path );
			await sendExportResult( url, i );
			return;
		} catch ( error ) {
			logger.error( "抽卡记录导出成功，上传 OSS 失败！", error );
			const CALL = <Order>bot.command.getSingle( "adachi.call", await auth.get( messageData.user_id ) );
			const appendMsg = CALL ? `私聊使用 ${ CALL.getHeaders()[0] } ` : "";
			await sendMessage( `文件导出成功，上传云存储失败，请${ appendMsg }联系 BOT 持有者反馈该问题。` );
			// 删掉避免占用空间，有需求重新生成。
			fs.unlinkSync( export_json_path );
		}
	}
	await uploadFile( export_json_path, file_name, i );
}


async function addRowAndSetStyle( sheet, data: Standard_Gacha_Excel ) {
	const row = sheet.addRow( data );
	row.eachCell( { includeEmpty: true }, cell => {
		cell.alignment = {
			horizontal: 'center',
			vertical: 'middle'
		}
		cell.font = {
			color: { argb: getColor( data.rank_type ) },
			bold: data.rank_type === "5"
		}
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'ffebebeb' }
		}
		cell.border = {
			top: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			left: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			bottom: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			right: { style: 'thin', color: { argb: 'ffc4c2bf' } }
		}
	} );
	row.commit();
}

function setHeaderStyle( headers: string[], sheet ) {
	headers.forEach( ( value, index ) => {
		const cell = sheet.getCell( 1, index + 1 );
		cell.border = {
			top: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			left: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			bottom: { style: 'thin', color: { argb: 'ffc4c2bf' } },
			right: { style: 'thin', color: { argb: 'ffc4c2bf' } }
		}
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'ffdbd7d3' },
		}
		cell.font = {
			color: { argb: "ff757575" },
			bold: true
		}
		cell.alignment = {
			horizontal: 'center',
			vertical: 'middle'
		}
	} );
}

async function uploadFile( file_path: string, file_name: string, {
	client,
	messageData,
	logger,
	sendMessage
}: InputParameter ) {
	if ( isGroupMessage( messageData ) ) {
		try {
			await client.uploadGroupFile( messageData.group_id, {
				file: file_path,
				name: file_name,
				folder: "/genshin/gacha_export"
			} )
			await sendMessage( `抽卡记录文件已导出至${ file_name }` );
		} catch ( e ) {
			logger.warn( `抽卡记录导出文件 ${ file_name } 上传群文件失败`, e );
			await sendMessage( "抽卡记录导出文件上传群文件失败，请重试！" );
		} finally {
			// 导出后删掉临时文件
			fs.unlinkSync( file_path );
		}
	} else {
		try {
			await client.uploadPrivateFile( messageData.user_id, {
				file: file_path,
				name: file_name,
			} );
			await sendMessage( `抽卡记录文件已导出至${ file_name }` );
		} catch ( e ) {
			logger.warn( `抽卡记录导出文件 ${ file_name } 上传文件失败`, e );
			await sendMessage( "抽卡记录导出文件上传文件失败，请重试！" );
		} finally {
			// 导出后删掉临时文件
			fs.unlinkSync( file_path );
		}
	}
}

async function export2Excel( {
	                             info: { uid, lang, export_timestamp },
	                             list
                             }: Standard_Gacha, i: InputParameter ) {
	const { file, messageData, sendMessage, redis, logger, auth } = i;
	if ( list.length === 0 ) {
		await sendMessage( `当前账号${ uid || "" }无历史抽卡数据.` );
		return;
	}
	// 按照 ID 升序排列
	list = list.sort( ( a, b ) => {
		const a_time = new Date( a.time ).getTime();
		const b_time = new Date( b.time ).getTime();
		if ( a_time > b_time ) {
			return 1;
		} else if ( a_time === b_time ) {
			return a.id!.localeCompare( b.id! );
		} else {
			return -1;
		}
	} )
	const gacha_csv_objects: Standard_Gacha_Excel[] = list.map( ( {
		                                                              time,
		                                                              name,
		                                                              gacha_type,
		                                                              rank_type,
		                                                              item_type
	                                                              } ) => ( {
		time,
		name,
		item_type,
		rank_type,
		gacha_type
	} ) );
	const ExcelJS = require( 'exceljs' );
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'adachi-bot';
	workbook.lastModifiedBy = 'adachi-bot';
	workbook.created = new Date();
	workbook.modified = new Date();
	
	
	const sheet_names: string[] = gacha_types.filter( value => value !== '400' );
	for ( let type of sheet_names ) {
		const sheet = workbook.addWorksheet( get_sheet_name( type ), {
			views: [ {
				state: 'frozen',
				ySplit: 1,
				zoomScale: 260
			} ]
		} );
		let width = [ 24, 14, 8, 8, 20 ]
		if ( !lang.includes( 'zh-' ) ) {
			width = [ 24, 32, 16, 12, 24 ]
		}
		const headers = Object.keys( gacha_csv_objects[0] );
		sheet.columns = headers.map( ( key, index ) => {
			return {
				header: convert2Lang( key, lang ),
				key,
				width: width[index]
			}
		} );
		setHeaderStyle( headers, sheet );
		const filter_gacha_data: Standard_Gacha_Excel[] = gacha_csv_objects.filter( ( { gacha_type } ) => {
			return type === '301' && gacha_type === '400' ? true : gacha_type === type;
		} );
		
		for ( let data of filter_gacha_data ) {
			data.gacha_type = convert2Readable( data.gacha_type, lang );
			await addRowAndSetStyle( sheet, data );
		}
		// 设置保护模式，避免用户随意修改内容
		await sheet.protect( getRandomString( 20 ), {
			formatCells: true,
			formatRows: true,
			formatColumns: true,
			sort: true,
			autoFilter: true,
			pivotTables: true
		} );
	}
	
	// 添加一个原始数据的表
	const sheet = workbook.addWorksheet( "原始数据", {
		views: [ {
			state: 'frozen',
			ySplit: 1,
			zoomScale: 260
		} ]
	} );
	let width = [ 24, 18, 8, 12, 12, 12, 8, 24, 20, 12, 18 ]
	if ( !lang.includes( 'zh-' ) ) {
		width = [ 24, 24, 8, 12, 12, 12, 8, 24, 20, 12, 18 ]
	}
	const origin_data_list: Standard_Gacha_Excel_Origin_Data[] = list.map( ( data: Standard_Gacha_Data ) => {
		return {
			...data,
			lang,
			uid
		}
	} );
	const headers = Object.keys( origin_data_list[0] );
	sheet.columns = headers.map( ( key, index ) => {
		return {
			header: key,
			key,
			width: width[index]
		}
	} );
	setHeaderStyle( headers, sheet );
	for ( const data of origin_data_list ) {
		await addRowAndSetStyle( sheet, data );
	}
	// 设置保护模式，避免用户随意修改内容
	await sheet.protect( getRandomString( 20 ), {
		formatCells: true,
		formatRows: true,
		formatColumns: true,
		sort: true,
		autoFilter: true,
		pivotTables: true
	} );
	
	const file_name = `UIGF-${ uid }-${ moment( export_timestamp * 1000 ).format( "yyMMDDHHmmss" ) }.xlsx`;
	const tmp_path = resolve( file.root, 'tmp' );
	if ( !fs.existsSync( tmp_path ) ) {
		fs.mkdirSync( tmp_path );
	}
	const export_excel_path = resolve( tmp_path, file_name );
	await workbook.xlsx.writeFile( export_excel_path );
	
	if ( gacha_config.qiniuOss.enable || gacha_config.qiniuOss.uses3 ) {
		// 上传到 OSS
		try {
			const url: string = await upload2Qiniu( export_excel_path, file_name, gacha_config.qiniuOss, redis );
			// 导出后删掉临时文件
			fs.unlinkSync( export_excel_path );
			await sendExportResult( url, i );
			return;
		} catch ( error ) {
			logger.error( "抽卡记录导出成功，上传 OSS 失败！", error );
			const CALL = <Order>bot.command.getSingle( "adachi.call", await auth.get( messageData.user_id ) );
			const appendMsg = CALL ? `私聊使用 ${ CALL.getHeaders()[0] } ` : "";
			await sendMessage( `文件导出成功，上传云存储失败，请${ appendMsg }联系 BOT 持有者反馈该问题。` );
			// 删掉避免占用空间，有需求重新生成。
			fs.unlinkSync( export_excel_path );
			return;
		}
	}
	await uploadFile( export_excel_path, file_name, i );
}

async function export_gacha_url( user_id: number, sn: string, { redis, sendMessage, auth, logger }: InputParameter ) {
	const key: string = `genshin_draw_analysis_html_url-${ user_id }.${ sn || "0" }`;
	let url: string = await redis.getString( key );
	if ( url ) {
		await sendMessage( url );
		const timeout: number = await getTimeOut( key );
		const human_time: string = secondToString( timeout );
		await sendMessage( `链接将在${ human_time }后过期。` );
		return;
	}
	
	let info: Private | string | undefined;
	// 从私人服务获取Cookie
	info = await getPrivateAccount( user_id, sn, auth );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	let gen_res: GachaUrl | undefined
	try {
		gen_res = await generatorUrl( info.setting.stoken, info.setting.uid, info.setting.mysID, info.setting.server );
	} catch ( e ) {
		logger.error( <string>e );
		await sendMessage( <string>e );
		return;
	}
	if ( gen_res ) {
		const { api_log_url, log_html_url, cookie } = gen_res;
		url = api_log_url;
		// 更新ck
		if ( cookie ) {
			await info.replaceCookie( cookie );
		}
		// 校验成功放入缓存，不需要频繁生成URL
		await redis.setString( `genshin_draw_analysis_url-${ user_id }.${ sn || "0" }`, url, 24 * 60 * 60 );
		await redis.setString( key, log_html_url, 24 * 60 * 60 );
		await sendMessage( log_html_url );
		await sendMessage( "链接将在24小时后过期。" );
		return;
	}
}

function getVersion( file: FileManagement ): string {
	const path: string = file.getFilePath( "package.json", "root" );
	const { version } = require( path );
	return version.split( "-" )[0];
}

export default defineDirective( "order", async ( bot: InputParameter ) => {
	const { sendMessage, messageData, redis, auth } = bot;
	const { sender: { user_id }, raw_message } = messageData;
	const reg = new RegExp( /(?<type>json|excel|url)(\s)*(?<sn>\d+)?/ );
	const res: RegExpExecArray | null = reg.exec( raw_message );
	const type: string = res?.groups?.type || "";
	const sn: string = res?.groups?.sn || "";
	if ( type === 'url' ) {
		await export_gacha_url( user_id, sn, bot );
		return;
	}
	
	const gacha_data_list: Standard_Gacha_Data[] = [];
	// 获取存储的抽卡记录数据
	let uid: string = "";
	if ( sn ) {
		const info = await getPrivateAccount( user_id, sn, auth );
		if ( typeof info === "string" ) {
			await sendMessage( info );
			return;
		}
		uid = info.setting.uid;
	} else {
		uid = await redis.getString( `genshin_draw_analysis_curr_uid-${ user_id }` );
	}
	let lang: string = "zh-cn";
	for ( let gacha_type of gacha_types ) {
		const gacha_data_map: Record<string, string> = await redis.getHash( `genshin_draw_analysis_data-${ gacha_type }-${ uid }` );
		const gacha_data_strings: string[] = Object.values( gacha_data_map );
		for ( let gacha_data_str of gacha_data_strings ) {
			const gacha_data: Gacha_Info = JSON.parse( gacha_data_str );
			lang = gacha_data.lang;
			const export_gacha_data: Standard_Gacha_Data = {
				id: gacha_data.id,
				name: gacha_data.name,
				item_id: gacha_data.item_id,
				item_type: gacha_data.item_type,
				rank_type: gacha_data.rank_type,
				gacha_type: gacha_data.gacha_type,
				count: gacha_data.count,
				time: gacha_data.time,
				uigf_gacha_type: gacha_data.gacha_type === "400" ? "301" : gacha_data.gacha_type
			};
			gacha_data_list.push( export_gacha_data );
		}
	}
	
	const info: Standard_Gacha_Info = {
		uid,
		lang,
		export_app: 'Adachi-BOT',
		export_app_version: `v${ getVersion( bot.file ) }`,
		export_time: moment().format( "yy-MM-DD HH:mm:ss" ),
		export_timestamp: Date.now() / 1000 | 0,
		uigf_version: 'v2.2'
	}
	const export_data: Standard_Gacha = {
		info,
		list: gacha_data_list
	}
	
	if ( raw_message === 'json' ) {
		await export2JSON( export_data, bot );
	} else if ( raw_message === 'excel' ) {
		await export2Excel( export_data, bot );
	} else {
		await sendMessage( `不支持的导出类型: ${ raw_message }` );
	}
} )
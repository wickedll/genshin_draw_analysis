import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope } from "@modules/message";
import { createServer } from "./server";
import { PageFunction, Renderer } from "@modules/renderer";
import { checkDependencies, execHandle, sleep } from "./util/util";
import puppeteer from "puppeteer";
import { findFreePort } from "@modules/utils";
import GachaAnalysisConfig from "#genshin_draw_analysis/module/GachaAnalysisConfig";
import { BOT } from "@modules/bot";

export let renderer: Renderer;
export let gacha_config: GachaAnalysisConfig;

export let pageFunction: PageFunction = async ( page: puppeteer.Page ) => {
	if ( page.url().indexOf( "analysis.html" ) > -1 ) {
		await sleep( 2000 );
	}
	const option: puppeteer.ScreenshotOptions = { encoding: "base64" };
	const element = await page.$( '#app' );
	const result = <string>await element?.screenshot( option );
	const base64: string = `base64://${ result }`;
	const cqCode: string = `[CQ:image,file=${ base64 }]`;
	return cqCode;
}


const draw_url: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.url",
	desc: [ "原神抽卡记录URL设置", "(记录URL|通行证Cookie)" ],
	headers: [ "su" ],
	regexps: [ ".+" ],
	main: "achieves/draw_url",
	detail: "设置抽卡记录url或者米游社通行证的Cookie",
	scope: MessageScope.Private,
	ignoreCase: false
}

const draw_analysis: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis",
	desc: [ "抽卡分析", "(私人服务序号) (样式)" ],
	headers: [ "da" ],
	detail: "使用设置的抽卡记录URL重新拉取数据并合并历史数据分析, 1: pc样式,2: phone样式，如果只传一个参数优先匹配服务序号。\n" +
		"如果设置了抽卡分析的Cookie将优先使用抽卡分析的Cookie，否则将使用私人服务中的Cookie",
	regexps: [ "(\\d+)?", "(\\d+)?" ],
	main: "achieves/draw_analysis"
};

const draw_analysis_history: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.history",
	desc: [ "抽卡分析历史记录", "(样式)" ],
	headers: [ "dah" ],
	regexps: [ "(\\d+)?" ],
	detail: "使用历史数据分析, 1: pc样式,2: phone样式",
	main: "achieves/draw_analysis_history"
};

const export_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.export_gacha_log",
	desc: [ "导出抽卡记录", "[json|excel|url (序号)]" ],
	headers: [ "export" ],
	regexps: [ "(json|excel|(url\\s*(\\d+)?))" ],
	detail: "导出抽卡记录，目前支持json、excel、url，导出链接时可以使用私人服务序号以使用私人服务CK生成链接。",
	main: "achieves/export"
};

const import_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.import_gacha_log",
	desc: [ "导入抽卡记录", "[json|excel] (文件下载链接)" ],
	headers: [ "import" ],
	regexps: [ "(json|excel)", "(https?:\\/\\/(?:www\\.)?[-a-zA-Z\\d@:%._+~#=]{1,256}\\.[a-zA-Z\\d()]{1,6}\\b[-a-zA-Z\\d()!@:%_+.~#?&/=]*)?" ],
	detail: "导入抽卡记录，目前支持json、excel。先发送文件，然后回复这个文件消息，在此消息中使用该指令，也可以给一个文件的下载链接。",
	main: "achieves/import"
};

const del_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.del_gacha_log",
	desc: [ "清除抽卡记录", "" ],
	headers: [ "del" ],
	regexps: [ "" ],
	detail: "删除上次抽卡统计使用的uid，如果要清除其他账号请重新设置链接或者Cookie再使用一次抽卡统计指令即可切换默认账号。(此举是为了验证你是此uid的拥有者，避免误删他人的数据。)",
	main: "achieves/del"
};

export async function init( { logger, file, renderer: botRender, refresh }: BOT ): Promise<PluginSetting> {
	gacha_config = GachaAnalysisConfig.create( file );
	refresh.registerRefreshableFile( GachaAnalysisConfig.FILE_NAME, gacha_config );
	
	logger.info( "开始检测插件需要的依赖是否已安装..." );
	const dependencies: string[] = [ "exceljs" ];
	if ( gacha_config.qiniuOss.enable ) {
		dependencies.push( "qiniu" );
	} else if ( gacha_config.qiniuOss.uses3 ) {
		dependencies.push( "@aws-sdk/client-s3" );
	}
	if ( gacha_config.qrcode ) {
		dependencies.push( "qrcode" );
	}
	const uninstall_dependencies: string[] = checkDependencies( file, ...dependencies );
	for ( let uni_dep of uninstall_dependencies ) {
		logger.info( `检测到 ${ uni_dep } 依赖尚未安装，将自动安装该依赖...` )
		const stdout = await execHandle( `npm i ${ uni_dep }` );
		logger.info( stdout );
	}
	logger.info( "所有插件需要的依赖已安装" );
	
	/* 实例化渲染器 */
	const port: number = await findFreePort( 58693, logger );
	renderer = botRender.register(
		"genshin_draw_analysis", "/views",
		port, "#app"
	);
	createServer( port, logger );
	return {
		pluginName: "genshin_draw_analysis",
		cfgList: [ draw_url, draw_analysis, draw_analysis_history, export_gacha_log, import_gacha_log, del_gacha_log ],
		repo: {
			owner: "BennettChina",
			repoName: "genshin_draw_analysis",
			ref: "v2"
		},
		aliases: gacha_config.aliases
	};
}
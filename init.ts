import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { createServer } from "./server";
import { Renderer } from "@modules/renderer";
import { checkDependencies, execHandle } from "./util/util";
import { findFreePort } from "@modules/utils";
import GachaAnalysisConfig from "#genshin_draw_analysis/module/GachaAnalysisConfig";
import { BOT } from "@modules/bot";

export let renderer: Renderer;
export let gacha_config: GachaAnalysisConfig;

const draw_analysis: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis",
	desc: [ "抽卡分析", "([抽卡链接] | (私人服务序号) (样式))" ],
	headers: [ "da" ],
	detail: "1) 使用链接直接分析抽卡数据，此时可以将链接作为参数直接传入\n" +
		"2) 使用私人服务的Cookie分析抽卡数据,此时可以传入两个可选参数: 序号、样式。\n" +
		"3) 1: 饼图样式,2: 角色图标样式，默认使用角色图标样式，需要更改样式时必须传序号。",
	regexps: [ ".*" ],
	ignoreCase: false,
	main: "achieves/draw_analysis"
};

const draw_analysis_history: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis.history",
	desc: [ "抽卡分析历史记录", "(样式)" ],
	headers: [ "dah" ],
	regexps: [ "(\\d+)?" ],
	detail: "使用历史数据分析, 1: 饼图样式,2: 角色图标样式",
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
	ignoreCase: false,
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
		cfgList: [ draw_analysis, draw_analysis_history, export_gacha_log, import_gacha_log, del_gacha_log ],
		repo: {
			owner: "wickedll",
			repoName: "genshin_draw_analysis",
			ref: "master"
		},
		aliases: gacha_config.aliases
	};
}
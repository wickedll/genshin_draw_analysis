import { RefreshCatch } from "@modules/management/refresh";
import FileManagement from "@modules/file";
import { QiniuOssConfig } from "#genshin_draw_analysis/util/types";
import { checkDependencies, execHandle } from "#genshin_draw_analysis/util/util";
import bot from "ROOT";

export default class GachaAnalysisConfig {
	public static readonly FILE_NAME: string = "gacha_analysis";
	private static init = {
		tips: "accessKey和secretKey是七牛云的两个密钥AK、SK\n" +
			"bucket是你创建的空间名\n" +
			"domain是你文件访问的域名（带协议头，如：https://sources.demo.com/）\n" +
			"folder是文件上传后的目录，比如:bot/gacha_export",
		qiniuOss: {
			enable: false,
			accessKey: '',
			secretKey: '',
			bucket: '',
			domain: '',
			folder: ""
		}
	};
	public qiniuOss: QiniuOssConfig;
	
	constructor( config: any ) {
		this.qiniuOss = {
			enable: config.qiniuOss.enable,
			accessKey: config.qiniuOss.accessKey,
			secretKey: config.qiniuOss.secretKey,
			bucket: config.qiniuOss.bucket,
			domain: config.qiniuOss.domain,
			folder: config.qiniuOss.folder
		}
	}
	
	public static create( file: FileManagement ): GachaAnalysisConfig {
		const initCfg = this.init;
		
		const path: string = file.getFilePath( `${ this.FILE_NAME }.yml` );
		const isExist: boolean = file.isExist( path );
		if ( !isExist ) {
			file.createYAML( this.FILE_NAME, initCfg );
			return new GachaAnalysisConfig( initCfg );
		}
		
		const config: any = file.loadYAML( this.FILE_NAME );
		const keysNum = o => Object.keys( o ).length;
		
		/* 检查 defaultConfig 是否更新 */
		if ( keysNum( config ) !== keysNum( initCfg ) ) {
			const c: any = {};
			const keys: string[] = Object.keys( initCfg );
			for ( let k of keys ) {
				c[k] = config[k] ? config[k] : initCfg[k];
			}
			file.writeYAML( this.FILE_NAME, c );
			return new GachaAnalysisConfig( c );
		}
		return new GachaAnalysisConfig( config );
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.qiniuOss = {
				enable: config.qiniuOss.enable,
				accessKey: config.qiniuOss.accessKey,
				secretKey: config.qiniuOss.secretKey,
				bucket: config.qiniuOss.bucket,
				domain: config.qiniuOss.domain,
				folder: config.qiniuOss.folder
			}
			bot.logger.info( "开始检测插件需要的依赖是否已安装..." );
			const dependencies: string[] = [];
			if ( this.qiniuOss.enable ) {
				dependencies.push( "qiniu" );
			}
			const uninstall_dependencies: string[] = checkDependencies( bot.file, ...dependencies );
			for ( let uni_dep of uninstall_dependencies ) {
				bot.logger.info( `检测到 ${ uni_dep } 依赖尚未安装，将自动安装该依赖...` )
				const stdout = await execHandle( `npm i ${ uni_dep }` );
				bot.logger.info( stdout );
			}
			bot.logger.info( "所有插件需要的依赖已安装" );
			return "抽卡分析插件配置重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "抽卡分析插件配置重新加载失败，请前往控制台查看日志"
			};
		}
	}
}
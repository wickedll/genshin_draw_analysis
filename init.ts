import { Renderer } from "@/modules/renderer";
import GachaAnalysisConfig from "#/genshin_draw_analysis/module/GachaAnalysisConfig";
import { definePlugin } from "@/modules/plugin";
import cfgList from "./commands";
import routers from "./routes";
import { ExportConfig } from "@/modules/config";

export let renderer: Renderer;
export let gacha_config: ExportConfig<GachaAnalysisConfig>;


export default definePlugin( {
	name: "原神抽卡分析",
	cfgList,
	server: {
		routers
	},
	publicDirs: [ "assets", "views", "components" ],
	repo: {
		owner: "wickedll",
		repoName: "genshin_draw_analysis",
		ref: "master"
	},
	async mounted( params ) {
		gacha_config = params.configRegister( GachaAnalysisConfig.FILE_NAME, GachaAnalysisConfig.init );
		params.setAlias( gacha_config.aliases );
		gacha_config.on( 'refresh', newCfg => {
			params.setAlias( newCfg.aliases );
		} )
		params.renderRegister( "#app", "views" );
	}
} )
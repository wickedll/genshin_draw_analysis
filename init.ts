import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { MessageScope } from "@modules/message";
import bot from "ROOT";
import { createServer } from "./server";
import { PageFunction, Renderer } from "@modules/renderer";
import { sleep } from "./util/util";
import puppeteer from "puppeteer";
import { findFreePort } from "@modules/utils";

export let renderer: Renderer;

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
	desc: [ "原神抽卡记录URL设置", "(记录URL)" ],
	headers: [ "su" ],
	regexps: [ ".+" ],
	main: "achieves/draw_url",
	detail: "设置抽卡记录url",
	scope: MessageScope.Private,
	ignoreCase: false
}

const draw_analysis: OrderConfig = {
	type: "order",
	cmdKey: "genshin.draw.analysis",
	desc: [ "抽卡分析", "(私人服务序号) (样式)" ],
	headers: [ "da" ],
	detail: "使用设置的抽卡记录URL重新拉取数据并合并历史数据分析, 1: pc样式,2: phone样式，如果只传一个参数优先匹配服务序号。",
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

export async function init(): Promise<PluginSetting> {
	/* 实例化渲染器 */
	const port: number = await findFreePort( 58693, bot.logger );
	renderer = bot.renderer.register(
		"genshin_draw_analysis", "/views",
		port, "#app"
	);
	createServer( port, bot.logger );
	return {
		pluginName: "genshin_draw_analysis",
		cfgList: [ draw_url, draw_analysis, draw_analysis_history ],
		repo: {
			owner: "wickedll",
			repoName: "genshin_draw_analysis"
		}
	};
}
import { Logger } from "log4js";
import express from "express";
import AnalysisRouter from "./routes/analysis-route"

export function createServer( port: number, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	
	app.use( "/api/analysis", AnalysisRouter );
	
	app.listen( port, () => {
		logger.info( "抽卡记录服务已启动" );
	} );
}
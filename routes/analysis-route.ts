import express from "express";
import bot  from "ROOT";

const router = express.Router();

router.get( "/result", async ( req, res ) => {
	const userID: number = parseInt( <string>req.query.qq );
	const data = await bot.redis.getHash( `genshin_draw_analysis_data-${ userID }` );
	res.send( data );
} );

export default router;
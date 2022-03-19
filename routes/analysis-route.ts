import express from "express";
import bot  from "ROOT";

const router = express.Router();

router.get( "/result", async ( req, res ) => {
	const userID: number = parseInt( <string>req.query.qq );
	const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '100': '新手池'};
	const uid = await bot.redis.getString(`genshin_draw_analysis_curr_uid-${userID}`);
	let dataRes: any[] = [];
	const keys = Object.keys(cardPool);
	for (let index = 0; index < keys.length; index++) {
		const el = keys[index];
		try {
			const data = await bot.redis.getHash( `genshin_draw_analysis_data-${el}-${ uid }` );
			const dataKeys = Object.keys(data);
			let records : any[] = [];
			for (let index = 0; index < dataKeys.length; index++) {
				const element = dataKeys[index];
				records.push(JSON.parse(data[element]));
			}
			dataRes.push({
				key: el,
				name: cardPool[el],
				data: records
			});
		} catch (error) {
			console.log(el + error);
		}
	}
	res.send( {data: JSON.stringify(dataRes)} );
} );

export default router;
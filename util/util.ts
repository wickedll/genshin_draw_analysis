import { randomString } from "#genshin/utils/random";
import { Md5 } from "md5-typescript";

function getRandomNum( Min, Max ) {
	let Range = Max - Min;
	let Rand = Math.random();
	return Min + Math.round( Rand * Range );
}

async function sleep( ms: number ): Promise<void> {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

function parseID( msg: string ): number {
	if ( !msg ) {
		return 1;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id;
	}
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] );
	} else {
		return 1;
	}
}

function generateDS(): string {
	const n: string = "dWCcD2FsOUXEstC5f9xubswZxEeoBOTc";
	const i: number = Date.now() / 1000 | 0;
	const r: string = randomString( 6 ).toLowerCase();
	const c: string = Md5.init( `salt=${ n }&t=${ i }&r=${ r }` );
	
	return `${ i },${ r },${ c }`;
}

export function getGameBiz( first: string ): string {
	switch ( first ) {
		case "1":
			return "hk4e_cn";
		case "2":
			return "hk4e_cn";
		case "5":
			return "hk4e_cn";
		default:
			return "hk4e_global";
	}
}

function obj2ParamsStr( obj: object ): string {
	const params: string[] = [];
	for ( let key in obj ) {
		params.push( `${ key }=${ obj[key] }` );
	}
	return params.join( '&' );
}

function cookie2Obj( cookie: string ): any {
	return decodeURIComponent( cookie ).split( ";" )
		.map( item => item.split( '=' ) )
		.reduce( ( acc, [ k, v ] ) => ( acc[k.trim().replace( '"', '' )] = v ) && acc, {} );
}

export { sleep, getRandomNum, parseID, generateDS, obj2ParamsStr, cookie2Obj };
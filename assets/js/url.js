/**
 * @desc 解析 url 参数为一个对象
 * @param {string} url 目标 url
 * @return {Object} 参数对象
 */
export function urlParamsGet( url ) {
	try {
		const searchParams = [ ...new URL( url ).searchParams ].map( ( [ key, value ] ) => {
			return [ key, decodeURIComponent( value ) ];
		} )
		return Object.fromEntries( searchParams );
	} catch {
		return {};
	}
}

/**
 * @desc 将 url 与参数对象解析为合法 url 字符串
 * @param {string | undefined} url 目标 url
 * @param {Object} params 参数对象
 * @return {string} 字符串
 */
export function urlParamsParse( url, params ) {
	const paramsInfo = Object.entries( params ).map( ( [ key, value ] ) => {
		return `${ key }=${ encodeURIComponent( value ) }`;
	} );
	
	let originUrl = "";
	if ( url ) {
		const [ origin, paramsStr ] = url.split( "?" );
		originUrl = origin;
		if ( paramsStr ) {
			paramsInfo.unshift( ...paramsStr.split( "&" ).filter( el => !!el ) );
		}
	}
	let paramsStr = paramsInfo.join( "&" );
	const joinChar = originUrl && paramsStr ? "?" : "";
	
	return originUrl ? originUrl + joinChar + paramsStr : paramsStr;
}
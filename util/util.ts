function sleep(numberMillis) { 
    var now = new Date(); 
    var exitTime = now.getTime() + numberMillis; 
    while (true) { 
    now = new Date(); 
    if (now.getTime() > exitTime) 
        return; 
    } 
}

function getRandomNum(Min, Max) {
	var Range = Max - Min;
	var Rand = Math.random();
	return Min + Math.round(Rand * Range);
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


export { sleep, getRandomNum, parseID };
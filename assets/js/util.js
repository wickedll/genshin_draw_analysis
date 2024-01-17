export function getRandomNum( min, max ) {
	const range = max - min;
	const rand = Math.random();
	return min + Math.round( rand * range );
}

export function sortData( a, b ) {
	const a_time = new Date( a.time ).getTime();
	const b_time = new Date( b.time ).getTime();
	if ( a_time > b_time ) {
		return 1;
	} else if ( a_time === b_time ) {
		return a.id.localeCompare( b.id );
	} else {
		return -1;
	}
}
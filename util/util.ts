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

export { sleep, getRandomNum };
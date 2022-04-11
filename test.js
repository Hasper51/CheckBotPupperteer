var max = 1;

var p = Promise.reject();
for(var i=0; i<max; i++) {
	p = p.catch(attempt).then(test);
}
p = p.then(processResult).catch(errorHandler);

function attempt() {
	var rand = Math.random();
	if(rand < 0.8) {
		throw rand;
	} else {
		return rand;
	}
}
function test(val) {
	if(val < 0.9) {
		throw val;
	} else {
		return val;
	}
}
function processResult(res) {
	console.log(res);
}
function errorHandler(err) {
	console.error(err);
}

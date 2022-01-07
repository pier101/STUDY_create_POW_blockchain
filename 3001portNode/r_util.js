
// [ 도구적인 기능을 하는 함수를 포함 ]
// ===========================================================================

const fs = require('fs')

// 호출용 함수 ) 버전 불러오기
function getCurrentVersion(){
    const package = fs.readFileSync("package.json");
	//console.log(JSON.parse(package).version);
	return JSON.parse(package).version;
}

// 호출용 함수 ) 현재시간 불러오기
function getCurrentTimestamp(){
    return Math.round(new Date().getTime() / 1000)
    // Math.round() :소수점이하 값 반올림하는 함수
}

// 유틸 함수) 16진수 -> 2진수 변경
function hexToBinary(s){
	const lookupTable = {
		'0': '0000', '1' : '0001', '2': '0010','3': '0011',
		'4': '0100', '5' : '0101', '6': '0110','7': '0111',
		'8': '1000', '9' : '1001', 'a': '1010','b': '1011',
		'c': '1100', 'd' : '1101', 'e': '1110','f': '1111',
	}
	var ret = "";
	for (var i = 0; i < s.length; i++) {
		if (lookupTable[s[i]]) {
			ret += lookupTable[s[i]];
		}
		else {return  null;}
	}
	return ret;
}

module.exports = {
    getCurrentVersion,
    getCurrentTimestamp,
    hexToBinary
}
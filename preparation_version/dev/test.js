// blockchain.js 모듈을 이곳에 가져옴
const blockchain = require('./blockchain')

// 가져온 모듈로 객체 생성
const bitcoin = new blockchain();

bitcoin.createNewBlock(111,"aaa","bbb")

console.log(bitcoin)
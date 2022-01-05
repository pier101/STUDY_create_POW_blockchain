
// 블록의 생성, 검증, 합의 알고리즘을 포함 / 프로토콜을 변경하려면 여기서 수정

const fs = require('fs')
const cryptojs = require('crypto-js')
const merkle = require('merkle')
const random = require('random');

const BLOCK_GENERATION_INTERVAL = 10 //블록이 생성되는 간격 10초
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10 //  난이도가 조정되는 간격 10개마다

// 블록 구조 설정
class Block{
	constructor(header, body){
		this.header = header
		this.body = body
	}
}

// 블록 헤더 구조 설정
class BlockHeader{
	constructor(version,index, previousHash, timestamp, merkleRoot,difficulty,nonce){
		this.version = version
		this.index = index
		this.previousHash = previousHash
		this.timestamp = timestamp
		this.merkleRoot = merkleRoot
		this.difficulty = difficulty
		this.nonce = nonce
	}
}

// 호출용 함수 ) 버전 불러오기
function getVersion(){
	const package = fs.readFileSync("package.json");
	//console.log(JSON.parse(package).version);
	return JSON.parse(package).version;
}
//console.log("버전 : ",getVersion())

// 블럭 생성 함수) 제네시스 블럭 생성
function createGenesisBlock(){  //초기 블록 생성하는 함수
	const version = getVersion()
	const index = 0
	const previousHash = '0'.repeat(64) //#최초는 이전해쉬 없기 때문에 0으로 64자리 채워넣음
	const timestamp = 1231006505
	const body = ['The Times 03/Jan/2009 Chancellor on brink of second bailout for bank']
	const tree = merkle('sha256').sync(body)
	const merkleRoot = tree.root() || '0'.repeat(64)
	const difficulty = 0
	const nonce = 0
	
	
	//console.log("version : %s, timestamp : %d, body : %s", version,timestamp,body);
	//console.log("previousHash : %d", previousHash);
	//console.log("tree : %d",tree)
	//console.log("merkleRoot : $d", merkleRoot);
	
	const header = new BlockHeader(version,index, previousHash, timestamp, merkleRoot,difficulty,nonce)
	return new Block(header, body)
}
// const block = createGenesisBlock()


//블록체인 배열 선언 및 초기 제네시스블록 삽입.
let Blocks = [createGenesisBlock()]
//console.log("Genesis Block : ",Block)

// 호출용 함수) 블록체인 안의 모든 블록 불러오기
function getBlocks(){ 
	return Blocks
}
//console.log(getBlocks())

// 호출용 함수) 마지막 블록 불러오기
function getLastBlock(){
	return Blocks[Blocks.length - 1]
}

// 해시화 함수) 이전 블록 해시화 할 용도
function createHash(data){
	const {version, previousHash,index, timestamp, merkleRoot,difficulty,nonce} = data.header
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}

// 해시화 함수)  블록 생성시 헤더값 해시화할 용도 
function calculateHash(version, previousHash,index, timestamp, merkleRoot,difficulty,nonce){
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}
//const block = createGenesisBlock()
//const testHash = createHash(block)
//console.log(Blocks)
//console.log(testHash)

// 블럭 생성 함수) 새로운 블럭 생성
function nextBlock(bodyData){
	const prevBlock = getLastBlock()
	const version = getVersion()
	const index = prevBlock.header.index + 1
	const previousHash = createHash(prevBlock)
	const timestamp = parseInt(Date.now() / 1000)
	const tree = merkle('sha256').sync(bodyData)
	const merkleRoot = tree.root() || '0'.repeat(64)
	const difficulty = 0
	let  nonce = 0
	
	const header = findBlock(version, index, previousHash, timestamp, merkleRoot, difficulty,nonce) 
	return new Block(header, bodyData)


}

//=====================유효성 검증 코드들========================
// 검증 함수) 블록 구조 검증
function isValidBlockStructure(block){
    return typeof(block.header.version) === 'string'
        && typeof(block.header.index) === 'number'
        && typeof(block.header.previousHash) === 'string'
        && typeof(block.header.timestamp) === 'number'
        && typeof(block.header.merkleRoot) === 'string'
        && typeof(block.header.difficulty) === 'number'
        && typeof(block.header.nonce) === 'number'
        && typeof(block.body) === 'object'
}

// 검증 함수) 새로 생성한 블록 검증
function isValidNewBlock(newBlock, previousBlock){
	console.log("프리비어스 블록",previousBlock);
    if (isValidBlockStructure(newBlock) == false) {
        console.log('invalid Block Structure');
        return false;
    }
    else if (newBlock.header.index !== previousBlock.header.index + 1) {
        console.log('invalid index');
        return false;
    }
    else if (createHash(previousBlock) !== newBlock.header.previousHash){
        console.log('invalid previousHash');
        return false;
    }
    else if ((newBlock.body.length === 0 && ('0'.repeat(64) !== newBlock.header.merkleRoot) )
            ||( newBlock.body.length !== 0 && (merkle("sha256").sync(newBlock.body).root() !== newBlock.header.merkleRoot))
            ) {
        console.log('invalid merkleRoot');
        return false;
    }
    // else if (!isValidTimestamp(newBlock, previousBlock)) {
    //     console.log("invalid Timestamp")
    //     return false;
    // }
    else if (!hashMatchesDifficulty(createHash(newBlock), newBlock.header.difficulty)){
        console.log("invalid hash");
        return false;
    }
    return true;
}

// 검증 함수) 다른 노드의 체인으로 교체시 체인 검증 
function isValidChain(newBlocks) {
    //제네시스 확인
    //제네시스 블록이랑  다르면 다른걸 확인할 필요도 없음
    if (JSON.stringify(newBlocks[0]) !== JSON.stringify(Blocks[0])){
        return false;
    }

    var tempBlocks = [newBlocks[1]];
    for (var i = 1; i < newBlocks.length; i++) {
       if (isValidNewBlock(newBlocks[i],tempBlocks[i - 1])){
           tempBlocks.push(newBlocks[i])
       }
       else{
           return false;
       }
    }
    return true
}
//========================================================

// 블록 생성 함수) 생성한 블록을 체인에 합류시키는 함수
function addBlock(newBlock){
	const p2pserver = require('./r_network')
    if (isValidNewBlock(newBlock, getLastBlock())) {
        Blocks.push(newBlock);
		p2pserver.broadcastLatest()
        return true;
    }
    return false;
}

// addBlock(['transaction1'])
// addBlock(['transaction2'])
// addBlock(['transaction3'])
//console.log(Blocks)

// 체인 교체 함수
const replaceChain = (newBlocks) => {
	const p2pserver = require('./r_network')
	console.log(newBlocks)
    if (isValidChain(newBlocks)){
		if ((newBlocks.length > Blocks.length) 
		||(newBlocks.length === Blocks.length) && random.boolean()) {
			Blocks = newBlocks;
			p2pserver.broadcastLatest()
		}
	} 
    else {
        console.log('Received blockchain invalid');
    }
};

// 유틸 함수) 16진수 -> 2진수 변경
function hexToBinary(s){
	const lookupTable = {
		'0': '0000', '1' : '0001', '2': '0010','3': '0011',
		'4': '0100', '5' : '0101', '6': '0110','7': '0111',
		'8': '1000', '9' : '1001', 'A': '1010','B': '1011',
		'C': '1100', 'D' : '1101', 'E': '1110','F': '1111',
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


function hashMatchesDifficulty(hash,difficulty){
	const hashBinary = hexToBinary(hash.toUpperCase())
	const requirePrefix = '0'.repeat(difficulty)
	//startsWith : 시작부분이 같으면 true, 다르면 false 반환하는 함수
	return hashBinary.startsWith(requirePrefix)
}

function findBlock(currentVersion, nextIndex , previousHash,nextTimestamp,merkleRoot,difficulty,nonce){
	// var nonce = 0;
	while(true){
		var hash = calculateHash(currentVersion, nextIndex , previousHash,nextTimestamp,merkleRoot,difficulty,nonce)
		
		// 정답일 경우
		if (hashMatchesDifficulty(hash,difficulty)) {
			return new BlockHeader(currentVersion, nextIndex , previousHash,nextTimestamp,merkleRoot,difficulty,nonce)
		}
		// 정답이 아닐 경우
		nonce++;
	}
}

function getDifficulty(blocks){
	const lastBlock = blocks[blocks.length - 1];
	if(lastBlock.header.index !== 0 
		&& lastBlock.header.index % DIFFICULTY_ADJUSTMENT_INTERVAL == 0){
			getAdjustDifficulty(lastBlock,blocks)
		}
	return lastBlock.header.difficulty;
}

// 난이도 조정 함수
function getAdjustDifficulty(lastBlock,blocks){
	const prevAdjustmentBlock = blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
	//실제 걸린 시간
	const elapsedTime = lastBlock.header.timestamp - prevAdjustmentBlock.header.timestamp
	//기대한시간
	const expectedTime = BLOCK_GENERATION_INTERVAL	*DIFFICULTY_ADJUSTMENT_INTERVAL;
	
	if (expectedTime / 2 > elapsedTime) {	
		return prevAdjustmentBlock.header.difficulty + 1;
	}
	else if (expectedTime * 2 < elapsedTime){
		return prevAdjustmentBlock.header.difficulty - 1;
	}
	else{
		return prevAdjustmentBlock.header.difficulty;
	}
}

function getCurrentTimestamp(){
	return Math.round(new Date().getTime() / 1000)
	// Math.round() :소수점이하 값 반올림하는 함수
}
function isValidTimestamp(newBlock,prevBlock){
	return ( (newBlock.header.timestamp - prevBlock.header.timestamp) > 60 ) 
	&& getCurrentTimestamp() - newBlock.header.timestamp  < 60
}
//>isValidNewBlock에 검증 추가하기

module.exports ={
	Blocks,
	createHash,
	getLastBlock,
	nextBlock,
	getBlocks,
	getVersion,
	addBlock,
	replaceChain,
	hashMatchesDifficulty,
	isValidBlockStructure
}

//코드정리후
/*
	웹페이지 
	블록 마이닝
	지갑 생성해서 연결된 다른 노드들과 블록체인을 교환
	현재 블록들의 상황 시각화
	지갑의 최신화된 블록은 몇 개고..
	종료해도 데이터 남아있도록 db연결
*/
const fs = require('fs')
const merkle = require('merkle')
const cryptojs = require('crypto-js')
const random = require('random');
const p2pserver = require('./p2pServer')

const BLOCK_GENERATION_INTERVAL = 10 //블록이 생성되는 간격 10초
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10 //  난이도가 조정되는 간격 10개마다

class Block{
	constructor(header, body){
		this.header = header
		this.body = body
	}
}
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

function getVersion(){
	const package = fs.readFileSync("package.json");
	//console.log(JSON.parse(package).version);
	return JSON.parse(package).version;
}

//console.log("버전 : ",getVersion())
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

const block = createGenesisBlock()
//console.log("Genesis Block : ",block)


let Blocks = [createGenesisBlock()]

function getBlocks(){ 
	return Blocks
}
//console.log(getBlocks())

function getLastBlock(){
	return Blocks[Blocks.length - 1]
}

function createHash(data){
	const {version, previousHash,index, timestamp, merkleRoot,difficulty,nonce} = data.header
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}


function calculateHash(version, previousHash,index, timestamp, merkleRoot,difficulty,nonce){
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}
//const block = createGenesisBlock()
//const testHash = createHash(block)
//console.log(Blocks)
//console.log(testHash)

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

function isValidNewBlock(newBlock, previousBlock){
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
function isValidChain(newBlocks) {
    //제네시스 확인
    //제네시스 블록이랑  다르면 다른걸 확인할 필요도 없음
    if (JSON.stringify(newBlocks[0]) !== JSON.stringify(BC.Blocks[0])){
        return false;
    }

    var tempBlocks = [newBlocks[0]];
    for (var i = 0; i < newBlocks.length; i++) {
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
function addBlock(newBlock){
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
console.log(Blocks)

const replaceChain = (newBlocks) => {
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

//16진수로 되어있는 값을 2진수로
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
	return (prevBlock.header.timestamp - 60 < newBlock.header.timestamp ) 
	&& newBlock.header.timestamp - 60 < getCurrentTimestamp()
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
}
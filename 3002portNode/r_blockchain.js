
//  [ 블록의 생성, 검증, 합의 알고리즘을 포함 / 프로토콜을 변경하려면 여기서 수정 ]
// ===========================================================================

const cryptojs = require('crypto-js')
const merkle = require('merkle')
const random = require('random');
const {getCurrentVersion, getCurrentTimestamp, hexToBinary} = require("./r_util")

// 현재 개발 편의상 임의값으로 설정해둔 상태
const BLOCK_GENERATION_INTERVAL = 200 //블록이 생성되는 간격  
const DIFFICULTY_ADJUSTMENT_INTERVAL = 2 //  난이도가 조정되는 간격

// 블록 구조 설정
class Block{
	constructor(hash, header, body){
		this.hash = hash //직관적으로 보려고 블록해시값도 추가함
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


// 블럭 생성 함수) 제네시스 블럭 생성
function createGenesisBlock(){  //초기 블록 생성하는 함수
	const version = getCurrentVersion()
	const index = 0
	const previousHash = '0'.repeat(64) // #최초블록은 이전 해쉬 없어서 0으로 64자리 채워넣음
	const timestamp = 1231006505
	const body = ['The Times 03/Jan/2009 Chancellor on brink of second bailout for bank']
	const tree = merkle('sha256').sync(body)
	const merkleRoot = tree.root() || '0'.repeat(64)
	const difficulty = 1;
	const nonce = 0
	
	
	const header = new BlockHeader(version,index, previousHash, timestamp, merkleRoot,difficulty,nonce)
	
	const blockhash = calculateHash(version, previousHash,index, timestamp, merkleRoot,difficulty,nonce) 
	return new Block(blockhash,header, body)
}


//블록체인 배열 선언 및 초기 제네시스블록 삽입.
let Blocks = [createGenesisBlock()]


// 호출용 함수) 블록체인 안의 모든 블록 불러오기
function getBlocks(){ 
	return Blocks
}

// 호출용 함수) 마지막 블록 불러오기
function getLastBlock(){
	return Blocks[Blocks.length - 1]
}


// 해시화 함수) 인자를 블록 형태로 받아 해시화 
function createHash(data){
	console.log("크리에이트 해시 들어옴",data.header)
	const {version, index, previousHash, timestamp, merkleRoot,difficulty,nonce} = data.header
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}

// 해시화 함수) 인자를 블록의 헤더data로 받아 해시화
function calculateHash(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce){
	const blockString = version + index + previousHash + timestamp + merkleRoot + difficulty + nonce
	const hash = cryptojs.SHA256(blockString).toString()
	return hash
}


// 블럭 생성 함수) 새로운 블럭 생성
function nextBlock(bodyData){
	const prevBlock = getLastBlock();
	const version = getCurrentVersion();
	const index = prevBlock.header.index + 1;
	const previousHash = createHash(prevBlock);
	const timestamp = parseInt(Date.now() / 1000);
	const tree = merkle('sha256').sync(bodyData);
	const merkleRoot = tree.root() || '0'.repeat(64);
	const difficulty = getDifficulty(getBlocks());
	let nonce = 0;

	const header = findBlock(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce) 
	const blockhash = calculateHash(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce = header.nonce)
	return new Block(blockhash, header, bodyData)
}

// 블록 생성 함수) 생성한 블록을 체인에 연결시키는 함수
function addBlock(newBlock){
	console.log("duddudddud",newBlock)
	const p2pserver = require('./r_network')
	if (isValidNewBlock(newBlock, getLastBlock())) {
		Blocks.push(newBlock);
		p2pserver.broadcastLatest()
		return true;
	}
	return false;
}

//=====================유효성 검증 코드들========================

// 검증 함수) 신규 생성 블록 검증
function isValidNewBlock(newBlock, previousBlock){

	console.log("신규 블록 인덱스",newBlock.header.index);
	console.log("이전 블록 인덱스",previousBlock.header.index)
	console.log("뉴 블록 해시값 : ", newBlock);
    if (isValidBlockStructure(newBlock) == false) {
		console.log('오류! 유효하지 않은 블록입니다.');
        return false;
    }
    else if (newBlock.header.index !== previousBlock.header.index + 1) {
		console.log('오류! 인덱스 값이 유효하지 않습니다.');
        return false;
    }
    else if (createHash(previousBlock) !== newBlock.header.previousHash){
		console.log('오류! 이전 블럭 해시값과 신규 블럭의 이전 해시값이 일치하지 않습니다.');
        return false;
    }
    else if ((newBlock.body.length === 0 && ('0'.repeat(64) !== newBlock.header.merkleRoot) )
	||( newBlock.body.length !== 0 && (merkle("sha256").sync(newBlock.body).root() !== newBlock.header.merkleRoot))
	) {
		console.log('오류! 머클루트 값이 유효하지 않습니다.');
        return false;
    }
    else if (!isValidTimestamp(newBlock, previousBlock)) {
		    console.log("오류! 타임스탬프")
		    return false;
	}
	else if (!hashMatchesDifficulty(createHash(newBlock), newBlock.header.difficulty)){
		console.log("오류! 신규 블럭의 해시 앞자리와 difficulty 자릿수가 일치하지 않음");
		return false;
	}
	return true;
}
	
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

// 검증 함수) 다른 노드의 체인으로 교체시 체인 검증 
function isValidChain(newBlocks) {	
	if (JSON.stringify(newBlocks[0]) !== JSON.stringify(Blocks[0])){
		return false;
	}
	
	var tempBlocks = [newBlocks[0]];
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

// 검증 함수) 블록 생성 간격 조절(해킹방지) & 블록 검증 시간 카운트다운
// 바로바로 블록 생성 확인하려고 개발할 동안 비활성화 해 둠
function isValidTimestamp(newBlock,prevBlock){
	return ( (newBlock.header.timestamp - prevBlock.header.timestamp) > 1 ) 
	&& getCurrentTimestamp() - newBlock.header.timestamp  < 60
}

// 검증 함수) 신규 블록의 해시값과 difficulty값 대입 시 해시 앞자리 일치 여부 검증
function hashMatchesDifficulty(hash,difficulty){
	console.log("difficulty값", difficulty);
	const hashBinary = hexToBinary(hash);
	const requirePrefix = '0'.repeat(difficulty);


	//startsWith : 시작부분이 같으면 true, 다르면 false 반환하는 함수
	return hashBinary.startsWith(requirePrefix);
}

//========================================================
	
// 체인 교체 함수
const replaceChain = (newBlocks) => {
	const p2pserver = require('./r_network')
	console.log(newBlocks)
	if (isValidChain(newBlocks)){
		if ((newBlocks.length > Blocks.length) 
		||(newBlocks.length === Blocks.length) && random.boolean()) {
			Blocks = newBlocks;
			console.log("교체 완료!")
			p2pserver.broadcast(p2pserver.responseLatestMsg())
		}
	} 
	else {
		console.log('교체할 체인이 유효하지 않습니다.');
	}
};
	

function findBlock(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce){
	while(true){
		var hash = calculateHash(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce)
	
		console.log("시도하는 hash : ",hash)
		// 정답일 경우
		if (hashMatchesDifficulty(hash,difficulty)) {
			console.log()
			console.log("매칭된 hash : ",hash)
			console.log("매칭된 nonce : ",nonce)
			console.log()
			
			return new BlockHeader(version, index, previousHash, timestamp, merkleRoot,difficulty,nonce)
		}
		// 정답이 아닐 경우
		nonce++;
	}
}

function getDifficulty(blocks){
	const lastBlock = blocks[blocks.length - 1];
	if(lastBlock.header.index !== 0 && (lastBlock.header.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0)){
		console.log("여기로 들오자")
		return	getAdjustDifficulty(lastBlock,blocks)
	} else{
		return lastBlock.header.difficulty;
	}
}

// 난이도 조정 함수
function getAdjustDifficulty(lastBlock,blocks){
	const prevAdjustmentBlock = blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
	//실제 걸린 시간
	const elapsedTime = lastBlock.header.timestamp - prevAdjustmentBlock.header.timestamp
	console.log("걸린시간 : ",elapsedTime)
	//기대한시간
	const expectedTime = BLOCK_GENERATION_INTERVAL	*DIFFICULTY_ADJUSTMENT_INTERVAL;
	console.log("기대시간 : ",expectedTime)
	if (expectedTime / 2 > elapsedTime) {	
		console.log("난이도 upupup")
		return prevAdjustmentBlock.header.difficulty + 1;
	}
	else if (expectedTime * 2 < elapsedTime){
		console.log("난이도 downdowndown")
		return prevAdjustmentBlock.header.difficulty - 1;
	}
	else{
		return prevAdjustmentBlock.header.difficulty;
	}
}


module.exports ={
	createHash,
	getLastBlock,
	nextBlock,
	getBlocks,
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
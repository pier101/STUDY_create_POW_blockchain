const fs = require('fs')
const merkle = require('merkle')
const cryptojs = require('crypto-js')


class Block{
	constructor(header, body){
		this.header = header
		this.body = body
	}
}
class BlockHeader{
	constructor(version,index, previousHash, timestamp, merkleRoot,bit,nonce){
		this.version = version
		this.index = index
		this.previousHash = previousHash
		this.timestamp = timestamp
		this.merkleRoot = merkleRoot
		this.bit = bit
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
	const timestamp = parseInt(Date.now()/1000)
	const body = ['hello block']
	const tree = merkle('sha256').sync(body)
	const merkleRoot = tree.root() || '0'.repeat(64)
	const bit = 0
	const nonce = 0
	
	
	//console.log("version : %s, timestamp : %d, body : %s", version,timestamp,body);
	//console.log("previousHash : %d", previousHash);
	//console.log("tree : %d",tree)
	//console.log("merkleRoot : $d", merkleRoot);
	
	const header = new BlockHeader(version,index, previousHash, timestamp, merkleRoot,bit,nonce)
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
	const {version, previousHash,index, timestamp, merkleRoot,bit,nonce} = data.header
	const blockString = version + index + previousHash + timestamp + merkleRoot + bit + nonce
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
	const bit = 0
	const nonce = 0
	
	const header = new BlockHeader(version , index , previousHash , timestamp , merkleRoot , bit , nonce)
	return new Block(header, bodyData)
}

// const block1 = nextBlock(["tranjaction1"])
// console.log(block1)

function addBlock(bodyData){
	const newBlock = nextBlock(bodyData)
	Blocks.push(newBlock)
}
// addBlock(['transaction1'])
// addBlock(['transaction2'])
// addBlock(['transaction3'])
console.log(Blocks)

const replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        p2p_1.broadcastLatest();
    }
    else {
        console.log('Received blockchain invalid');
    }
};

module.exports ={Blocks, createHash,getLastBlock,nextBlock,getBlocks,getVersion,addBlock}
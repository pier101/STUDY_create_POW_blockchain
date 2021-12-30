// # 유효성검증하기
// 블록 구조가 유효한지
// 현재 블록의 인덱스가 이전 블록의 인덱스보다 1만큼 큰지
// 이전 블록의 해시값과 현재 블록의 이전 해시가 같은지
// 데이터 필드로부터 계산한 머클루트와 블록 헤더의 머클루트가 동일한지onst merkle = require('merkle')
const merkle = require('merkle')
const {getLastBlock,createHash, Blocks,nextBlock} =require('./chainedBlock')

function isValidBlockStructure(block){
    return typeof(block.header.version) == 'string'
        && typeof(block.header.index) == 'number'
        && typeof(block.header.previousHash) == 'string'
        && typeof(block.header.timestamp) == 'number'
        && typeof(block.header.merkleRoot) == 'string'
        && typeof(block.body) == 'object'
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
    return true;
}

function addBlock(newBlock){
    if (isValidNewBlock(newBlock,getLastBlock())) {
        Blocks.push(newBlock);
        return true;
    }
    return false;
}

const block = nextBlock(['new Transaction'])
addBlock(block)
console.log(Blocks)

module.exports = {addBlock}
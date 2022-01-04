// # 유효성검증하기
// 블록 구조가 유효한지
// 현재 블록의 인덱스가 이전 블록의 인덱스보다 1만큼 큰지
// 이전 블록의 해시값과 현재 블록의 이전 해시가 같은지
// 데이터 필드로부터 계산한 머클루트와 블록 헤더의 머클루트가 동일한지onst merkle = require('merkle')
// const merkle = require('merkle')
// const BC =require('./blockchain')

// // console.log("여기",getLastBlock())

// function isValidBlockStructure(block){
//     return typeof(block.header.version) === 'string'
//         && typeof(block.header.index) === 'number'
//         && typeof(block.header.previousHash) === 'string'
//         && typeof(block.header.timestamp) === 'number'
//         && typeof(block.header.merkleRoot) === 'string'
//         && typeof(block.header.difficulty) === 'number'
//         && typeof(block.header.nonce) === 'number'
//         && typeof(block.body) === 'object'
// }

// function isValidNewBlock(newBlock, previousBlock){
//     if (isValidBlockStructure(newBlock) == false) {
//         console.log('invalid Block Structure');
//         return false;
//     }
//     else if (newBlock.header.index !== previousBlock.header.index + 1) {
//         console.log('invalid index');
//         return false;
//     }
//     else if (BC.createHash(previousBlock) !== newBlock.header.previousHash){
//         console.log('invalid previousHash');
//         return false;
//     }
//     else if ((newBlock.body.length === 0 && ('0'.repeat(64) !== newBlock.header.merkleRoot) )
//             ||( newBlock.body.length !== 0 && (merkle("sha256").sync(newBlock.body).root() !== newBlock.header.merkleRoot))
//             ) {
//         console.log('invalid merkleRoot');
//         return false;
//     }
//     else if (!BC.isValidTimestamp(newBlock, previousBlock)) {
//         console.log("invalid Timestamp")
//         return false;
//     }
//     else if (!BC.hashMatchesDifficulty(BC.createHash(newBlock), newBlock.header.difficulty)){
//         console.log("invalid hash");
//         return false;
//     }
//     return true;
// }
// function isValidChain(newBlocks) {
//     //제네시스 확인
//     //제네시스 블록이랑  다르면 다른걸 확인할 필요도 없음
//     if (JSON.stringify(newBlocks[0]) !== JSON.stringify(BC.Blocks[0])){
//         return false;
//     }

//     var tempBlocks = [newBlocks[0]];
//     for (var i = 0; i < newBlocks.length; i++) {
//        if (isValidNewBlock(newBlocks[i],tempBlocks[i - 1])){
//            tempBlocks.push(newBlocks[i])
//        }
//        else{
//            return false;
//        }
//     }
//     return true
// }

// // function addBlock(newBlock){
// //     if (isValidNewBlock(newBlock, getLastBlock())) {
// //         Blocks.push(newBlock);
// //         return true;
// //     }
// //     return false;
// // }

// // const block = nextBlock(['new Transaction'])
// // addBlock(block)
// // console.log(Blocks)

// module.exports = {isValidChain,isValidNewBlock}
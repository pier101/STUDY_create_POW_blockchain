function Block(){
        this.chain = [];
        this.newTransactions= [];
}

//블록체인 프로토 타입 함수 정의
Block.prototype.createNewBlock = (nonce, previousBlockHash,hash)=>{
    //새 블록 객체
    const newBlock = {
        index : this.length + 1,
        timestamp : Date.now(),
        transactions : this.newTransactions,
        nonce : nonce,
        hash : hash,
        previousBlockHash : previousBlockHash
    };

    // 다음 거래를 위한 거래내역 배열 비워주고 새로운 블록을 chain 배열에 추가
    this.newTransactions = [];
    this.chain.push(newBlock);

    return newBlock
} 

// Block 모듈화
module.exports = Block;
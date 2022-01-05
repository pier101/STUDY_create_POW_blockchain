// 메시지 핸들러, 에러 핸들러, 브로드캐스트 등 p2p 통신 관련 기능을 포함
// (노드와 노드 간의 통신)

const WebSocket = require('ws')
const BC = require('./r_blockchain')
let sockets = []

function initP2PServer(p2p_port){
    const server = new WebSocket.Server({port: p2p_port}) 
    
    server.on('connection',(ws)=>{
        console.log("connection 3001")
        initConnection(ws)
        console.log("라스트 블록",BC.getLastBlock())
    })

    console.log("Listening websocket port : ", + p2p_port) 
}


function sendBlock(block){
    
}


function initConnection(ws) {
    sockets.push(ws);
    initMessageHandler(ws)
    initErrorHandler(ws)
    write(ws, queryLatestMsg());
}

function  getSockets(){ 
    return sockets 
}

// 특정 노드에 메세지를 던지는 역할
function write(ws, message){
    ws.send(JSON.stringify(message)) 
}
const broadcastLatest = () => {
    broadcast(responseLatestMsg());
};

// 통신이 되어있는 노드 모두에게 메세지 전달
function broadcast(message) {
    sockets.forEach( socket =>{
        write(socket,message)
    })
}

//클라이언트에서 웹소켓 접속
function connectToPeers(newPeers) {
    newPeers.forEach(peer=>{
        const ws = new WebSocket(peer)

        ws.on("open",()=> {
            console.log("open 3001")
            initConnection(ws)
        })
        ws.on("error",()=>console.log("connection Failed! 3001"))
    })
}   


// Message Handler
const MessageType = {
    QUERY_LATEST:0, /// 내가 가지고 있는 블럭들중에 가장 최신블록 리턴
    QUERY_ALL:1,  // 내가 가지고 있는 블럭들 모두 리턴
    RESPONSE_BLOCKCHAIN:2  //데이터필드에서 하나이상의 블럭이 있을떄 
}

function initMessageHandler(ws){
    ws.on("message",(data)=>{
        const message = JSON.parse(data)
        if (message === null) {
            console.log('could not parse received JSON message: ' + data);
            return
        }
        console.log('받은 메세지 3001 : ' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                console.log("메세지 0  3001")
                write(ws,responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                console.log("메세지 1  3001")
                write(ws,responseAllChainMsg());
                
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                console.log("메세지 2  3001")
                const receivedBlocks = JSON.parse(message.data);;
                if (receivedBlocks === null) {
                    console.log('받은 블록이 유효하지 않음 : %s', JSON.stringify(message.data));
                    break;
                }
                handleBlockChainResponse(receivedBlocks)
                break;
        
            default:
                break;
        }
    })
}

function responseLatestMsg(){
    console.log("마지막 블록은?",BC.getLastBlock());
    return ({
        "type": MessageType.RESPONSE_BLOCKCHAIN,
        "data": JSON.stringify([BC.getLastBlock()]) 
    })
}
function responseAllChainMsg(){
    return ({
        "type": MessageType.RESPONSE_BLOCKCHAIN,
        "data": JSON.stringify(BC.getBlocks()) 
    })
}

//블럭데이터 받았을떄
function handleBlockChainResponse(receivedBlocks){
    console.log('블럭데이터 받음 : ', receivedBlocks)
    // const receiveBlocks =JSON.parse(message.data)
    // const latestRecieveBlock = receiveBlocks[receiveBlocks.length - 1]
    // // console.log("헤더",latestRecieveBlock.header)
    // // console.log("헤더인덱스",latestRecieveBlock.header.index)
    // const { getLastBlock} = require('./r_blockchain')
    // const latestMyBlock = getLastBlock()

    // console.log('리시브 블락',latestMyBlock)
    // console.log('내꺼 마지막 블락',latestMyBlock)
    // console.log("마지막 블락",latestRecieveBlock)
    // // 데이터로 받은 블록 중에 마지막 블럭의 인덱스가 내가 보유 중인 마지막 블럭의 인덱스보다 클 떄/작을떄
    // // 작으면 굳이 가져올 필요 없음
    // if (latestRecieveBlock.header.index > latestMyBlock.header.index){
    //     // 받은 마지막 블록의 이전 해시값이 내 마지막 블럭일 떄
    //     if (createHash(latestMyBlock) === latestRecieveBlock.header.previousHash){
    //         if (addBlock(latestRecieveBlock)){
    //             broadcast(responseLatestMsg())
    //         }
    //         else{
    //             console.log("Invalid Block!! 3001")
    //         }
    //     }
    //     // 받은 블럭의 전체 크기가 1일 떄
    //     else if (receiveBlocks.length === 1){
    //         broadcast(queryAllMsg()) //전체를 다시 달라고 요청
    //     }
    //     else { //통째로 갈아끼워야하는 상황
    //         BC.replaceChain(receiveBlocks)
    //     }
    // } 
    // else {
    //     console.log("do nothing. 3001")
    // }
    //==================================================
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    console.log("상대방꺼",latestBlockReceived)
    if (!BC.isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }
    const latestBlockHeld = BC.getLastBlock();
    console.log("내꺼",latestBlockHeld)
    if (latestBlockReceived.header.index > latestBlockHeld.header.index) {
        console.log("들옴")
        console.log('blockchain possibly behind. We got: '
            + latestBlockHeld.header.index + ' Peer got: ' + latestBlockReceived.header.index);
        if (BC.createHash(latestBlockHeld) === latestBlockReceived.previousHash) {
            console.log("받은 라스트블록의 이전 해시값과 현재 라스트블록의 해시가 같을 경우")
            if (BC.addBlock(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        }
        else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        }
        else {
            console.log('Received blockchain is longer than current blockchain');
            BC.replaceChain(receivedBlocks);
        }
    }
    else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
}
//메세지 받아서 처리하는것들 위3개

//아래는 요청을 보내는 애들 
function queryLatestMsg(){
    return ({
        "type": MessageType.QUERY_LATEST,
        "data": null 
    })
}
function queryAllMsg(){
    return ({
        "type": MessageType.QUERY_ALL,
        "data": null 
    })
}

function initErrorHandler(ws){
    ws.on("close",()=>{closeConnection(ws)})
    ws.on("error",()=>{closeConnection(ws)})
}

function closeConnection(ws){
    console.log(`Connection close ${ws.url}`)
    sockets.splice(sockets.indexOf(ws), 1) //초기화
}
module.exports = {connectToPeers,getSockets,initP2PServer,broadcast,broadcastLatest}
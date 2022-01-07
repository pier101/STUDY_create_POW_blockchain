

// [ 메시지 핸들러, 에러 핸들러, 브로드캐스트 등 p2p 통신 관련 기능을 포함 ]
// (노드와 노드 간의 통신)
// ===========================================================================

const WebSocket = require('ws')
const BC = require('./r_blockchain')
let sockets = []

function initP2PServer(p2p_port){
    const server = new WebSocket.Server({port: p2p_port}) 
    
    server.on('connection',(ws)=>{
        console.log("connection 3001")
        initConnection(ws)
    })
    console.log("Listening websocket port : ", + p2p_port) 
}

function sendBlock(block){
    
}

// 연결시 초기 상태 설정
function initConnection(ws) {
    sockets.push(ws);
    console.log("확인용1")
    initMessageHandler(ws)
    initErrorHandler(ws)
    console.log("확인용2")
    write(ws, queryLatestMsg());
    console.log("확인용3")
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
    console.log("broadcast1")
    sockets.forEach( socket =>{
        console.log("broadcast2")
        console.log(message)
        
        write(socket,message)
    })
}

// 클라이언트에서 웹소켓 접속
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


const MessageType = {
    QUERY_LATEST:0, /// 내가 가지고 있는 블럭들중에 가장 최신블록 리턴
    QUERY_ALL:1,  // 내가 가지고 있는 블럭들 모두 리턴
    RESPONSE_BLOCKCHAIN:2  //데이터필드에서 하나이상의 블럭이 있을떄 
}

function initMessageHandler(ws){
    ws.on("message",(data)=>{
        const message = JSON.parse(data)
        if (message === null) {
            console.log('메세지가 없거나 제대로 파싱되지 않았습니다. \n data :' + data);
            return
        }
        // console.log('받은 메세지 3001 : ' + JSON.stringify(message));
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
    console.log("responseLatestMsg로 옴");
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
    console.log('블럭데이터 받았습니다.')
    
    // 받은 블럭 데이터 값이 없을 떄
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }

    // 받은 블럭
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    // 내 노드가 가진 블록체인의 마지막 블록
    const latestBlockHeld = BC.getLastBlock();
    
    if (!BC.isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }
    // const preprepre = receivedBlocks[receivedBlocks.length - 2];
    // 상대방에게 받은 블록체인의 길이가 내 블록체인의 길이보다 길 경우
    if (latestBlockReceived.header.index > latestBlockHeld.header.index) {
        console.log('받은 블록의 길이 : ', latestBlockReceived.header.index)
        console.log('내 블록의 길이 : ', latestBlockHeld.header.index)
        // console.log('받은 마지막 이전블록의 헤더 : ', preprepre)
        // console.log('내 마지막 블록의 헤더 : ', latestBlockHeld.header)
        // console.log('내 마지막 블록 해시값 : ', BC.createHash(latestBlockHeld))
        // console.log('상대 마지막 블록  이전 해시값 : ', latestBlockReceived.header.previousHash)

        // 내 마지막 블록의 해시값과 받은 마지막 블록의 이전 해시값이 때 => 내꺼보다 상대방 블록이 한 개 더 많은 상태
        if (BC.createHash(latestBlockHeld) === latestBlockReceived.header.previousHash) {
            console.log("** (업데이트) 마지막 노드 1개 받기 **")
            if (BC.addBlock(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        }
        // 받은 블록의 길이가 1개일 떄
        else if (receivedBlocks.length === 1) {
            console.log('블록 다시 요청 함');
            broadcast(queryAllMsg());
        }

        // 받은 블록의 길이가 더 길때
        else {
            console.log('** (업데이트) 받은 블록체인으로 교체 **');
            BC.replaceChain(receivedBlocks);
        }
    }
    else {
        console.log('업데이트가 필요없는 최신 블록체인입니다.');
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
module.exports = {connectToPeers,getSockets,initP2PServer,broadcast,broadcastLatest,responseLatestMsg}
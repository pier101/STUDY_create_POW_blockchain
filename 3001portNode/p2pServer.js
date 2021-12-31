const WebSocket = require('ws')
const {Server} = require('ws')
const { addBlock } = require('../211229/checkValidBlock')
const { getBlocks, getLastBlock, createHash } = require('./chainedBlock')

const sockets = []

function initP2PServer(p2p_port){
    const server = new WebSocket.Server({port: p2p_port}) 
    
    server.on('connection',(ws)=>{
        console.log("connection 커넥션 3001")
        initConnection(ws)
    })

    console.log("Listening websocket port : ", + p2p_port) 
}


function sendBlock(block){

}


function initConnection(ws) {
    sockets.push(ws._url)
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
    console.log("메세지 왔어요 외부 3001")
    ws.on("message",(data)=>{
        console.log("메세지에 온 데이터 : ", data,"  3001")
        const message = JSON.parse(data)
        console.log('메세지 왔어요 3001' + JSON.stringify(message));
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
                handleBlockChainResponse(message)
                break;
        
            default:
                break;
        }
    })
}

function responseLatestMsg(){
    return ({
        "type": MessageType.RESPONSE_BLOCKCHAIN,
        "data": JSON.stringify([getLastBlock()]) 
    })
}
function responseAllChainMsg(){
    return ({
        "type": MessageType.RESPONSE_BLOCKCHAIN,
        "data": JSON.stringify(getBlocks()) 
    })
}

//블럭데이터 받았을떄
function handleBlockChainResponse(message){
    const receiveBlocks =JSON.parse(message.data)
    const latestRecieveBlock = receiveBlocks[receiveBlocks.length - 1]
    const latestMyBlock = getLastBlock()
    // 데이터로 받은 블록 중에 마지막 블럭의 인덱스가 내가 보유 중인 마지막 블럭의 인덱스보다 클 떄/작을떄
    // 작으면 굳이 가져올 필요 없음
    if (latestRecieveBlock.header.index > latestMyBlock.header.index){
        // 받은 마지막 블록의 이전 해시값이 내 마지막 블럭일 떄
        if (createHash(latestMyBlock) === latestRecieveBlock.header.previousHash){
            if (addBlock(latestRecieveBlock)){
                broadcast(responseLatestMsg())
            }
            else{
                console.log("Invalid Block!! 3001")
            }
        }
        // 받은 블럭의 전체 크기가 1일 떄
        else if (receiveBlocks.length === 1){
            broadcast(queryAllMsg()) //전체를 다시 달라고 요청
        }
        else { //통째로 갈아끼워야하는 상황
            replaceChain(receiveBlocks)
        }
    } 
    else {
        console.log("do nothing. 3001")
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
module.exports = {connectToPeers,getSockets,initP2PServer}

//피어저장해놨고
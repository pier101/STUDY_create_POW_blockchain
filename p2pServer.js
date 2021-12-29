const WebSocket = require('ws')

const p2p_port = process.env.P2P_PORT || 6001
let sockets = []

function initP2PServer(test_port){
    const server = new WebSocket.Server({port: test_port}) 
    
    server.on('connection',(ws)=>{
        console.log("connection")
    })

    console.log("Listening websocket port : ", + test_port) 
}

initP2PServer(6001)
initP2PServer(6002)
initP2PServer(6003)



function initConnection(ws) {
    sockets.push(ws._url)
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
            initConnection(ws)
        })
        ws.on("error",()=>console.log("connection Failed!"))
    })
}   


module.exports = {connectToPeers,getSockets}
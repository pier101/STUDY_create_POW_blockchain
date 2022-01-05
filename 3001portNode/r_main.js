//HTTP server 초기화 , P2P server 초기화 , 지갑 초기화
// (사용자와 노드 간의 통신)
const express = require('express')
const bodyParser =require('body-parser')

const BC = require('./r_blockchain')
const p2pserver = require('./r_network')
const {initWallet,getPublicKeyFromWallet} = require('./r_wallet');

//env 설정하기 : export HTTP_PORT=3001
//env 설정확인 : env | grep HTTP_PORT
const http_port = process.env.HTTP_PORT || 3001
const http_port2 = 3002
const p2p_port = process.env.P2P_PORT || 6001;


console.log("외부")
function initHttpServer(httpport){
    console.log("내부")
    const app = express()
    app.use(bodyParser.json())


    app.get("/peers",(req,res)=>{
        console.log("피어확인 요청")
        res.send(p2pserver.getSockets().map(s=> s._socket.remoteAddress + ':' + s._socket.remotePort));
    })
    app.post("/addPeers",(req,res)=>{
        console.log("피어추가")
        const data = req.body.data
        console.log("데이터",data)
        p2pserver.connectToPeers(data);
        res.send()
    })

    app.get("/blocks",(req,res)=>{ 
        console.log("블록 확인 요청옴")
        res.send(BC.Blocks)
    })
    
    // block 채굴(생성)
    app.post('/mineBlock',(req,res)=>{
        console.log("채굴 요청옴")
        const data = [req.body.data] || []
        console.log(data)
        const block = BC.nextBlock(data)
        console.log(block)
        BC.addBlock(block)
        res.send(BC.getBlocks())
    })
    
    // 버전 확인
    app.get("/version",(req,res)=>{
        console.log("버전 확인 요청옴")
        res.send(BC.getVersion())
    })
    app.get("/last",(req,res)=>{

        res.send(BC.getLastBlock())
    })
    
    // 작업 종료
    app.post("/stop",(req,res)=>{
        console.log("프로세스 종료 요청옴")
        res.send({"msg":"Stop Server!"})
        process.exit(0)
    })

    app.get('/address',(req,res)=>{
        initWallet()
        const address = getPublicKeyFromWallet().toString()
        if(address != ""){
            res.send({"address" : address });
        }
        else{
            res.send('empty address!');
        }
    })

    app.listen(httpport,()=>{
        console.log("Listenign Http Port : " + httpport)
    })

}

initHttpServer(http_port)

p2pserver.initP2PServer(p2p_port)


/*
    <<사용한 커맨드 명령어>>
    node httpserver.js &
    curl -X POST http://localhost:3001/stop
    curl -X GET http://localhost:3001/blocks | python3 -m json.tool
    curl -H "Content-type:application/json" --data "{\"data\" : [\"Anything1\",\"Anything2\"]}" http://localhost:3001/mineBlock
    curl -H "Content-type:application/json" --data "{\"data\" : [\"ws://localhost:6001\"]}" http://localhost:3001/addPeers
    curl -X GET http://localhost:3001/sockets | python3 -m json.tool | grep socket._url
    curl -H "Content-type:application/json" --data "{\"data\" : 1}" http://localhost:3001/message
    등등..
    initp2pserver() 가져와서 여기서 열기
*/

const express = require('express')
const bodyParser =require('body-parser')
const { nextBlock,Blocks, getVersion } = require('./chainedBlock')
const {addBlock} = require('./checkValidBlock')
const { connectToPeers,getSockets, initP2PServer } = require('./p2pServer')


//env 설정하기 : export HTTP_PORT=3001
//env 설정확인 : env | grep HTTP_PORT
const http_port = process.env.HTTP_PORT || 3001
const p2p_port = process.env.P2P_PORT || 6001;


console.log("외부")
function initHttpServer(){
    console.log("내부")
    const app = express()
    app.use(bodyParser.json())


    app.get("/sockets",(req,res)=>{
        console.log("피어확인 요청")
        res.send(getSockets())
    })
    app.post("/addPeers",(req,res)=>{
        console.log("피어추가")
        const data = req.body.data
        connectToPeers(data);
        res.send(data)
    })

    app.get("/blocks",(req,res)=>{ 
        console.log("블록 확인 요청옴")
        res.send(Blocks)
    })
    
    // block 채굴(생성)
    app.post('/mineBlock',(req,res)=>{
        console.log("채굴 요청옴")
        const data = [req.body.data] || []
        const block = nextBlock(data)
        addBlock(block)
        res.send(block)
    })
    
    // 버전 확인
    app.get("/version",(req,res)=>{
        console.log("버전 확인 요청옴")
        res.send(getVersion())
    })
    
    // 작업 종료
    app.post("/stop",(req,res)=>{
        console.log("프로세스 종료 요청옴")
        res.send({"msg":"Stop Server!"})
        process.exit(0)
    })
    app.listen(http_port,()=>{
        console.log("Listenign Http Port : " + http_port)
    })

}

initHttpServer(http_port)
initP2PServer(p2p_port)

/*
    <<사용한 커맨드 명령어>>
    node httpserver.js &
    curl -X POST http://localhost:3001/stop
    curl -X GET http://localhost:3001/blocks | python3 -m json.tool
    curl -H "Content-type:application/json" --data "{\"data\" : [\"Anything1\",\"Anything2\"]}" http://localhost:3001/mineBlock
    curl -H "Content-type:application/json" --data "{\"data\" : [\"ws://localhost:6002\", \"ws://localhost:6003\"]}" http://localhost:3001/addPeers
    curl -X GET http://localhost:3001/sockets | python3 -m json.tool | grep socket._url
    curl -H "Content-type:application/json" --data "{\"data\" : 1}" http://localhost:3001/message
    등등..
    initp2pserver() 가져와서 여기서 열기
*/

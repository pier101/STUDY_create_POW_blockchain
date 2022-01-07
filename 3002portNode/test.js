Blocks=[11]
const replaceChain = (newBlocks) => {
	const p2pserver = require('./r_network')
			console.log("====원래 여기 블록=====")
			console.log(Blocks)
			Blocks = newBlocks;
			console.log("=====바꾼 후 블록111=====")
			console.log(Blocks)
			p2pserver.broadcast(p2pserver.responseLatestMsg())

};
module.exports={Blocks,replaceChain}
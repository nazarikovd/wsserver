const { HttpsProxyAgent } = require('https-proxy-agent')
const WebSocket = require('ws')
const axios = require('axios');
const os = require('os');
const fs = require("fs");

module.exports = class WSserver{

	constructor(wsslink, proxy, outputer, logger) {
		this.id = Math.floor(Math.random() * 999999999999999);
		this.wsslink = wsslink;
        this.ws = null;
        this.wsloaded = false;
        this.busy = false;
        this.curproxy = proxy
        this.maxTry = 100
        this.times = 0
        this.logfunction = logger
        this.outputfunction = outputer
        this.pingIntervalId = null
        this.load(wsslink).catch((e) => {
        	//log("err on init: "+e)
        })
    }

	log(data){
		let json = {
	        'fromID': this.id,
	        'data': data
	    }
	    this.logfunction(json)
	}
	output(data){
		let json = {
	        'fromID': this.id,
	        'data': data
	    }
	    this.outputfunction(json)
	}
	async load(wsslink) {

	    let agent = await this.getProxyAgent()
	    return this.connect(wsslink, agent)
	}

	async getProxyAgent(){

		this.times++

		if(this.times > this.maxTry){
			throw new Error('PROXY_AGENT: proxy is bad. '+this.maxTry+' attempts was called ('+this.curproxy)
		}

		let proxy = this.curproxy.split(":")

	    let proxyurl = 'http://'+proxy[2]+':'+proxy[3]+'@'+proxy[0]+':'+proxy[1]


		try{
			let agent = new HttpsProxyAgent(proxyurl)
			return agent
		}
		catch(e){
			this.log("proxy agent creation failed ("+this.times+"/"+this.maxTry+") ["+e+"]")
			return this.getProxyAgent(this.maxTry, this.times)
		}

	}

	async connect(wsurl, agent){
		
		this.ws = new WebSocket(wsurl, {agent:agent});

		/*let timer = setTimeout(async () => {
			this.log('timeout');
				if(this.wsloaded){
				this.ws.close()
			}
			this.ws = null;
			this.wsloaded = false;
			let agent = await this.getProxyAgent()
	    	this.connect(this.wsslink, agent)			
		}, 20000)*/

		this.ws.on('open', async () => {
			//clearTimeout(timer)
			this.wsloaded = true;
			this.log('open with '+this.times+' attempts');
		});

		this.ws.on('error', async (e) => {
			clearInterval(this.pingIntervalId)
			this.times++
			console.log()
			this.log('WEBSOCKET: error proxy is bad or else'+this.curproxy)
			this.ws = null;
			this.wsloaded = false;

		  
		});

	    this.ws.on('close', async (event) => {
	    	clearInterval(this.pingIntervalId)
	    	this.log('disconnected...')
	        this.ws = null;
	        this.wsloaded = false;
	        if(event == '1006'){
	        	this.log('reconnecting after 5 sec...')
	        	setTimeout(() => {
	        		this.log('reconnecting...')
	        		this.getProxyAgent().then(agent => this.connect(this.wsslink, agent))
	        	}, 5000)
	        }
	        

	    });	

		this.ws.on('message', async (data) => {
			this.output(data.toString());
		  
		});

		this.pingIntervalId = setInterval(() => {
			if(this.wsloaded){
			this.ws.send('2')
			}
		}, 2500)
		return this.ws
	}

	send(data){
		if(this.wsloaded){
			this.ws.send(data)
			return true
		}else{
			return false
		}
	}

	async disconnect(){

		if(this.wsloaded){

			this.log('stopping')
			this.ws.close()

		}
	}


}
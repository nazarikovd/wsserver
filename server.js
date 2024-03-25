const wssr = require('./index.js')
const path_for_save = 'save.json';


const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile')

let events = []
let clients = [];
let wsss = [];
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/createWss', function(req, res) {

	let proxy = req.query.proxy
	let socketurl = req.query.socketurl
	let bb = new wssr(socketurl, proxy, collect, log)

	clients.push({
		"id": bb.id,
		"client": bb
	})

	res.send({
		"success": true,
		"id": bb.id
	})
})

app.get('/getEvents', function(req, res) {
	
	let cid = req.query.id
	if(!cid){
		res.send({
			"success": true,
			"response": events
		})
		return
	}

	let resp = events.filter((event) => event.id == cid)
	if(resp){
		res.send({
			"success": true,
			"response": resp
		})
	}else{
		res.send({
			"success": true,
			"response": []
		})
	}

})

app.get('/getStatus', function(req, res) {
	
	let cid = req.query.id
	if(!cid){
		res.send({
			"success": false,
			"error": "id must be id of websocket"
		})
		return
	}

	let resp = clients.filter((clients) => clients.id == cid)
	if(resp[0]){
		res.send({
			"success": true,
			"open": resp[0].client.wsloaded
		})
	}else{
		res.send({
			"success": false,
			"error": "error"
		})
	}

})

app.get('/send', function(req, res) {
	
	let cid = req.query.id
	let data = req.query.data
	if(!cid){
		res.send({
			"success": false,
			"error": "id must be id of websocket"
		})
		return
	}
	if(!data){
		res.send({
			"success": false,
			"error": "data must be data to send"
		})
		return
	}
	let resp = clients.filter((clients) => clients.id == cid)

	if(resp[0]){
		let status = resp[0].client.send(data)
		
		res.send({
			"success": status
		})
		
	}

})

function orange (data){
	return '\x1b[33m'+data+'\x1b[0m'
}
function green (data){
	return '\x1b[32m'+data+'\x1b[0m'
}

function red (data){
	return '\x1b[91m'+data+'\x1b[0m'
}

async function collect(data){
	let id = data.fromID
	let message = data.data
	events.push({"id":id, "message":message})
}
function log(data){
	let id = data.fromID
	let message = data.data
	console.log(orange('[')+green(id)+orange(']: ')+green(message))

}
app.listen(3001);

console.clear()
console.log(orange('wsserver on ')+green('localhost:3001'))
console.log(' ')
console.log(orange('GET /createWss?proxy=[')+green('proxy')+orange(']&socketurl=[')+green('url of socket')+orange(']'))

console.log('create socket and start listening')

console.log(' ')

console.log(orange('GET /getStatus?id=[')+green('wsID')+orange(']'))

console.log('check status of socket')

console.log(' ')

console.log(orange('GET /get?id=[')+green('wsID')+orange(']'))

console.log('json list of notifications')

console.log(' ')

console.log(orange('GET /send?id=[')+green('wsID')+orange(']'))

console.log('send data to socket')

console.log(' ')

/*
console.log(orange('GET /remove?id=[')+green('clientID')+orange(']'))

console.log('remove listener')

console.log(' ')


console.log(orange('GET /save'))
console.log('save all clients to save.json')

console.log(' ')


console.log(orange('GET /restore'))

console.log('restore all clients from save.json'+red('	[!] it will destroy all current clients'))

console.log(' ')


console.log(orange('GET /gui'))

console.log('simple gui for what???')

console.log(' ')
*/
let argv = require('yargs').argv
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

let net = require('net')
let JsonSocket = require('json-socket')

require('songbird')

const ROOT_DIR = path.resolve(process.cwd())

let syncServer = argv.syncServer || '127.0.0.1'
let port = argv.port || 9889

let rawSocket = new net.Socket()
let clientSyncSocket = new JsonSocket(rawSocket)
clientSyncSocket.connect(port, syncServer)
clientSyncSocket.on('connect', function() {
	console.log("Connected to SYNC server " + syncServer + ':' + port)
    
})

clientSyncSocket.on('close', function() {
	console.log("Disconnected to SYNC server " + syncServer + ':' + port)
})

clientSyncSocket.on('message', function(actMsg) {
	console.log('Received message from SYNC server: \n' + JSON.stringify(actMsg))
	if (actMsg.action === 'create') {
		if (actMsg.type === 'dir') {
			createDir(actMsg.path)
		} else if (actMsg.type === 'file') {
			createFile(actMsg.path, actMsg.content)
		}
	} else if (actMsg.action === 'update') {
		if (actMsg.type === 'file') {
			updateFile(actMsg.path, actMsg.content)
		}
	} else if (actMsg.action === 'delete') {
		if (actMsg.type === 'dir') {
			deleteDir(actMsg.path)
		} else if (actMsg.type === 'file') {
			deleteFile(actMsg.path)
		}
	}
})

async function createDir(dirRelPath) {
	let dirAbsPath = path.resolve(path.join(ROOT_DIR, dirRelPath))
	await mkdirp.promise(dirAbsPath)
	console.log('Created directory: ' + dirAbsPath)
}

async function createFile(fileRelPath, content) {
	let fileAbsPath = path.resolve(path.join(ROOT_DIR, fileRelPath))
	let parentDir = path.dirname(fileAbsPath)
	await mkdirp.promise(parentDir)
	fs.promise.writeFile(fileAbsPath, content)
	.then(() => {
		console.log('Created file: ' + fileAbsPath)
	})
	.catch(e => console.log(e.stack))
}

async function updateFile(fileRelPath, content) {
	let fileAbsPath = path.resolve(path.join(ROOT_DIR, fileRelPath))
	await fs.promise.truncate(fileAbsPath, 0)
	fs.promise.writeFile(fileAbsPath, content)
	.then(() => {
		console.log('Updated file: ' + fileAbsPath)
	})
	.catch(e => console.log(e.stack))
}

async function deleteDir(dirRelPath) {
	let dirAbsPath = path.resolve(path.join(ROOT_DIR, dirRelPath))
	await rimraf.promise(dirAbsPath)
	console.log('Deleted directory: ' + dirAbsPath)
}

async function deleteFile(fileRelPath) {
	let fileAbsPath = path.resolve(path.join(ROOT_DIR, fileRelPath))
	await fs.promise.unlink(fileAbsPath)
	console.log('Deleted file: ' + fileAbsPath)
}

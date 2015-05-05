let argv = require('yargs').argv
let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

let net = require('net')
let JsonSocket = require('json-socket')

let chokidar = require('chokidar')

require('songbird')

const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(process.cwd())

const SYNC_PORT = argv.syncPort || 9889

let app = express()

if (NODE_ENV === 'dev') {
	app.use(morgan('dev'))
}



let syncSockets = []
let syncServer = net.createServer()
syncServer.listen(SYNC_PORT, () => console.log(`TCP SYNC SERVER LISTENING @ http://127.0.0.1:${SYNC_PORT}`))
syncServer.on('connection', function(socket) { //TODO: How do use Promise style? Tried but not working
    let syncSocket = new JsonSocket(socket)
    console.log('SYNC client connected from ' + socket.remoteAddress + ':' + socket.remotePort)
    syncSocket.on('message', function(message) {
        console.log('Received message from ' + socket.remoteAddress + ': ' + socket.remotePort + ': ' + message)
    })
    syncSocket.on('close', function() {
    	console.log('Closed ' + socket.remoteAddress + ': ' + socket.remotePort)
    	for (let i=0; i<syncSockets.length; ++i) {
    		if (syncSockets[i] === syncSocket) {
    			syncSockets.splice(i, 1)
    		}
    	}
    })
    syncSockets.push(syncSocket)
})
// syncServer.promise.on('connection')
// .then(socket => {
// 	syncSocket = new JsonSocket(socket)
//     console.log('SYNC client connected from ' + socket.remoteAddress + ':' + socket.remotePort)
//     syncSocket.on('message', function(message) {
//         console.log('Received message from ' + socket.remoteAddress + ': ' + message)
//     })
// })
// .catch(e => console.log(e.stack))

function pushSyncAction(action, type, path, content) {
	if (!syncSockets) {
		console.log('No connected SYNC client available.')
		return
	}
	let actionMessage = {
		"action": action,
		"type": type,
    	"path": path,
    	"content": content,
    	"timestamp": Date.now()
	}
	for (let syncSocket of syncSockets) {
		if (syncSocket) {
			try {
				syncSocket.sendMessage(actionMessage, err => {
					if (err) {
						console.log(err)
					}
				})
				console.log('Sent action message to connected SYNC client:\n ' + JSON.stringify(actionMessage))
			} catch (e) {
				console.log(e.stack)
			}
		}
	}
}



app.listen(PORT, () => console.log(`HTTP API SERVER LISTENING @ http://127.0.0.1:${PORT}`))

app.get('*', setFileMeta, sendHeaders, (req, res) => {
	if (res.body) {
		res.json(res.body)
		return
	}
	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())

app.delete('*', setFileMeta, setDirDetails, (req, res, next) => {
	async () => {
		if (!req.stat) return res.status(400).send('Invalid Path')
		if (req.stat.isDirectory()) {
			await rimraf.promise(req.filePath)
		} else await fs.promise.unlink(req.filePath)
		res.end()

		if (req.isDir) {
			pushSyncAction('delete', 'dir', req.url, null)
		} else {
			pushSyncAction('delete', 'file', req.url, null)
		}
	}().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
	async () => {
		if (req.stat) return res.status(405).send('File exists')
		await mkdirp.promise(req.dirPath)
		if (!req.isDir) req.pipe(fs.createWriteStream(req.filePath))
		res.end()

		if (req.isDir) {
			pushSyncAction('create', 'dir', req.url, null)
		} else {
			fs.promise.readFile(req.filePath)
			.then(data => {
				pushSyncAction('create', 'file', req.url, data.toString())
			})
			.catch(e => console.log(e.stack))
		}
	}().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
	async () => {
		if (!req.stat) return res.status(405).send('File does not exist')
		if (req.isDir) return res.status(405).send('Path is a directory')

		await fs.promise.truncate(req.filePath, 0)
		req.pipe(fs.createWriteStream(req.filePath))
		res.end()

		fs.promise.readFile(req.filePath)
		.then(data => {
			pushSyncAction('update', 'file', req.url, data.toString())
		})
		.catch(e => console.log(e.stack))		
	}().catch(next)
})

function setDirDetails(req, res, next) {
	let endsWithSlash = req.filePath.charAt(req.filePath.length - 1) === path.sep
	let hasExt = path.extname(req.filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? req.filePath : path.dirname(req.filePath)
	next()
}

function setFileMeta(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	if (req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
	fs.promise.stat(req.filePath)
	.then(stat => req.stat = stat, () => req.stat = null)
	.nodeify(next)
}

function sendHeaders(req, res, next) {
	nodeify(async () => {
		if (req.stat.isDirectory()) {
			let files = await fs.promise.readdir(req.filePath)
			res.body = JSON.stringify(files);
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', req.stat.size)
		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-Type', contentType)
	}(), next)
}

//TODO: Why to use Promise style here? tried but not working
let watcher = chokidar.watch(ROOT_DIR, {
  ignored: /[\/\\]\./,
  persistent: true
})
 
watcher
	.on('add', function(path) {
		//console.log(path + ' file added')
		//TODO: call synToAddFile() here
	})
	.on('change', function(path) {
		//console.log(path + ' file changed')
		//TODO: call syncToUpdateFile() here
	})
	.on('unlink', function(path) {
		//console.log(path + ' file unlinked')
		//TODO: call syncToDeleteFile() here
	})
	.on('addDir', function(path) {
		//console.log(path + ' dir added')
		//TODO: call syncToAddDir() here
	})
	.on('unlinkDir', function(path) {
		//console.log(path + ' dir removed')
		//TODO: call syncToDeleteDir() here
	})
	.on('error', function(error) {
		//console.log(error)
	})
	.on('ready', function() {
		//console.log('Initial scan complete. Ready for changes.')
	})
	.on('raw', function(event, path, details) {
		//console.log('Raw event info: ')
	})


# Node.js training week 1 assignment -- Dropbox Demo

## Description
* Dropbox Demo, is to demo a fancy way of saying a directory that exists in multiple locations that is kept in sync to be a perfect mirror. If a file is added to the server directory, it should get pushed to the client and appear in the client's directory. If the file is updated/deleted in the server directory, the mirrored file in client's directory should be updated/deleted as well.

## Setup
```
git clone git@github.com:yzhu02/dropbox-demo.git
cd dropbox-demo
npm install
```

## Features
* The Dropbox API server is running on port 8000 by default. 
* The Dropbox API server accepts http methods `PUT`, `POST`, `DELETE`, `GET` and `HEAD`.
* `PUT` method is used to create a directory or a file to ROOT_DIR. If the specified resource already exists, it returns 405 http status code.
* `POST` method is used to update a file under ROOT_DIR. If the specified resource is a directory or does not exist, it returns 405 http status code.
* `DELETE` method is used to delete a directory or a file under ROOT_DIR. If the specified resource does not exist, it returns 400 http status code.
* `GET` method is used to load the meta information for the specified resource under ROOT_DIR, and return file content if the specified resource is a file.
* `HEAD` method is used to load the meta information only through http headers for the specified resource under ROOT_DIR.
* The Dropbox API server listens on TCP port 9889 by default to accept connection from SYNC client.
* Any files got changed in ROOT_DIR per request, the same change will push to connected SYNC client through TCP connection to keep the resources in sync.

* The Dropbox Client connects to specified SYNC server host on specified TCP port which is 9889 by default.
* The Dropbox Client listens to the messages pushed from SYNC server to sync in the resources under ROOT_DIR.

## Run Dropbox API Server (SYNC Server):
Open a new terminal and:
```
cd dropbox-server
npm start
```

## Run Dropbox SYNC Client:
Open a new terminal and:
```
cd dropbox-client
npm start
OR:
babel-node --stage 1 --optional strict -- index.js --syncServer=127.0.0.1
```

## Examples
###(1) Create a new directory

Open a new terminal and:
```
cd dropbox-demo
curl -v http://127.0.0.1:8000/foo/ -X PUT
```

API client output:
```
yzhu02-mac:dropbox-demo yzhu02$ curl -v http://127.0.0.1:8000/foo/ -X PUT
* About to connect() to 127.0.0.1 port 8000 (#0)
*   Trying 127.0.0.1...
* Adding handle: conn: 0x7f96d3001c00
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0x7f96d3001c00) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
> PUT /foo/ HTTP/1.1
> User-Agent: curl/7.30.0
> Host: 127.0.0.1:8000
> Accept: */*
> 
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Date: Mon, 04 May 2015 00:59:25 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
< 
* Connection #0 to host 127.0.0.1 left intact
```

API Server output: 
```
PUT /foo/ 200 10.772 ms - -
Sent action message to connected SYNC client:
 {"action":"create","type":"dir","path":"/foo/","content":null,"timestamp":1430701165333}
```

SYNC Client output: 
```
Received message from SYNC server: 
{"action":"create","type":"dir","path":"/foo/","content":null,"timestamp":1430701165333}
Created directory: /Users/yzhu02/yzhu/trainings/nodejs/dropbox-demo/dropbox-client/foo
```

### (2) Delete an existing directory

Open a new terminal and:
```
cd dropbox-demo
curl -v http://127.0.0.1:8000/foo/ -X DELETE
```

API client output:
```
yzhu02-mac:dropbox-demo yzhu02$ curl -v http://127.0.0.1:8000/foo/ -X DELETE
* About to connect() to 127.0.0.1 port 8000 (#0)
*   Trying 127.0.0.1...
* Adding handle: conn: 0x7ff44480aa00
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0x7ff44480aa00) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
> DELETE /foo/ HTTP/1.1
> User-Agent: curl/7.30.0
> Host: 127.0.0.1:8000
> Accept: */*
> 
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Date: Mon, 04 May 2015 01:04:32 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
< 
* Connection #0 to host 127.0.0.1 left intact
```

API Server output: 
```
DELETE /foo/ 200 5.340 ms - -
Sent action message to connected SYNC client:
 {"action":"delete","type":"dir","path":"/foo/","content":null,"timestamp":1430701472590}
```

SYNC Client output: 
```
Received message from SYNC server: 
{"action":"delete","type":"dir","path":"/foo/","content":null,"timestamp":1430701472590}
Deleted directory: /Users/yzhu02/yzhu/trainings/nodejs/dropbox-demo/dropbox-client/foo
```

### (3) Create a new file

Open a new terminal and:
```
cd dropbox-demo
curl -v http://127.0.0.1:8000/foo/bar.js -X PUT -d "Hello Dropbox"
```

API client output:
```
yzhu02-mac:dropbox-demo yzhu02$ curl -v http://127.0.0.1:8000/foo/bar.js -X PUT -d "Hello Dropbox"
* About to connect() to 127.0.0.1 port 8000 (#0)
*   Trying 127.0.0.1...
* Adding handle: conn: 0x7fab8b007a00
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0x7fab8b007a00) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
> PUT /foo/bar.js HTTP/1.1
> User-Agent: curl/7.30.0
> Host: 127.0.0.1:8000
> Accept: */*
> Content-Length: 13
> Content-Type: application/x-www-form-urlencoded
> 
* upload completely sent off: 13 out of 13 bytes
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Date: Mon, 04 May 2015 01:08:23 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
< 
* Connection #0 to host 127.0.0.1 left intact
```

API Server output: 
```
PUT /foo/bar.js 200 2.540 ms - -
Sent action message to connected SYNC client:
 {"action":"create","type":"file","path":"/foo/bar.js","content":"Hello Dropbox","timestamp":1430701703456}
```

SYNC Client output: 
```
Received message from SYNC server: 
{"action":"create","type":"file","path":"/foo/bar.js","content":"Hello Dropbox","timestamp":1430701703456}
Created file: /Users/yzhu02/yzhu/trainings/nodejs/dropbox-demo/dropbox-client/foo/bar.js
```

View the file in SYNC Server:
```
cat dropbox-server/foo/bar.js
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ cat dropbox-server/foo/bar.js
Hello Dropboxyzhu02-mac:dropbox-demo yzhu02$ 
```

View the file in SYNC Client:
```
cat dropbox-client/foo/bar.js
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ cat dropbox-client/foo/bar.js
Hello Dropboxyzhu02-mac:dropbox-demo yzhu02$
```


### (4) Update an existing file

Open a new terminal and:
```
cd dropbox-demo
curl -v http://127.0.0.1:8000/foo/bar.js -X POST -d "Hello Node.js "
```

API client output:
```
yzhu02-mac:dropbox-demo yzhu02$ curl -v http://127.0.0.1:8000/foo/bar.js -X POST -d "Hello Node.js "
* About to connect() to 127.0.0.1 port 8000 (#0)
*   Trying 127.0.0.1...
* Adding handle: conn: 0x7fbc8a803c00
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0x7fbc8a803c00) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
> POST /foo/bar.js HTTP/1.1
> User-Agent: curl/7.30.0
> Host: 127.0.0.1:8000
> Accept: */*
> Content-Length: 14
> Content-Type: application/x-www-form-urlencoded
> 
* upload completely sent off: 14 out of 14 bytes
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Date: Mon, 04 May 2015 01:25:54 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
< 
* Connection #0 to host 127.0.0.1 left intact
```

API Server output: 
```
POST /foo/bar.js 200 15.580 ms - -
Sent action message to connected SYNC client:
 {"action":"update","type":"file","path":"/foo/bar.js","content":"Hello Node.js ","timestamp":1430702754342}
```

SYNC Client output: 
```
Received message from SYNC server: 
{"action":"update","type":"file","path":"/foo/bar.js","content":"Hello Node.js ","timestamp":1430702754342}
Updated file: /Users/yzhu02/yzhu/trainings/nodejs/dropbox-demo/dropbox-client/foo/bar.js
```

View the file in SYNC Server:
```
cat dropbox-server/foo/bar.js
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ cat dropbox-server/foo/bar.js
Hello Node.js yzhu02-mac:dropbox-demo yzhu02$
```

View the file in SYNC Client:
```
cat dropbox-client/foo/bar.js
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ cat dropbox-client/foo/bar.js
Hello Node.js yzhu02-mac:dropbox-demo yzhu02$
```

### (5) Delete an existing file

Open a new terminal and:
```
cd dropbox-demo
curl -v http://127.0.0.1:8000/foo/bar.js -X DELETE
```

API client output:
```
yzhu02-mac:dropbox-demo yzhu02$ curl -v http://127.0.0.1:8000/foo/bar.js -X DELETE
* About to connect() to 127.0.0.1 port 8000 (#0)
*   Trying 127.0.0.1...
* Adding handle: conn: 0x7f8e0a80aa00
* Adding handle: send: 0
* Adding handle: recv: 0
* Curl_addHandleToPipeline: length: 1
* - Conn 0 (0x7f8e0a80aa00) send_pipe: 1, recv_pipe: 0
* Connected to 127.0.0.1 (127.0.0.1) port 8000 (#0)
> DELETE /foo/bar.js HTTP/1.1
> User-Agent: curl/7.30.0
> Host: 127.0.0.1:8000
> Accept: */*
> 
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Date: Mon, 04 May 2015 01:33:53 GMT
< Connection: keep-alive
< Transfer-Encoding: chunked
< 
* Connection #0 to host 127.0.0.1 left intact
```

API Server output: 
```
DELETE /foo/bar.js 200 3.111 ms - -
Sent action message to connected SYNC client:
 {"action":"delete","type":"file","path":"/foo/bar.js","content":null,"timestamp":1430703233297}
```

SYNC Client output: 
```
Received message from SYNC server: 
{"action":"delete","type":"file","path":"/foo/bar.js","content":null,"timestamp":1430703233297}
Deleted file: /Users/yzhu02/yzhu/trainings/nodejs/dropbox-demo/dropbox-client/foo/bar.js
```

Check if the file exists or not in SYNC Server:
```
ls dropbox-server/foo
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ ls dropbox-server/foo
yzhu02-mac:dropbox-demo yzhu02$
```

Check if the file exists or not in SYNC Client:
```
ls dropbox-client/foo
```
Shows:
```
yzhu02-mac:dropbox-demo yzhu02$ ls dropbox-client/foo
yzhu02-mac:dropbox-demo yzhu02$
```

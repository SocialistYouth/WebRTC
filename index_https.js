// 后台服务器程序
var express = require('express');
var app = express();
var http = require('http').createServer(app);
const fs = require('fs');

let sslOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const https = require('https').createServer(sslOptions,app);
var io = require('socket.io')(https);
//引入三个包，同时启动http服务，监听3000端口，启动监听，成功返回回调函数，在console输出内容
//路由
app.use("/static", express.static('static/'));

app.get('/',(req, res) => {
    res.sendFile(__dirname + '/index.html'); //程序根目录，成功时返回一个静态页面
})

app.get('/camera', (req, res) => {
    res.sendFile(__dirname + '/camera.html');
})
    
io.on('connection',(socket) => { //实现对socket连接，失去连接的监听
    console.log('a user connected :' +socket.id);

    socket.on('disconnect',() => {
        console.log('user disconnected :' +socket.id);
    });

    socket.on('chat message',(msg) => {
        console.log(socket.id + ' say: ' + msg);
        socket.broadcast.emit('chat message', msg); //对外广播
        //io.emit 是发送给所有建立连接的用户（同时会发送给自己）
    });
});

https.listen(443,() => {
    console.log('https listen on');
});


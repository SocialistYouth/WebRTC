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
        //某个用户断开连接的时候，我们需要告诉所有还在线的用户这个信息
        socket.broadcast.emit('userdisconnected',socket.id);
    });

    socket.on('chat message',(msg) => {
        console.log(socket.id + ' say: ' + msg);
        socket.broadcast.emit('chat message', msg); //对外广播
        //io.emit 是发送给所有建立连接的用户（同时会发送给自己）
    });

    //当有新用户加入，打招呼时，需要转发消息到所有在线用户。
    socket.on('new user greet', (data) => {
        console.log(data);
        console.log(socket.id + ' greet ' + data.msg);
        socket.broadcast.emit('need connect', {sender: socket.id, msg : data.msg});
    });
    //在线用户回应新用户消息的转发
    socket.on('ok we connect', (data) => {
        io.to(data.receiver).emit('ok we connect', {sender : data.sender});
    });

    //sdp 消息的转发
    socket.on( 'sdp', ( data ) => {
        console.log('sdp');
        console.log(data.description);
        //console.log('sdp:  ' + data.sender + '   to:' + data.to);
        socket.to( data.to ).emit( 'sdp', {
            description: data.description,
            sender: data.sender
        } );
    } );

    //candidates 消息的转发
    socket.on( 'ice candidates', ( data ) => {
        console.log('ice candidates:  ');
        console.log(data);
        socket.to( data.to ).emit( 'ice candidates', {
            candidate: data.candidate,
            sender: data.sender
        } );
    } );
});

https.listen(443,() => {
    console.log('https listen on');
});


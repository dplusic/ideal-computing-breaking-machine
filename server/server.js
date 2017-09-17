var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var nanoid = require('nanoid')

app.listen(80);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

io.on('connection', function (socket) {
    socket.emit('login', nanoid());

    socket.on('update bone', function () {
        socket.broadcast.emit('sync bone', ...arguments);
    });
});

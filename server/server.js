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
    const _id = nanoid();
    let _user = null;

    socket.on('login', function (name) {
        _user = {
            name: name,
        };

        socket.emit('login done', _id, _user);
    });

    socket.on('update bone', function () {
        socket.broadcast.emit('sync bone', _id, _user, ...arguments);
    });

    socket.on('disconnect', function() {
        socket.broadcast.emit('dismiss', _id, _user);
    });
});

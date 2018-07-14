var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var nanoid = require('nanoid')
const util = require('util');
const portastic = require('portastic');
const exitHook = require('exit-hook');
const { 'default': GameLiftServerAPI, ProcessParameters, LogParameters } = require('@dplusic/gamelift-nodejs-serversdk')

function handler (req, res) {
    let path = req.url;
    if (path === '/') {
        path = '/index.html';
    }
    fs.readFile(__dirname + path,
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading ' + path);
            }

            res.writeHead(200);
            res.end(data);
        });
}

const openServer = async (port) => {

    await util.promisify(app.listen).bind(app)(port);

    io.origins('*:*');

    let userCounter = 0;

    io.on('connection', function (socket) {
        const _id = nanoid();
        let _user = null;
        let _playerSessionId = null;
    
        socket.on('login', async function (name, playerSessionId) {
            _user = {
                name: name,
            };
            _playerSessionId = playerSessionId;

            userCounter++;

            const acceptPlayerSessionOutcome = await GameLiftServerAPI.AcceptPlayerSession(playerSessionId);
            if (!acceptPlayerSessionOutcome.Success) {
                console.error('faile to accept player session');
                return;
            }
    
            socket.emit('login done', _id, _user);
        });
    
        socket.on('update bone', function () {
            socket.broadcast.emit('sync bone', _id, _user, ...arguments);
        });
    
        socket.on('attack', function () {
            io.emit('attack', _id, _user, ...arguments);
        });
    
        socket.on('disconnect', async function() {
            if (_user == null) {
                return;
            }
            
            userCounter--;

            const removePlayerSessionOutcome = await GameLiftServerAPI.RemovePlayerSession(_playerSessionId);
            if (!removePlayerSessionOutcome) {
                console.error('fail to remove player session');
                return;
            }

            socket.broadcast.emit('dismiss', _id, _user);

            if (userCounter > 0) {
                return;
            }

            await GameLiftServerAPI.TerminateGameSession();
            await GameLiftServerAPI.ProcessEnding();
            process.exit();
        });
    });
};

const readyGameLift = async (port) => {

    exitHook(() => {
        GameLiftServerAPI.Destroy()
    });
    
    //InitSDK will establish a local connection with GameLift's agent to enable further communication.
    const initSDKOutcome = GameLiftServerAPI.InitSDK()
    if (!initSDKOutcome.Success) {
        console.error("InitSDK failure : " + initSDKOutcome.Error.toString());
        process.exit(1);
    }

    const processParameters = new ProcessParameters(
    (gameSession) => {
        //When a game session is created, GameLift sends an activation request to the game server and passes along the game session object containing game properties and other settings.
        //Here is where a game server should take action based on the game session object.
        //Once the game server is ready to receive incoming player connections, it should invoke GameLiftServerAPI.ActivateGameSession()
        GameLiftServerAPI.ActivateGameSession();
    },
    (updateGameSession) => {
        //When a game session is updated (e.g. by FlexMatch backfill), GameLiftsends a request to the game
        //server containing the updated game session object.  The game server can then examine the provided
        //matchmakerData and handle new incoming players appropriately.
        //updateReason is the reason this update is being supplied.
    },
    () => {
        //OnProcessTerminate callback. GameLift will invoke this callback before shutting down an instance hosting this game server.
        //It gives this game server a chance to save its state, communicate with services, etc., before being shut down.
        //In this case, we simply tell GameLift we are indeed going to shutdown.
        GameLiftServerAPI.ProcessEnding();
    }, 
    () => {
        //This is the HealthCheck callback.
        //GameLift will invoke this callback every 60 seconds or so.
        //Here, a game server might want to check the health of dependencies and such.
        //Simply return true if healthy, false otherwise.
        //The game server has 60 seconds to respond with its health status. GameLift will default to 'false' if the game server doesn't respond in time.
        //In this case, we're always healthy!
        return true;
    },
    port, //This game server tells GameLift that it will listen on port 7777 for incoming player connections.
    new LogParameters([
        //Here, the game server tells GameLift what set of files to upload when the game session ends.
        //GameLift will upload everything specified here for the developers to fetch later.
        '/local/game/logs/myserver.log'
    ]));

    
    //Calling ProcessReady tells GameLift this game server is ready to receive incoming game sessions!
    const processReadyOutcome = await GameLiftServerAPI.ProcessReady(processParameters);
    if (processReadyOutcome.Success)
    {
        console.log("ProcessReady success.");
    }
    else
    {
        console.error("ProcessReady failure : " + processReadyOutcome.Error.toString());
    }
};

(async () => {
    try {
        const ports = await portastic.find({
            min: 7000,
            max: 9000,
            retrieve: 1,
        });
        if (ports.length === 0) {
            process.exit(1);
        }
        const port = ports[0];

        await openServer(port);
        await readyGameLift(port);
    } catch (e) {
        console.error(e);
    }
})();

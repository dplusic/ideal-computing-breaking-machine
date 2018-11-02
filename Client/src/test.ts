import { setupGameLift } from './gamelift';
import { connectAndLogin } from './network';
import { SessionInfo } from './SessionInfo';

(async () => {
    try {
        const sessionInfo: SessionInfo = await setupGameLift();

        console.log(sessionInfo);

        const socket = await connectAndLogin(sessionInfo, 'Player Name');

        socket.on('login done', (myId: string, user: {name: string}) => {
            console.log('login done');

            socket.disconnect();
        });
    } catch (e) {
        console.error(e);
    }
})();

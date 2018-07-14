import io = require('socket.io-client');
import { SessionInfo } from "./SessionInfo";

export const connectAndLogin = (sessionInfo: SessionInfo, name: string) => {
    const socket = io(`http://${sessionInfo.ip}:${sessionInfo.port}`);

    socket.emit('login', name, sessionInfo.playerSessionId);

    return socket;
};

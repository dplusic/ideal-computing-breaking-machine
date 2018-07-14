import AWS = require('aws-sdk');
import { promisify } from 'es6-promisify';
import uuid = require('uuid');
import delay = require('delay');

export interface GameLiftSetupParam {
    endpoint?: string
}

export const setupGameLift = async (param: GameLiftSetupParam = {}) => {
    AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    AWS.config.region = process.env.AWS_REGION;

    const gameLift = new AWS.GameLift({
        endpoint: param.endpoint,
    });

    const { GameSessions: gameSessions } = await promisify(gameLift.describeGameSessions).bind(gameLift)({
        FleetId: process.env.AWS_GAMELIFT_FLEET_ID,
        StatusFilter: 'ACTIVE',
    });

    let gameSession = null;
    for (const each of gameSessions) {
        if (each.CurrentPlayerSessionCount < each.MaximumPlayerSessionCount) {
            gameSession = each;
            break;
        }
    }

    if (gameSession == null) {
        const createGameSessionRes = await promisify(gameLift.createGameSession).bind(gameLift)({
            MaximumPlayerSessionCount: 3,
            FleetId: process.env.AWS_GAMELIFT_FLEET_ID,
        });

        gameSession = createGameSessionRes.GameSession;

        while (true) {
            await delay(1000);

            const { GameSessions: gameSessions } = await promisify(gameLift.describeGameSessions).bind(gameLift)({
                GameSessionId: gameSession.GameSessionId,
            });
            if (gameSessions[0].Status === 'ACTIVE') {
                break;
            }
        }
    }

    const { PlayerSession: playerSession } = await promisify(gameLift.createPlayerSession).bind(gameLift)({
        GameSessionId: gameSession.GameSessionId,
        PlayerId: uuid.v4(),
    });
    return {
        gameSessionId: gameSession.GameSessionId,
        playerSessionId: playerSession.PlayerSessionId,
        ip: playerSession.IpAddress,
        port: playerSession.Port,
    }
};

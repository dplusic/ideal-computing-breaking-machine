# [ICBM] ideal-computing-breaking-machine

## Getting Started

### Running on Local

#### Prerequisite
* Java 8

#### Install
```sh
cd Client
npm install
cd ../server
npm install
```

#### Run GameLiftLocal
```sh
node GameLiftLocal/run.js
```

#### Start Client
```sh
cd Client

export AWS_ACCESS_KEY_ID=local
export AWS_SECRET_ACCESS_KEY=local
export AWS_REGION=us-west-1
export AWS_GAMELIFT_ENDPOINT=http://localhost:10100
export AWS_GAMELIFT_FLEET_ID=local

npm start
```

#### Start Server (Every Session)
```sh
node server/server.js
```

#### Start Game on Browser

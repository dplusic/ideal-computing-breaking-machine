import PIXI = require("pixi.js");
import "pixi-spine";
import Rescale from "pixi-rescale";
import _ = require('lodash');
import io = require('socket.io-client');
import { RESOURCE_CONFIG_URL } from "webpack-game-asset-plugin/helper";
import GOBLIN_ATLAS from "game-asset!assets/goblins_atlas.atlas";
import GOBLIN_IMAGE from "game-asset!assets/goblins_img.png";
import GOBLIN_SPINE from "game-asset!assets/goblins.json";

const app = new PIXI.Application({
    width: 1334,
    height: 750
});

Rescale(app.renderer);

document.body.appendChild(app.view);

async function load() {
    const resp = await fetch(RESOURCE_CONFIG_URL);
    const config: {[type: string]: { [key: string]: string[] } } = await resp.json();
    for (const type of _.keys(config)) {
        const items = config[type];
        for (const key of _.keys(items)) {
            const item = config[type][key];
            switch(type) {
                case "json":
                case "text":
                case "image":
                    PIXI.loader.add(
                        key, item[0], {
                            metadata: {spineAtlas: false}
                        }
                    );
            }
        }
    }

    return new Promise<void>(resolve => PIXI.loader.load(() => {
        resolve();
    }));
}

load().then(main);

const resources = PIXI.loader.resources;

function addGoblin() {
    const spineAtlas = new PIXI.spine.core.TextureAtlas(resources[GOBLIN_ATLAS].data, (__, cb) => cb(PIXI.BaseTexture.from(GOBLIN_IMAGE)));
    const spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(spineAtlas);
    const spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);
    const spineData = spineJsonParser.readSkeletonData(PIXI.loader.resources[GOBLIN_SPINE].data);
    const goblin = new PIXI.spine.Spine(spineData);
    goblin.skeleton.setSkinByName('goblin');
    goblin.position.set(app.renderer.width / 2, app.renderer.height / 2);
    goblin.autoUpdate = true;
    app.stage.addChild(goblin);
    return goblin;
}

function syncGoblin(goblin: PIXI.spine.Spine, pos: {x: number, y: number}, bones: Array<{x: number, y: number, rotation: number}>) {
    const goblinSpine = goblin;
    goblinSpine.x = pos.x;
    goblinSpine.y = pos.y;
    goblinSpine.skeleton.slots.map((e, i) => {
        const bone = bones[i];
        e.bone.x = bone.x;
        e.bone.y = bone.y;
        e.bone.rotation = bone.rotation;
    });
}

const otherGoblins: { [key:string]:PIXI.spine.Spine; } = {};

function getOtherGoblin(id: string) {
    if (id in otherGoblins) {
        return otherGoblins[id];
    } else {
        const goblin = addGoblin();
        otherGoblins[id] = goblin;
        return goblin;
    }
}

function connect(goblin: PIXI.spine.Spine) {
    const socket = io('http://192.168.0.111');

    socket.on('login', (id: string) => {
        app.ticker.add(dt => {
            const pos = {x: goblin.x, y: goblin.y};
            const bones = goblin.skeleton.slots.map(x => ({x: x.bone.x, y: x.bone.y, rotation: x.bone.rotation}));

            socket.emit('update bone', id, pos, bones);
        });
    });

    socket.on('sync bone', (id: string, pos: {x: number, y: number}, bones: Array<{x: number, y: number, rotation: number}>) => {
        const goblin = getOtherGoblin(id);
        syncGoblin(goblin, pos, bones);
    });
}

async function main() {
    const goblin = addGoblin();

    goblin.state.setAnimation(0, 'walk', true);
    goblin.x = _.random(0, 1000);

    (window as any).goblin = goblin;

    connect(goblin);
}

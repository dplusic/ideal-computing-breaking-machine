import PIXI = require("pixi.js");
import "pixi-spine";
import Rescale from "pixi-rescale";
import _ = require('lodash');
import swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';
import io = require('socket.io-client');
import { RESOURCE_CONFIG_URL } from "webpack-game-asset-plugin/helper";
import GOBLIN_ATLAS from "game-asset!assets/spineboy_atlas.atlas";
import GOBLIN_IMAGE from "game-asset!assets/spineboy_img.png";
import GOBLIN_SPINE from "game-asset!assets/spineboy.json";

const app = new PIXI.Application({
    width: 1334,
    height: 750
});
const wrap = new PIXI.Container();

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

function addGoblin(name: string) {
    const spineAtlas = new PIXI.spine.core.TextureAtlas(resources[GOBLIN_ATLAS].data, (__, cb) => cb(PIXI.BaseTexture.from(GOBLIN_IMAGE)));
    const spineAtlasLoader = new PIXI.spine.core.AtlasAttachmentLoader(spineAtlas);
    const spineJsonParser = new PIXI.spine.core.SkeletonJson(spineAtlasLoader);
    const spineData = spineJsonParser.readSkeletonData(PIXI.loader.resources[GOBLIN_SPINE].data);
    const goblin = new PIXI.spine.Spine(spineData);
    goblin.skeleton.setSkinByName('default');
    goblin.position.set(app.renderer.width / 2, app.renderer.height - 40);
    goblin.scale.x = goblin.scale.y = 0.5;
    goblin.autoUpdate = true;
    app.stage.addChild(goblin);

    const text = new PIXI.Text(name, {fontFamily : 'Arial', fontSize: 50, fill : 0xffffff, align : 'center'});
    text.anchor.set(0.5);
    text.y = -750;
    goblin.addChild(text);

    goblin.state.setAnimation(0, 'walk', true);

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

function getOtherGoblin(id: string, user?: {name: string}) {
    if (id in otherGoblins) {
        return otherGoblins[id];
    } else {
        if (user !== undefined) {
            const goblin = addGoblin(user.name);
            otherGoblins[id] = goblin;
            return goblin;
        } else {
            throw new Error("WTF");
        }
    }
}

function removeOtherGoblin(id: string) {
    delete otherGoblins[id];
}

function connect(name: string, goblin: PIXI.spine.Spine) {
    const socket = io('http://192.168.0.111');

    socket.emit('login', name);

    const button = new PIXI.Graphics();
    button.beginFill(0xFFFFFF);
    button.drawRoundedRect(-50, -50, 100, 100, 10);
    button.position.set(120, app.renderer.height - 70);
    app.stage.addChild(button);

    const button1 = new PIXI.Graphics();
    button1.beginFill(0xFFFFFF);
    button1.drawRoundedRect(-50, -50, 100, 100, 10);
    button1.position.set(app.renderer.width - 120, app.renderer.height - 70);
    app.stage.addChild(button1);

    socket.on('login done', () => {
        button.interactive = true;
        button1.interactive = true;
        button.on("pointertap", move);
        button1.on("pointertap", move);
        
        window.addEventListener("keyup", (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' ||
                e.key === 'ArrowLeft') {
                move();
            }
        });

        app.ticker.add(dt => {
            const pos = {x: goblin.x, y: goblin.y};
            const bones = goblin.skeleton.slots.map(x => ({x: x.bone.x, y: x.bone.y, rotation: x.bone.rotation}));

            socket.emit('update bone', pos, bones);
        });
    });

    socket.on('sync bone', (id: string, user: {name: string}, pos: {x: number, y: number}, bones: Array<{x: number, y: number, rotation: number}>) => {
        const goblin = getOtherGoblin(id, user);
        syncGoblin(goblin, pos, bones);
    });

    socket.on('dismiss', (id: string, user: {name: string}) => {
        const goblin = getOtherGoblin(id);
        app.stage.removeChild(goblin);
        removeOtherGoblin(id);
    });

    function move() {
        goblin.position.x += 10;
        button.position.x += 10;
        button1.position.x += 10;
        app.stage.position.x -= 10;
    }
}

function getName() {
    return swal({
        title: 'Submit your name',
        input: 'text',
        confirmButtonText: 'Submit',
        allowOutsideClick: false,
    });
}

async function main() {
    const name = await getName();

    const goblin = addGoblin(name);

    goblin.x = app.renderer.width / 2;

    (window as any).goblin = goblin;

    connect(name, goblin);
}

import PIXI = require("pixi.js");
import Rescale from "pixi-rescale";

const app = new PIXI.Application({
    width: 1334,
    height: 750
});

Rescale(app.renderer);

document.body.appendChild(app.view);


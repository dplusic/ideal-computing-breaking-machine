const path = require('path');
const wgap = require('webpack-game-asset-plugin').default;

module.exports = function() {
    return {
        entry: path.join(__dirname, "src", "entry.ts"),
        output: {
            path: path.resolve('./out'),
        },
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.js']
        },
        module: {
            loaders: [
                { test: /\.tsx?$/, exclude: /^\.#/, loader: 'ts-loader' },
            ]
        },
        plugins: [
            new wgap({
                assetRoots: [
                    "assets"
                ],
                listOut: "resources.json",
                makeAtlas: false,
                compositor: "gm",
                entryOption: "entry.json",
                collectAll: false
            })
        ]
    };
};
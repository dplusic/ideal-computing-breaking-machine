const path = require('path');
const types = require("mime-types").types;
const wgap = require('webpack-game-asset-plugin').default;

types["atlas"] = "text";

module.exports = function() {
    return {
        entry: path.join(__dirname, "src", "entry.ts"),
        output: {
            path: path.resolve('./out'),
        },
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.js'],
            alias: {
                'assets': path.join(__dirname, "assets")
            }
        },
        resolveLoader: {
            alias: {
                'game-asset': wgap.loaderPath
            }
        },
        module: {
            loaders: [
                { test: /\.tsx?$/, exclude: /^\.#/, loader: 'ts-loader' },
                {
                    // Load imported stylesheets
                    test: /\.s?css$/,
                    loaders: ['style-loader', 'css-loader']
                }
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
const path = require('path');
const types = require("mime-types").types;
const wgap = require('webpack-game-asset-plugin').default;
const webpack = require('webpack');

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
            }),
            new webpack.EnvironmentPlugin(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_GAMELIFT_ENDPOINT', 'AWS_GAMELIFT_FLEET_ID']),
        ]
    };
};
var webpack = require('webpack');

module.exports = {
    entry: './index.js',
    target: 'node',
    output: {
        path: './dist',
        filename: 'build.js',
        libraryTarget: 'umd'
    },
    devtool: 'source-map',
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            exclude: /node_modules/
        }]
    },
    plugins: []
}

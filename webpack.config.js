var webpack = require('webpack');

module.exports = {
    entry: ['./index.js'],
    target: 'node',
    output: {
        path: './dist',
        filename: 'build.js',
        library: 'PhotoView',
        libraryTarget: 'umd'
    },
    devtool: 'source-map',
    cache: true,
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            exclude: /node_modules/
        }]
    },
    plugins: [
      new webpack.DefinePlugin({
        global: {}
      })
    ]
}

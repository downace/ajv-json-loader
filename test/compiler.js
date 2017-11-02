const path = require('path');
const webpack = require('webpack');
const MemoryFs = require('memory-fs');

module.exports = (fixture, options = {}) => {
    const compiler = webpack({
        context: __dirname,
        entry: `./fixtures/${fixture}`,
        output: {
            path: path.resolve(__dirname),
            filename: 'bundle.js',
        },
        module: {
            rules: [{
                test: /\.json$/,
                use: {
                    loader: path.resolve(__dirname, '../index.js'),
                    options: options,
                }
            }]
        }
    });

    compiler.outputFileSystem = new MemoryFs();

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
            }
            resolve(stats);
        });
    });
};

import path from 'path';
import webpack from 'webpack';
import MemoryFs from 'memory-fs';

export default function compile(fixture: string, options = {}) {
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
                    loader: path.resolve(__dirname, '../dist/index.js'),
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

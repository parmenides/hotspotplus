const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: "development",
    entry: path.join(__dirname, '/src/index.ts'),
    context: path.resolve(__dirname, 'src'),
    target: "node",
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    output: {
        filename: 'log.worker.js',
        path: __dirname + '/dist',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: function (info) {
            return 'file:///' + encodeURI(info.absoluteResourcePath);
        },
    },
    watchOptions: {
        ignored: /node_modules|dist/,
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                enforce: 'pre',
                exclude: /node_modules/,
                use: {
                    loader: 'prettier-loader',
                    // force this loader to run first if it's not first in loaders list
                    // avoid running prettier on all the files!
                    // use it only on your source code and not on dependencies!
                }
            },
            {
                test: /\.ts$/,
                enforce: 'pre',
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'tslint-loader',
                        options: {
                            /* Loader options go here */
                        }
                    }
                ]
            },
            {
                test: /.ts?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            onlyCompileBundledFiles: true,
                        },
                    }
                ],
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
        /*new CleanWebpackPlugin('dist', {verbose: true})*/
    ],
    optimization: {
        nodeEnv: false,
        minimize: false,
        removeAvailableModules: false,
    },
    performance: {
        hints: false,
    },
};
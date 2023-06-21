import * as webpack from "webpack";
import * as path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const r = (file: string) => path.resolve(__dirname, file);

module.exports = {
	target: "node",
	entry: r("./src/index"),
	output: {
		path: r("./dist/src"),
		filename: "index.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	devtool: "source-map",
	/*externals: {
		typescript: "commonjs typescript",
		"typescript/lib/tsserverlibrary":
			"commonjs typescript/lib/tsserverlibrary",
	},*/
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
	node: {
		__dirname: false,
	},
	plugins: [new CleanWebpackPlugin()],
} as webpack.Configuration;

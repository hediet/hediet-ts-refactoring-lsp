import * as webpack from "webpack";
import * as path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as CopyPlugin from "copy-webpack-plugin";
import { readFileSync } from "fs";

const r = (file: string) => path.resolve(__dirname, file);

module.exports = {
	target: "node",
	entry: r("./src/index"),
	output: {
		path: r("./dist"),
		filename: "index.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode",
		fsevents: "require('fsevents')",
	},
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
	plugins: [
		new CleanWebpackPlugin(),
		includeDependency(r("../language-service-plugin/")),
	],
} as webpack.Configuration;

function includeDependency(location: string) {
	const content = readFileSync(path.join(location, "package.json"), {
		encoding: "utf8",
	});
	const pkgName = JSON.parse(content).name;

	return new CopyPlugin({
		patterns: [
			{
				from: location,
				to: r(`./node_modules/${pkgName}`),
				globOptions: {
					ignore: ["**/node_modules/**/*"],
				},
			},
		],
	});
}

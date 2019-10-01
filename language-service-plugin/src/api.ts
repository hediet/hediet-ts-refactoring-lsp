export * from "./RpcServer";
export * from "./Refactorings/RefactorProvider";
export * from "./PatternMatching";
import * as typescript from "typescript/lib/tsserverlibrary";
export { typescript };
export * from "./utils";
export * from "./Refactorings/RefactorProviderBase";
import * as types from "io-ts";

export const pluginId = "@hediet/ts-lsp";

export const configType = types.type({
	customRefactorings: types.union([
		types.undefined,
		types.type({
			dir: types.string,
			pattern: types.string,
		}),
	]),
});

export type ConfigType = typeof configType["_A"];

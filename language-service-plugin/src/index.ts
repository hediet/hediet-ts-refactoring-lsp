import * as ts from "typescript/lib/tsserverlibrary";

/*
import { enableHotReload } from "@hediet/node-reload";
if (process.env.NODE_ENV === "development") {
	require("C:\\Users\\henni\\AppData\\Local\\Yarn\\Data\\global\\node_modules\\easy-attach\\")(
		{
			eagerExitDebugProxy: true,
			debugPort: "preconfigured",
			label: "lsp",
			continue: false,
		}
	);

	enableHotReload({ entryModule: module });
}
*/

import { createLanguageServiceWithRefactorings } from "./Refactorings/createLanguageServiceWithRefactorings";

export = function init(modules: { typescript: typeof ts }) {
	return {
		create(info: ts.server.PluginCreateInfo): ts.LanguageService {
			let decorated = createLanguageServiceWithRefactorings(
				modules.typescript,
				info.languageService
			);
			return decorated;
		},
	};
};

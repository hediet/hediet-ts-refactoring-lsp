import * as ts from "typescript/lib/tsserverlibrary";
import { enableHotReload } from "@hediet/node-reload";

if (false) {
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

import { createDecoratedLanguageService } from "./createDecoratedLanguageService";

export = function init(modules: { typescript: typeof ts }) {
	return {
		create(info: ts.server.PluginCreateInfo): ts.LanguageService {
			return createDecoratedLanguageService(
				modules.typescript,
				info.languageService,
				info.project.projectService
			);
		},
	};
};

import * as ts_module from "typescript/lib/tsserverlibrary";
import { createDecoratedLanguageService } from "./createDecoratedLanguageService";

export = function init(modules: { typescript: typeof ts_module }) {
	return {
		create(info: ts.server.PluginCreateInfo): ts.LanguageService {
			return createDecoratedLanguageService(info.languageService);
		},
	};
};

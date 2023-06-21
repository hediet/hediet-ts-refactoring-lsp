import type * as ts from "typescript/lib/tsserverlibrary";

/*
import { enableHotReload } from "@hediet/node-reload";
if (process.env.NODE_ENV === "development") {
	enableHotReload({ entryModule: module });
}
*/

import {
	createLanguageServiceWithRefactorings,
	RefactorProvider,
	ComposedRefactorProvider,
} from "@hediet/ts-api-extras";
import { pluginId, configType, ConfigType } from "./api";
import { Logger } from "./Logger";
import { AddMissingArgsFromContext } from "./refactors/AddMissingArgsFromContext";

export = function init(modules: { typescript: typeof ts }) {
	let logger: Logger | undefined;

	const refactorings = new Array<RefactorProvider>();

	function updateConfig(base: ts.LanguageService, configVal: unknown) {
		let config: ConfigType;
		/*try {
			const data = configType.decode(configVal);
			ThrowReporter.report(data);
			if (data.isLeft()) {
				throw new Error();
			}
			config = data.value;
		} catch (e) {
			logger!.info(e);
			return;
		}*/
		config = configVal as ConfigType;

		refactorings.length = 0;
		refactorings.push(
			// new ConvertToStringTemplateRefactoring(modules.typescript, base),
			// new DestructureExpression(modules.typescript, base),
			new AddMissingArgsFromContext(modules.typescript, base)
		);
		/*
		if (config.customRefactorings) {
			const { dir, pattern } = config.customRefactorings;
			refactorings.push(
				new CustomRefactoringProvider(typescript, base, dir, pattern)
			);
		}*/
	}

	let base: ts.LanguageService | undefined;
	let info_: ts.server.PluginCreateInfo | undefined;
	return {
		create(info: ts.server.PluginCreateInfo): ts.LanguageService {
			info_ = info;
			logger = Logger.forPlugin(pluginId, info);
			logger.info("Create");

			base = info.languageService;

			updateConfig(base, info.config);

			const refactoringProvider = new ComposedRefactorProvider(
				refactorings
			);

			let decorated = createLanguageServiceWithRefactorings(
				modules.typescript,
				base,
				refactoringProvider
			);

			return decorated;
		},
		onConfigurationChanged(config: any) {
			if (logger) {
				logger.info("onConfigurationChanged");
			}
			updateConfig(base!, config);
		},
	};
};

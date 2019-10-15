import {
	RefactorProviderBase,
	RefactorFilter,
	RefactorCollector,
	findInnerMostNodeAt,
} from "@hediet/ts-api-extras";
import {
	hotClass,
	enableHotReload,
	registerUpdateReconciler,
} from "@hediet/node-reload";
import * as typescript from "typescript";

enableHotReload({ entryModule: module });

registerUpdateReconciler(module);

@hotClass(module)
export default class RefactorProvider extends RefactorProviderBase {
	protected collectRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter,
		collector: RefactorCollector
	): void {
		require("C:\\Users\\henni\\AppData\\Local\\Yarn\\Data\\global\\node_modules\\easy-attach\\")(
			{ debugPort: "preconfigured" }
		);

		const n = findInnerMostNodeAt(context.sourceFile, context.range.pos);

		debugger;
	}
}

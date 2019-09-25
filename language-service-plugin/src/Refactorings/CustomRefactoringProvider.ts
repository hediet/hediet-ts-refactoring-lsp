import {
	RefactorFilter,
	Refactor,
	RefactorProvider,
	ComposedRefactorProvider,
} from "./RefactorProvider";
import * as typescript from "typescript";
import * as tsNode from "ts-node";
import * as fg from "fast-glob";
import {
	registerUpdateReconciler,
	hotClass,
	enableHotReload,
} from "@hediet/node-reload";
import { join } from "path";

enableHotReload({ entryModule: module });

registerUpdateReconciler(module);

@hotClass(module)
export class CustomRefactoringProvider extends RefactorProvider {
	constructor(
		protected readonly ts: typeof typescript,
		protected readonly base: typescript.LanguageService,
		private readonly dir: string,
		private readonly pattern: string
	) {
		super();
		tsNode.register({
			compilerOptions: {
				module: "commonjs",
				target: "es6",
				outDir: "out",
				lib: ["es6"],
				sourceMap: true,
				rootDir: "src",
				strict: true,
				experimentalDecorators: true,
			},
			transpileOnly: true,
		});
	}

	getRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter
	): Refactor[] {
		const files = fg.sync(this.pattern, { cwd: this.dir });
		const refactorProviders = new Array<RefactorProvider>();
		for (const file of files) {
			try {
				const content = require(join(this.dir, file));
				const Clazz = content.default;

				const refactor = new Clazz(
					this.ts,
					this.base
				) as RefactorProvider;
				refactorProviders.push(refactor);
			} catch (e) {
				require("C:\\Users\\Henning\\AppData\\Local\\Yarn\\Data\\global\\node_modules\\easy-attach\\")(
					{ debugPort: "preconfigured" }
				);
				debugger;
			}
		}

		const composed = new ComposedRefactorProvider(refactorProviders);
		return composed.getRefactors(context, filter);
	}
}

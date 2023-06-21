import {
	RefactorFilter,
	Refactor,
	RefactorProvider,
	ComposedRefactorProvider,
} from "@hediet/ts-api-extras";
import type * as typescript from "typescript";
import * as tsNode from "ts-node";
import * as fg from "fast-glob";
import { join } from "path";

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
				const fileName = join(this.dir, file);
				const content = require(fileName);
				const Clazz = content.default;
				const refactor = new Clazz(
					this.ts,
					this.base
				) as RefactorProvider;
				refactorProviders.push(refactor);
			} catch (e) {
				debugger;
				console.error(e);
			}
		}

		const composed = new ComposedRefactorProvider(refactorProviders);
		return composed.getRefactors(context, filter);
	}
}

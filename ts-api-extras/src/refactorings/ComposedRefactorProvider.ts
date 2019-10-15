import * as typescript from "typescript";
import { RefactorProvider, RefactorFilter, Refactor } from "./RefactorProvider";

export class ComposedRefactorProvider extends RefactorProvider {
	constructor(private readonly refactorProviders: RefactorProvider[]) {
		super();
	}
	getRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter
	): Refactor[] {
		const refactors = new Array<Refactor>();

		for (const p of this.refactorProviders) {
			refactors.push(...p.getRefactors(context, filter));
		}
		return refactors;
	}
}

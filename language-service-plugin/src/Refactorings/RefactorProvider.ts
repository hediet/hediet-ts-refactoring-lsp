import * as typescript from "typescript";

export abstract class RefactorProvider {
	/**
	 * @param filter The filter that is applied to the returned refactors.
	 * Can be used for performance optimizations.
	 */
	abstract getRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter
	): Refactor[];
}

export interface RefactorFilter {
	refactorName?: string;
	actionName?: string;
}

export interface Refactor {
	name: string;
	description: string;
	actions: RefactorAction[];
}

export interface RefactorAction {
	name: string;
	description: string;
	getEdits(
		formatOptions: typescript.FormatCodeSettings,
		preferences: typescript.UserPreferences | undefined
	): typescript.RefactorEditInfo | undefined;
}

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

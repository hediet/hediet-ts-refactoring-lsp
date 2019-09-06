import * as ts from "typescript";

export abstract class RefactorProvider {
	constructor(
		protected readonly typescript: typeof ts,
		protected readonly base: ts.LanguageService
	) {}

	/**
	 * @param filter The filter that is applied to the returned refactors.
	 * Can be used for performance optimizations.
	 */
	abstract getRefactors(
		context: {
			program: ts.Program;
			positionOrRange: number | ts.TextRange;
			sourceFile: ts.SourceFile;
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
		formatOptions: ts.FormatCodeSettings,
		preferences: ts.UserPreferences | undefined
	): ts.RefactorEditInfo | undefined;
}

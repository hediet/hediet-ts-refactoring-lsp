import * as ts from "typescript";

export abstract class RefactorProvider {
	constructor(
		protected readonly typescript: typeof ts,
		protected readonly base: ts.LanguageService
	) {}

	abstract getRefactors(context: {
		program: ts.Program;
		positionOrRange: number | ts.TextRange;
		sourceFile: ts.SourceFile;
	}): Refactor[];
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

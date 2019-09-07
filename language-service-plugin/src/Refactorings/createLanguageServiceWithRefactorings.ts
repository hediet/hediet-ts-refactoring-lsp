import * as ts from "typescript/lib/tsserverlibrary";
import { ConvertToStringTemplateRefactoring } from "./ConvertToStringTemplateRefactoring";

import { registerAll } from "S:\\dev\\vscode\\vscode-debug-visualizer\\data-extraction";
registerAll();

export function createLanguageServiceWithRefactorings(
	typescript: typeof ts,
	base: ts.LanguageService
): ts.LanguageService {
	const refactoringProvider = new ConvertToStringTemplateRefactoring(
		typescript,
		base
	);

	function getContext(
		fileName: string
	): { program: ts.Program; sourceFile: ts.SourceFile } | undefined {
		const program = base.getProgram();
		if (!program) {
			return undefined;
		}
		const sourceFile = program.getSourceFile(fileName);
		if (!sourceFile) {
			return undefined;
		}
		return {
			program,
			sourceFile,
		};
	}

	return {
		...base,

		getApplicableRefactors: (fileName, positionOrRange, preferences) => {
			const existing = base.getApplicableRefactors(
				fileName,
				positionOrRange,
				preferences
			);
			const context = getContext(fileName);
			if (!context) {
				return existing;
			}
			if (typeof positionOrRange === "number") {
				positionOrRange = { pos: positionOrRange, end: positionOrRange };
			}
			const refactorings = refactoringProvider.getRefactors({
				...context,
				range: positionOrRange,
			});
			return [...refactorings, ...existing];
		},

		getEditsForRefactor: (
			fileName: string,
			formatOptions: ts.FormatCodeSettings,
			positionOrRange: number | ts.TextRange,
			refactorName: string,
			actionName: string,
			preferences: ts.UserPreferences | undefined
		): ts.RefactorEditInfo | undefined => {
			const e = base.getEditsForRefactor(
				fileName,
				formatOptions,
				positionOrRange,
				refactorName,
				actionName,
				preferences
			);
			if (e) {
				return e;
			}

			const context = getContext(fileName);
			if (!context) {
				return undefined;
			}
			if (typeof positionOrRange === "number") {
				positionOrRange = { pos: positionOrRange, end: positionOrRange };
			}
			const refactorings = refactoringProvider.getRefactors({
				...context,
				range: positionOrRange,
			});

			const r = refactorings.find(r => r.name === refactorName);
			if (!r) {
				return undefined;
			}
			const a = r.actions.find(a => a.name === actionName);
			if (!a) {
				return undefined;
			}
			return a.getEdits(formatOptions, preferences);
		},
	};
}

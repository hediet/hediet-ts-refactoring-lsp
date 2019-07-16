import * as ts from "typescript";
import { RefactoringLanguageService } from "./RefactoringLanguageService";

export function createDecoratedLanguageService(
	base: ts.LanguageService
): ts.LanguageService {
	const service = new RefactoringLanguageService(base);

	return {
		...base,

		getApplicableRefactors: (...args) => {
			const existing = base.getApplicableRefactors(...args);
			const ours = service.getApplicableRefactors(...args);
			return [...ours, ...existing];
		},

		getEditsForRefactor: (...args): ts.RefactorEditInfo | undefined => {
			return (
				base.getEditsForRefactor(...args) ||
				service.getEditsForRefactor(...args)
			);
		},
	};
}

import * as ts from "typescript/lib/tsserverlibrary";
import { RefactoringLanguageService } from "./RefactoringLanguageService";
import { RpcServer } from "./RpcServer";

export function createDecoratedLanguageService(
	typescript: typeof ts,
	base: ts.LanguageService,
	projectService?: ts.server.ProjectService
): ts.LanguageService {
	const service = new RefactoringLanguageService(typescript, base);

	const rpcServer = projectService
		? new RpcServer(typescript, projectService)
		: undefined;

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

		getQuickInfoAtPosition: (fileName, position) => {
			if (rpcServer && position === 999999999999999999 + 1) {
				return {
					kind: typescript.ScriptElementKind.unknown,
					kindModifiers: "",
					textSpan: typescript.createTextSpan(0, 0),
					documentation: [
						{ kind: "port", text: `${rpcServer.port}` },
					],
				};
			}

			const existing = base.getQuickInfoAtPosition(fileName, position);

			return existing;
		},
	};
}

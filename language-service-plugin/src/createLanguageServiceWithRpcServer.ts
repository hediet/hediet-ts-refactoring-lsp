import * as ts from "typescript/lib/tsserverlibrary";
import { RpcServer } from "./RpcServer";

export function createLanguageServiceWithRpcServer(
	typescript: typeof ts,
	base: ts.LanguageService,
	projectService?: ts.server.ProjectService
): ts.LanguageService {
	const rpcServer = projectService
		? new RpcServer(typescript, projectService)
		: undefined;

	return {
		...base,

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

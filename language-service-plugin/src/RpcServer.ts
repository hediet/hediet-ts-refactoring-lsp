import { contract, requestContract, types } from "@hediet/typed-json-rpc";
import {
	startWebSocketServer,
	WebSocketServer,
} from "@hediet/typed-json-rpc-websocket-server";
import * as ts from "typescript/lib/tsserverlibrary";
import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";

export const RpcServerContract = contract({
	server: {
		getRangeOfParentListItem: requestContract({
			params: types.type({
				fileName: types.string,
				position: types.number,
			}),
			result: types.type({ start: types.number, end: types.number }),
			error: types.type({ kind: types.literal("FileNotFound") }),
		}),
	},
	client: {},
});

registerUpdateReconciler(module);

@hotClass(module)
export class RpcServer {
	private readonly server: WebSocketServer;

	public get port(): number {
		return this.server.port;
	}

	constructor(
		private readonly typescript: typeof ts,
		private readonly projectService: ts.server.ProjectService
	) {
		this.server = startWebSocketServer({ port: 0 }, stream => {
			RpcServerContract.registerServerToStream(stream, undefined, {
				getRangeOfParentListItem: async (
					{ fileName, position },
					{ newErr }
				) => {
					const r = this.getRangeOfParentListItem(fileName, position);
					if (!r) {
						return newErr({ error: { kind: "FileNotFound" } });
					}
					return r;
				},
			});
		});
	}

	getRangeOfParentListItem(
		fileName: string,
		position: number
	): { start: number; end: number } | undefined {
		const normalized = this.typescript.server.toNormalizedPath(fileName);
		const p = this.projectService.getDefaultProjectForFile(
			normalized,
			false
		);
		if (!p) {
			return undefined;
		}

		const prog = p.getLanguageService().getProgram();
		if (!prog) {
			return undefined;
		}

		const sf = prog.getSourceFile(normalized);
		if (!sf) {
			return undefined;
		}

		const { lastArrayItem } = findLastArrayItem(sf, position);
		if (lastArrayItem) {
			return {
				start: lastArrayItem.getStart(),
				end: lastArrayItem.end,
			};
		}
		return undefined;
	}
}

export function findLastArrayItem(
	node: ts.Node,
	position: number
): { node?: ts.Node; lastArrayItem?: ts.Node } {
	if (!(node.getStart() < position && position < node.getEnd())) {
		return {};
	}
	let result: ReturnType<typeof findLastArrayItem> = { node };
	node.forEachChild(
		childNode => {
			const c = findLastArrayItem(childNode, position);
			if (c.node) {
				result = c;
			}
		},
		childArr => {
			for (const childItem of childArr) {
				const c = findLastArrayItem(childItem, position);
				if (c.node) {
					if (!c.lastArrayItem) {
						c.lastArrayItem = childItem;
					}
					result = c;
				}
			}
		}
	);

	return result;
}

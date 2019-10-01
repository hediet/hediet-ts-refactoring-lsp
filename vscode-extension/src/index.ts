import {
	ExtensionContext,
	commands,
	window,
	Position,
	Selection,
	extensions,
} from "vscode";
import {
	enableHotReload,
	registerUpdateReconciler,
	hotRequireExportedFn,
} from "@hediet/node-reload";
import { Disposable, dispose } from "@hediet/std/disposable";
import {
	RpcServerContract,
	pluginId,
	ConfigType,
} from "@hediet/ts-lsp/dist/src/api";
import { startInterval } from "@hediet/std/timer";
import { Barrier } from "@hediet/std/synchronization";
import { WebSocketStream } from "@hediet/typed-json-rpc-websocket";
import { Config } from "./Config";

if (false) {
	enableHotReload({ entryModule: module });
}
registerUpdateReconciler(module);

const typeScriptExtensionId = "vscode.typescript-language-features";

export class Extension {
	public readonly dispose = Disposable.fn();

	private connection = new Connection();

	private config = this.dispose.track(new Config());

	constructor() {
		this.dispose.track(
			commands.registerCommand(
				"hediet-ts-lsp.smarter-select",
				async () => {
					if (!window.activeTextEditor) {
						return;
					}
					const doc = window.activeTextEditor.document;
					const uri = window.activeTextEditor.document.uri;

					const pos = window.activeTextEditor.selection.active;
					const posOffset = window.activeTextEditor.document.offsetAt(
						pos
					);

					const c = await this.connection.ensureConnect();

					const range = await c.getRangeOfParentListItem({
						fileName: uri.fsPath,
						position: posOffset,
					});

					window.activeTextEditor.selection = new Selection(
						doc.positionAt(range.start),
						doc.positionAt(range.end)
					);
				}
			)
		);

		this.initialize();
	}

	async initialize(): Promise<void> {
		const extension = extensions.getExtension(typeScriptExtensionId);
		if (!extension) {
			return;
		}

		await extension.activate();
		if (!extension.exports || !extension.exports.getAPI) {
			return;
		}
		const api = extension.exports.getAPI(0) as {
			configurePlugin(id: string, config: ConfigType): void;
		};
		if (!api) {
			return;
		}

		const updateConfig = () => {
			const c = this.config.config;
			api.configurePlugin(pluginId, {
				customRefactorings: c.customRefactoringsEnabled
					? {
							dir: c.customRefactoringsDir,
							pattern: c.customRefactoringsPattern,
					  }
					: undefined,
			});
		};

		this.config.onChange.sub(() => updateConfig());
		updateConfig();
	}
}

export class Connection {
	barrier = new Barrier<typeof RpcServerContract.TServerInterface>();
	connecting = false;
	intervalDisposer: Disposable | undefined;

	public async ensureConnect(): Promise<
		typeof RpcServerContract.TServerInterface
	> {
		if (this.intervalDisposer === undefined) {
			this.intervalDisposer = startInterval(1000, () =>
				this.tryConnect()
			);
		}

		return await this.barrier.onUnlocked;
	}

	private async tryConnect() {
		if (!window.activeTextEditor) {
			return;
		}
		const uri = window.activeTextEditor.document.uri;

		const result = (await commands.executeCommand(
			"vscode.executeHoverProvider",
			uri,
			new Position(0, 999999999999999999)
		)) as { contents: { value: string }[] }[];

		if (result) {
			if (result.length > 0) {
				dispose(this.intervalDisposer);
				const portStr = result[0].contents[0].value;
				const port = parseInt(portStr);
				if (!this.connecting) {
					this.connecting = true;
					const stream = await WebSocketStream.connectTo({
						host: "localhost",
						port,
					});
					const { server } = RpcServerContract.getServerFromStream(
						stream,
						undefined,
						{}
					);
					stream.onClosed.then(() => {
						this.barrier = new Barrier<any>();
						this.connecting = false;
						this.intervalDisposer = undefined;
					});
					this.barrier.unlock(server);
				}
			}
		}
	}
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		hotRequireExportedFn(module, Extension, Extension => new Extension())
	);
}

export function deactivate() {}

import { Disposable } from "@hediet/std/disposable";
//import { ConfigType, pluginId } from "@hediet/ts-lsp/dist/src/api";
import { ExtensionContext, extensions } from "vscode";
import { Config } from "./Config";

const typeScriptExtensionId = "vscode.typescript-language-features";

export class Extension {
	public readonly dispose = Disposable.fn();

	private config = this.dispose.track(new Config());

	constructor() {
		/*
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
		);*/

		this.initialize();
	}

	async initialize(): Promise<void> {
		/*
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
		*/
	}
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(new Extension());
}

export function deactivate() {}

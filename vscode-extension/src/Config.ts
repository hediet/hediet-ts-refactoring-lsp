import { EventSource, EventEmitter } from "@hediet/std/events";
import { workspace } from "vscode";
import { Disposable } from "@hediet/std/disposable";

export class Config {
	private changeEventEmitter = new EventEmitter();
	public readonly onChange: EventSource = this.changeEventEmitter;
	public dispose = Disposable.fn();

	constructor() {
		this.dispose.track(
			workspace.onDidChangeConfiguration(() => {
				this.changeEventEmitter.emit();
			})
		);
	}

	get config() {
		return workspace.getConfiguration("hediet").get("ts-lsp") as {
			customRefactoringsEnabled: boolean;
			customRefactoringsDir: string;
			customRefactoringsPattern: string;
		};
	}
}

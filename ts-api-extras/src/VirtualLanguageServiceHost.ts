import * as ts from "typescript";

export class VirtualLanguageServiceHost implements ts.LanguageServiceHost {
	constructor(
		private readonly files: Map<string, string>,
		private readonly compilationSettings: ts.CompilerOptions
	) {}

	public getScriptFileNames(): string[] {
		return [...this.files.keys()];
	}

	public getScriptVersion(fileName: string): string {
		return "1.0"; // our files don't change
	}

	public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
		const content = this.files.get(fileName);
		if (!content) {
			return undefined;
		}
		return {
			dispose() {},
			getChangeRange: () => undefined,
			getLength: () => content.length,
			getText: (start, end) => content.substr(start, end - start),
		};
	}

	public getCompilationSettings(): ts.CompilerOptions {
		return this.compilationSettings;
	}

	public getCurrentDirectory(): string {
		return "/";
	}

	public getDefaultLibFileName(options: ts.CompilerOptions): string {
		return ts.getDefaultLibFileName(options);
	}
}

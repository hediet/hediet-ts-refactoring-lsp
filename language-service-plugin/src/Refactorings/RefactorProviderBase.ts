import * as typescript from "typescript";
import {
	RefactorProvider,
	Refactor,
	RefactorAction,
	RefactorFilter,
} from "./RefactorProvider";

export class EditBuilder {
	public readonly edits = new Array<typescript.FileTextChanges>();
	public getEdits(): typescript.RefactorEditInfo {
		return { edits: this.edits };
	}

	public replace(node: ts.Node, newText: string): void {
		this.edits.push({
			fileName: node.getSourceFile().fileName,
			isNewFile: false,
			textChanges: [
				{
					span: {
						start: node.getStart(),
						length: node.getWidth(),
					},
					newText: newText,
				},
			],
		});
	}
}

export interface RefactorActionWithEditBuilder {
	name: string;
	description: string;
	collectEdits(
		editBuilder: EditBuilder,
		formatOptions: typescript.FormatCodeSettings,
		preferences: typescript.UserPreferences | undefined
	): void;
}

export interface RefactorCollector {
	addRefactor(refactor: Refactor): void;
	addRefactorAction(
		refactorAction: RefactorAction | RefactorActionWithEditBuilder
	): void;
}

export abstract class RefactorProviderBase extends RefactorProvider {
	constructor(
		protected readonly ts: typeof typescript,
		protected readonly base: typescript.LanguageService
	) {
		super();
	}

	getRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter
	): Refactor[] {
		const result = new Array<Refactor>();
		this.collectRefactors(context, filter, {
			addRefactor(r) {
				result.push(r);
			},
			addRefactorAction(r) {
				if ("collectEdits" in r) {
					this.addRefactorAction({
						name: r.name,
						description: r.description,
						getEdits(formatOptions, preferences) {
							const builder = new EditBuilder();
							r.collectEdits(builder, formatOptions, preferences);
							return builder.getEdits();
						},
					});
				} else {
					this.addRefactor({
						actions: [r],
						description: r.description,
						name: r.name,
					});
				}
			},
		});
		return result;
	}

	protected abstract collectRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter,
		collector: RefactorCollector
	): void;
}

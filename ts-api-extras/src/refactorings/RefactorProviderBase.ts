import type * as typescript from "typescript";
import {
	RefactorProvider,
	Refactor,
	RefactorAction,
	RefactorFilter,
} from "./RefactorProvider";
import { EditBuilder } from "../EditBuilder";

export abstract class RefactorProviderBase extends RefactorProvider {
	abstract get refactorName(): string;

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
		if (filter.refactorName && filter.refactorName !== this.refactorName) {
			return [];
		}

		const result = new Array<Refactor>();
		const that = this;
		this.collectRefactors(context, filter, {
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
					result.push({
						actions: [r],
						description: "",
						name: that.refactorName,
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
	addRefactorAction(
		refactorAction: RefactorAction | RefactorActionWithEditBuilder
	): void;
}

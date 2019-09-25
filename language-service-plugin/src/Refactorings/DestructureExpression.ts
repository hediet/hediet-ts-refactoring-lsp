import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import * as typescript from "typescript";
import { findChild as findInnerMostNodeAt } from "../utils";
import { Refactor, RefactorAction, RefactorProvider } from "./RefactorProvider";

registerUpdateReconciler(module);

@hotClass(module)
export class DestructureExpression extends RefactorProvider {
	public static readonly refactoringName = "@hediet/ts-refactoring-lsp";
	public static readonly actionName = "destructureExpression";

	constructor(
		protected readonly ts: typeof typescript,
		protected readonly base: typescript.LanguageService
	) {
		super();
	}

	getRefactors(context: {
		program: typescript.Program;
		range: typescript.TextRange;
		sourceFile: typescript.SourceFile;
	}): Refactor[] {
		let child = findInnerMostNodeAt(context.sourceFile, context.range.pos);
		if (!child) {
			return [];
		}
		const statement = findParent(child, typescript.isExpressionStatement);
		if (!statement) {
			return [];
		}

		const checker = context.program.getTypeChecker();
		const type = checker.getTypeAtLocation(statement.expression);

		const propNames = type.getProperties().map(p => p.name);
		if (propNames.length === 0) {
			return [];
		}

		const action: RefactorAction = {
			description: "Destructure Expression",
			name: DestructureExpression.actionName,
			getEdits: (formatOptions, preferences) => {
				return this.getEdits(
					context.sourceFile,
					statement.getStart(),
					propNames
				);
			},
		};

		return [
			{
				name: DestructureExpression.refactoringName,
				description: "Destructure Expression",
				actions: [action],
			},
		];
	}

	private getEdits(
		sourceFile: typescript.SourceFile,
		pos: number,
		propNames: string[]
	) {
		const newText = `const { ${propNames.join(", ")} } = `;
		return {
			edits: [
				{
					fileName: sourceFile.fileName,
					isNewFile: false,
					textChanges: [
						{
							newText,
							span: {
								start: pos,
								length: 0,
							},
						},
					],
				},
			],
		};
	}
}

function findParent<T extends typescript.Node>(
	item: typescript.Node,
	test: (item: typescript.Node) => item is T
): T | undefined {
	let cur: typescript.Node | undefined = item;
	while (item) {
		if (test(item)) {
			return item;
		}
		item = item.parent;
	}
	return undefined;
}

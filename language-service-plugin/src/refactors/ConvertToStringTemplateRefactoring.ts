import type * as typescript from "typescript";
import {
	Refactor,
	RefactorAction,
	RefactorProvider,
	findInnerMostNodeAt,
} from "@hediet/ts-api-extras";

export class ConvertToStringTemplateRefactoring extends RefactorProvider {
	public static readonly refactoringName = "@hediet/ts-refactoring-lsp";
	public static readonly actionName = "convertToStringTemplate";

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
		const node = this.getSuitableOuterMostParent(child);
		const parts = this.getParts(node);
		if (parts.kind !== "stringLiteralSequence") {
			return [];
		}

		const action: RefactorAction = {
			description: "Convert to String Template",
			name: ConvertToStringTemplateRefactoring.actionName,
			getEdits: (formatOptions, preferences) => {
				return this.getEdits(context.sourceFile, node, parts.parts);
			},
		};

		return [
			{
				name: ConvertToStringTemplateRefactoring.refactoringName,
				description: "Convert to String Template",
				actions: [action],
			},
		];
	}

	private getSuitableOuterMostParent(n: typescript.Node): typescript.Node {
		while (
			n.parent &&
			((this.ts.isBinaryExpression(n.parent) &&
				n.parent.operatorToken.kind === this.ts.SyntaxKind.PlusToken) ||
				this.ts.isParenthesizedExpression(n.parent))
		) {
			n = n.parent;
		}

		return n;
	}

	private getParts(node: typescript.Node):
		| {
				kind: "stringLiteralSequence";
				parts: (
					| typescript.Node
					| { kind: "stringPart"; text: string }
				)[];
		  }
		| { kind: "node"; parts: [typescript.Node] } {
		if (this.ts.isStringLiteral(node)) {
			return {
				kind: "stringLiteralSequence",
				parts: [{ kind: "stringPart", text: node.text }],
			};
		} else if (this.ts.isBinaryExpression(node)) {
			const p1 = this.getParts(node.left);
			const p2 = this.getParts(node.right);
			if (p1.kind === "node" && p2.kind === "node") {
				return { kind: "node", parts: [node] };
			}
			return {
				kind: "stringLiteralSequence",
				parts: new Array<
					typescript.Node | { kind: "stringPart"; text: string }
				>().concat(p1.parts, p2.parts),
			};
		} else if (this.ts.isParenthesizedExpression(node)) {
			return this.getParts(node.expression);
		}

		return { kind: "node", parts: [node] };
	}

	private getEdits(
		sourceFile: typescript.SourceFile,
		node: typescript.Node,
		parts: (typescript.Node | { kind: "stringPart"; text: string })[]
	) {
		const body = parts
			.map((p) =>
				p.kind === "stringPart" ? p.text : `\${${p.getText()}}`
			)
			.join("");

		const fullText = sourceFile.getFullText();
		const textBefore = fullText.substring(node.pos, node.getStart());
		const textAfter = fullText.substring(node.getEnd(), node.end);
		const newText = `${textBefore}\`${body}\`${textAfter}`;

		return {
			edits: [
				{
					fileName: sourceFile.fileName,
					isNewFile: false,
					textChanges: [
						{
							newText,
							span: {
								start: node.pos,
								length: node.end - node.pos,
							},
						},
					],
				},
			],
		};
	}
}

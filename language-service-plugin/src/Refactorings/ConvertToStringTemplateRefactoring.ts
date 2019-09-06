import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import * as ts from "typescript";
import { findChild } from "../utils";
import { RefactorProvider, Refactor } from "./RefactorProvider";

registerUpdateReconciler(module);

@hotClass(module)
export class ConvertToStringTemplateRefactoring extends RefactorProvider {
	public static readonly refactoringName = "@hediet/ts-refactoring-lsp";
	public static readonly convertToStringTemplate = "convertToStringTemplate";

	getRefactors(context: {
		program: ts.Program;
		positionOrRange: number | ts.TextRange;
		sourceFile: ts.SourceFile;
	}): Refactor[] {
		let positionOrRange = context.positionOrRange;
		if (typeof positionOrRange !== "number") {
			positionOrRange = positionOrRange.pos;
		}
		const n = this.findTopMostNode(context.sourceFile, positionOrRange);

		if (!n) {
			return [];
		}

		const r = this.getParts(n);
		if (r.kind !== "sequence") {
			return [];
		}

		return [
			{
				name: ConvertToStringTemplateRefactoring.refactoringName,
				description: "Convert to String Template",
				actions: [
					{
						description: "Convert to String Template",
						name:
							ConvertToStringTemplateRefactoring.convertToStringTemplate,
						getEdits: (formatOptions, preferences) => {
							return this.getEdits(
								context.sourceFile,
								n,
								r.parts
							);
						},
					},
				],
			},
		];
	}

	private findTopMostNode(
		sf: ts.SourceFile,
		position: number
	): ts.Node | undefined {
		let n = findChild(sf, position);
		if (!n) {
			return undefined;
		}

		while (
			n.parent &&
			((this.typescript.isBinaryExpression(n.parent) &&
				n.parent.operatorToken.kind ===
					this.typescript.SyntaxKind.PlusToken) ||
				this.typescript.isParenthesizedExpression(n.parent))
		) {
			n = n.parent;
		}

		return n;
	}

	private getParts(
		node: ts.Node
	):
		| {
				kind: "sequence";
				parts: (ts.Node | { kind: "stringPart"; text: string })[];
		  }
		| { kind: "node"; parts: [ts.Node] } {
		if (this.typescript.isStringLiteral(node)) {
			return {
				kind: "sequence",
				parts: [{ kind: "stringPart", text: node.text }],
			};
		} else if (this.typescript.isBinaryExpression(node)) {
			const p1 = this.getParts(node.left);
			const p2 = this.getParts(node.right);
			if (p1.kind === "node" && p2.kind === "node") {
				return { kind: "node", parts: [node] };
			}
			return {
				kind: "sequence",
				parts: new Array<
					ts.Node | { kind: "stringPart"; text: string }
				>().concat(p1.parts, p2.parts),
			};
		} else if (this.typescript.isParenthesizedExpression(node)) {
			return this.getParts(node.expression);
		}

		return { kind: "node", parts: [node] };
	}

	private getEdits(
		sourceFile: ts.SourceFile,
		node: ts.Node,
		parts: (ts.Node | { kind: "stringPart"; text: string })[]
	) {
		const body = parts
			.map(p => (p.kind === "stringPart" ? p.text : `\${${p.getText()}}`))
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

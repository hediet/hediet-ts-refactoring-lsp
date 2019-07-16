import * as ts from "typescript";
import {
	hotClass,
	enableHotReload,
	registerUpdateReconciler,
} from "@hediet/node-reload";

if (false) {
	enableHotReload({ entryModule: module });
}
registerUpdateReconciler(module);

export const refactoringName = "@hediet/ts-refactoring-lsp";

export const convertStringConcatenationToStringTemplate =
	"convertStringConcatenationToStringTemplate";

@hotClass(module)
export class RefactoringLanguageService {
	constructor(private readonly base: ts.LanguageService) {}

	getApplicableRefactors(
		fileName: string,
		positionOrRange: number | ts.TextRange,
		preferences: ts.UserPreferences | undefined
	): ts.ApplicableRefactorInfo[] {
		const c = this.getContext(fileName);
		if (!c) {
			return [];
		}
		if (typeof positionOrRange !== "number") {
			positionOrRange = positionOrRange.pos;
		}

		const n = this.findTopStringLiteralConcatNode(
			c.sourceFile,
			positionOrRange
		);
		if (!n) {
			return [];
		}
		return [
			{
				name: convertStringConcatenationToStringTemplate,
				description: "Convert to String Template",
				actions: [
					{
						description: "Convert to String Template",
						name: convertStringConcatenationToStringTemplate,
					},
				],
			},
		];
	}

	getEditsForRefactor(
		fileName: string,
		formatOptions: ts.FormatCodeSettings,
		positionOrRange: number | ts.TextRange,
		refactorName: string,
		actionName: string,
		preferences: ts.UserPreferences | undefined
	): ts.RefactorEditInfo | undefined {
		const c = this.getContext(fileName);
		if (!c) {
			return undefined;
		}
		if (typeof positionOrRange !== "number") {
			positionOrRange = positionOrRange.pos;
		}

		const n = this.findTopStringLiteralConcatNode(
			c.sourceFile,
			positionOrRange
		);
		if (!n) {
			return undefined;
		}

		const body = n.parts
			.map(p => (p.kind === "stringPart" ? p.text : `\${${p.getText()}}`))
			.join("");

		const fullText = c.sourceFile.getFullText();
		const textBefore = fullText.substring(n.node.pos, n.node.getStart());
		const textAfter = fullText.substring(n.node.getEnd(), n.node.end);
		const newText = `${textBefore}\`${body}\`${textAfter}`;

		return {
			edits: [
				{
					fileName: fileName,
					isNewFile: false,
					textChanges: [
						{
							newText,
							span: {
								start: n.node.pos,
								length: n.node.end - n.node.pos,
							},
						},
					],
				},
			],
		};
	}

	private getContext(
		fileName: string
	): { program: ts.Program; sourceFile: ts.SourceFile } | undefined {
		const program = this.base.getProgram();
		if (!program) {
			return undefined;
		}
		const sourceFile = program.getSourceFile(fileName);
		if (!sourceFile) {
			return undefined;
		}
		return {
			program,
			sourceFile,
		};
	}

	private findTopStringLiteralConcatNode(
		sf: ts.SourceFile,
		position: number
	):
		| {
				node: ts.Node;
				parts: (ts.Node | { kind: "stringPart"; text: string })[];
		  }
		| undefined {
		let n = this.findChild(sf, position);
		if (!n) {
			return undefined;
		}

		while (
			n.parent &&
			(ts.isBinaryExpression(n.parent) ||
				ts.isParenthesizedExpression(n.parent))
		) {
			n = n.parent;
		}

		const parts = new Array<
			ts.Node | { kind: "stringPart"; text: string }
		>();
		if (this.classifyStringLiteral(n, parts) === "stringSequence") {
			return { node: n, parts };
		}

		return undefined;
	}

	private classifyStringLiteral(
		node: ts.Node,
		parts: (ts.Node | { kind: "stringPart"; text: string })[]
	): "stringSequence" | "argument" {
		if (ts.isStringLiteral(node)) {
			parts.push({ kind: "stringPart", text: node.text });
			return "stringSequence";
		} else if (ts.isBinaryExpression(node)) {
			const p1 = this.classifyStringLiteral(node.left, parts);
			if (p1 === "argument") {
				return "argument";
			}
			const p2 = this.classifyStringLiteral(node.right, parts);
			if (p2 === "argument") {
				parts.push(node.right);
			}
			return "stringSequence";
		} else if (ts.isParenthesizedExpression(node)) {
			return this.classifyStringLiteral(node.expression, parts);
		}

		return "argument";
	}

	private findChild(node: ts.Node, position: number): ts.Node | undefined {
		if (!(node.getStart() < position && position < node.getEnd())) {
			return undefined;
		}
		let result: ts.Node = node;
		node.forEachChild(
			node => {
				const c = this.findChild(node, position);
				if (c) {
					result = c;
				}
			},
			arr => {
				for (const item of arr) {
					const c = this.findChild(item, position);
					if (c) {
						result = c;
					}
				}
			}
		);

		return result;
	}
}

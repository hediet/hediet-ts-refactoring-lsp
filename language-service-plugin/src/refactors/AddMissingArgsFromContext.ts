import {
	findInnerMostNodeAt,
	RefactorCollector,
	RefactorFilter,
	RefactorProviderBase,
} from "@hediet/ts-api-extras";
import { distance } from "fastest-levenshtein";
import type * as typescript from "typescript";

export class AddMissingArgsFromContext extends RefactorProviderBase {
	public static readonly refactoringName = "@hediet/ts-refactoring-lsp";
	public static readonly actionName = "addMissingArgsFromContext";

	override readonly refactorName = AddMissingArgsFromContext.refactoringName;

	protected collectRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter,
		collector: RefactorCollector
	): void {
		const node = findInnerMostNodeAt(context.sourceFile, context.range.pos);
		if (!node) {
			return;
		}
		const invocationExpr = node.parent;
		if (
			!this.ts.isCallExpression(invocationExpr) &&
			!this.ts.isNewExpression(invocationExpr)
		) {
			return;
		}

		const checker = context.program.getTypeChecker() as TypeChecker2;
		const signature = checker.getResolvedSignature(invocationExpr);
		if (!signature) {
			return;
		}

		const args = invocationExpr.arguments;
		if (!args) {
			return;
		}
		const augmentedArgs = new Array<{
			parameter: typescript.Symbol;
			parameterType: typescript.Type;
			argument?: typescript.Expression | string;
		}>();

		let i = 0;
		for (const param of signature.parameters) {
			const paramType = checker.getTypeOfSymbol(param);
			if (i < args.length) {
				const typeOfArg = checker.getTypeAtLocation(args[i]);
				if (checker.isTypeAssignableTo(typeOfArg, paramType)) {
					augmentedArgs.push({
						parameter: param,
						parameterType: paramType,
						argument: args[i],
					});
					i++;
					continue;
				}
			}

			augmentedArgs.push({
				parameter: param,
				parameterType: paramType,
				argument: undefined,
			});
		}

		if (i !== args.length) {
			// Not all provided args are assignable to a subsequence of parameters. Abort.
			return;
		}

		const candidatesProvider = new CandidateProvider(
			checker,
			invocationExpr,
			this.ts
		);
		for (const arg of augmentedArgs) {
			if (arg.argument !== undefined) {
				continue;
			}

			const candidates = candidatesProvider.getCandidates(
				arg.parameterType
			);
			const bestCandidate = findMinBy(candidates, (c) =>
				distance(c, arg.parameter.getName())
			);
			if (bestCandidate) {
				arg.argument = bestCandidate;
			} else {
				// Cannot fill argument
				return;
			}
		}

		collector.addRefactorAction({
			name: AddMissingArgsFromContext.actionName,
			description: "Fix missing parameters from context",
			collectEdits: (editBuilder) => {
				const newText = augmentedArgs
					.map((a) => {
						if (typeof a.argument === "string") {
							return a.argument;
						} else if (a.argument) {
							return a.argument.getFullText(context.sourceFile);
						}
					})
					.join(", ");

				editBuilder.replaceArray(args, newText, context.sourceFile);
			},
		});
	}
}

class CandidateProvider {
	private readonly symbolsInScope = this.checker.getSymbolsInScope(
		this.context,
		this.ts.SymbolFlags.Value
	);
	private readonly thisType = this.checker.tryGetThisTypeAt(this.context);

	constructor(
		private readonly checker: TypeChecker2,
		private readonly context: typescript.Node,
		private readonly ts: typeof typescript
	) {}

	getCandidates(expectedType: typescript.Type): string[] {
		const result = new Array<string>();

		if (this.thisType) {
			if (this.checker.isTypeAssignableTo(this.thisType, expectedType)) {
				result.push(`this`);
			}

			for (const property of this.thisType.getProperties()) {
				const propertyType = this.checker.getTypeOfSymbol(property);
				if (
					this.checker.isTypeAssignableTo(propertyType, expectedType)
				) {
					result.push(`this.` + property.getName());
				}
			}
		}

		for (const symbol of this.symbolsInScope) {
			if (!symbol.declarations) {
				continue;
			}
			if (
				!symbol.declarations.every(
					(d) => d.getSourceFile() === this.context.getSourceFile()
				)
			) {
				continue;
			}

			const symbolType = this.checker.getTypeOfSymbol(symbol);
			if (this.checker.isTypeAssignableTo(symbolType, expectedType)) {
				result.push(symbol.getName());
			}
		}

		return result;
	}
}

interface TypeChecker2 extends typescript.TypeChecker {
	tryGetThisTypeAt(node: typescript.Node): typescript.Type | undefined;
	getTypeOfSymbol(node: typescript.Symbol): typescript.Type;
	isTypeAssignableTo(
		source: typescript.Type,
		target: typescript.Type
	): boolean;
}

function findMinBy<T>(arr: T[], selector: (item: T) => number): T | undefined {
	let min: T | undefined;
	let minValue: number | undefined;
	for (const item of arr) {
		const value = selector(item);
		if (minValue === undefined || value < minValue) {
			min = item;
			minValue = value;
		}
	}
	return min;
}

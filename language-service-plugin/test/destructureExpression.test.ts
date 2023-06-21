import "./setup";
import {
	testSingleFileLanguageService,
	expectRefactoring,
	expectNoRefactoring,
} from "@hediet/ts-api-extras/dist/src/test-utils";
import { createLanguageServiceWithRefactorings } from "@hediet/ts-api-extras";
import ts = require("typescript/lib/tsserverlibrary");
import { DestructureExpression } from "../src/refactors/DestructureExpression";

describe("destructureExpression", () => {
	const action = {
		refactoringName: DestructureExpression.refactoringName,
		actionName: DestructureExpression.actionName,
	};

	const decorateWithRefactorings = (base: ts.LanguageService) =>
		createLanguageServiceWithRefactorings(
			ts,
			base,
			new DestructureExpression(ts, base)
		);

	describe("Expect Refactoring", () => {
		testSingleFileLanguageService(
			`
interface Foo { bla: string; }
const x: Foo = null!;
x|;
`,
			decorateWithRefactorings,
			expectRefactoring(
				action,
				`
interface Foo { bla: string; }
const x: Foo = null!;
const { bla } = x;
`
			)
		);

		testSingleFileLanguageService(
			`
interface Foo { bla: string; foo: number; baz: Foo; }
const x: Foo = null!;
x.baz.baz|;
`,
			decorateWithRefactorings,
			expectRefactoring(
				action,
				`
interface Foo { bla: string; foo: number; baz: Foo; }
const x: Foo = null!;
const { bla, foo, baz } = x.baz.baz;
`
			)
		);

		testSingleFileLanguageService(
			`
interface Foo { bla: string; foo: number; baz: Foo; }
const x: Foo = null!;
x.baz.baz|
x
`,
			decorateWithRefactorings,
			expectRefactoring(
				action,
				`
interface Foo { bla: string; foo: number; baz: Foo; }
const x: Foo = null!;
const { bla, foo, baz } = x.baz.baz
x
`
			)
		);
	});
});

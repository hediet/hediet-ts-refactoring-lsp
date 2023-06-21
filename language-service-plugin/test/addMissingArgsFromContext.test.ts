import "./setup";
import {
	testSingleFileLanguageService,
	expectRefactoring,
	expectNoRefactoring,
} from "@hediet/ts-api-extras/dist/src/test-utils";
import { createLanguageServiceWithRefactorings } from "@hediet/ts-api-extras";
import ts = require("typescript/lib/tsserverlibrary");
import { AddMissingArgsFromContext } from "../src/refactors/AddMissingArgsFromContext";

describe("convertToStringTemplate", () => {
	const action = {
		refactoringName: AddMissingArgsFromContext.refactoringName,
		actionName: AddMissingArgsFromContext.actionName,
	};

	const decorateWithRefactorings = (base: ts.LanguageService) =>
		createLanguageServiceWithRefactorings(
			ts,
			base,
			new AddMissingArgsFromContext(ts, base)
		);

	describe("Expect Refactoring", () => {
		testSingleFileLanguageService(
			`
				class Test {
					constructor(a: string, b: string) {}
				}
				const aStr = 'a';
				const bStr = 'b';
				new Te|st();
			`,
			decorateWithRefactorings,
			expectRefactoring(
				action,
				`
				class Test {
					constructor(a: string, b: string) {}
				}
				const aStr = 'a';
				const bStr = 'b';
				new Test(aStr, bStr);
			`
			)
		);
	});

	describe("Expect No Refactoring", () => {});
});

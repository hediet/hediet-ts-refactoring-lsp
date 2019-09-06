process.env.NODE_ENV = "development";

import {
	testSingleFileLanguageService,
	expectRefactoring,
	expectNoRefactoring,
} from "./utils";
import { ConvertToStringTemplateRefactoring } from "../src/Refactorings/ConvertToStringTemplateRefactoring";
import { createLanguageServiceWithRefactorings } from "../src/Refactorings/createLanguageServiceWithRefactorings";
import ts = require("typescript/lib/tsserverlibrary");

describe("convertToStringTemplate", () => {
	const action = {
		refactoringName: ConvertToStringTemplateRefactoring.refactoringName,
		actionName: ConvertToStringTemplateRefactoring.convertToStringTemplate,
	};

	const decorateWithRefactorings = (base: ts.LanguageService) =>
		createLanguageServiceWithRefactorings(ts, base);

	describe("Expect Refactoring", () => {
		testSingleFileLanguageService(
			`const str = "|hello";`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `hello`;")
		);
		testSingleFileLanguageService(
			`const str = "hello|";`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `hello`;")
		);
		testSingleFileLanguageService(
			`const str = "hello" |+ i;`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `hello${i}`;")
		);
		testSingleFileLanguageService(
			`const str = i |+ "hello";`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `${i}hello`;")
		);
		testSingleFileLanguageService(
			`const str = ("hello" |+ i) + 1;`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `hello${i}${1}`;")
		);
		testSingleFileLanguageService(
			`const str = "hello" |+ (i + 1);`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `hello${i + 1}`;")
		);
		testSingleFileLanguageService(
			`const str = (1 + "hello" |+ i) + 1;`,
			decorateWithRefactorings,
			expectRefactoring(action, "const str = `${1}hello${i}${1}`;")
		);
	});

	describe("Expect No Refactoring", () => {
		testSingleFileLanguageService(
			`const str = "test";|`,
			decorateWithRefactorings,
			expectNoRefactoring(action.refactoringName)
		);
		testSingleFileLanguageService(
			`const str = 1 +| 1;`,
			decorateWithRefactorings,
			expectNoRefactoring(action.refactoringName)
		);
	});
});

/*
describe("should support convertMethodToField", () => {
	const action = {
		refactoringName,
		actionName: convertMethodToField,
	};

	testSingleFileLanguageService(
		`class Test {
tes|t1(arg: string): void {
	console.log("foo");
}

test2 = () => {
	console.log("foo");
};

test3 = () => console.log("foo");
}`,
		expectRefactoring(action, "const str = `hello${(i + 1)}`;")
	);
});
*/

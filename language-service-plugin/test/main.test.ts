process.env.NODE_ENV = "development";

import {
	testSingleFileLanguageService,
	expectRefactoring,
	expectNoRefactoring,
} from "./utils";
import { ConvertToStringTemplateRefactoringProvider } from "../src/Refactorings/ConvertToStringTemplateRefactoringProvider";

describe("convertToStringTemplate", () => {
	const action = {
		refactoringName:
			ConvertToStringTemplateRefactoringProvider.refactoringName,
		actionName:
			ConvertToStringTemplateRefactoringProvider.convertToStringTemplate,
	};

	describe("Expect Refactoring", () => {
		testSingleFileLanguageService(
			`const str = "|hello";`,
			expectRefactoring(action, "const str = `hello`;")
		);
		testSingleFileLanguageService(
			`const str = "hello|";`,
			expectRefactoring(action, "const str = `hello`;")
		);
		testSingleFileLanguageService(
			`const str = "hello" |+ i;`,
			expectRefactoring(action, "const str = `hello${i}`;")
		);
		testSingleFileLanguageService(
			`const str = i |+ "hello";`,
			expectRefactoring(action, "const str = `${i}hello`;")
		);
		testSingleFileLanguageService(
			`const str = ("hello" |+ i) + 1;`,
			expectRefactoring(action, "const str = `hello${i}${1}`;")
		);
		testSingleFileLanguageService(
			`const str = "hello" |+ (i + 1);`,
			expectRefactoring(action, "const str = `hello${i + 1}`;")
		);
		testSingleFileLanguageService(
			`const str = (1 + "hello" |+ i) + 1;`,
			expectRefactoring(action, "const str = `${1}hello${i}${1}`;")
		);
	});

	describe("Expect No Refactoring", () => {
		testSingleFileLanguageService(
			`const str = "test";|`,
			expectNoRefactoring(action.refactoringName)
		);
		testSingleFileLanguageService(
			`const str = 1 +| 1;`,
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

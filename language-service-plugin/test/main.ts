import { expect } from "chai";
import * as ts from "typescript";
import { createDecoratedLanguageService } from "../src/createDecoratedLanguageService";
import { MockLanguageServiceHost } from "./MockLanguageServiceHost";
import { stripMarkers, applyTextChange } from "./utils";
import {
	convertStringConcatenationToStringTemplate,
	refactoringName,
} from "../src/RefactoringLanguageService";

describe("Refactoring", () => {
	it("should refactor correctly", async () => {
		const action = {
			refactoringName,
			actionName: convertStringConcatenationToStringTemplate,
		};

		testSingleFileService(
			`const str = "hello" |+ (i + 1);`,
			expectRefactored(action, "const str = `hello${(i + 1)}`;")
		);
		testSingleFileService(
			`const str = "|hello";`,
			expectRefactored(action, "const str = `hello`;")
		);
		testSingleFileService(
			`const str = "hello|";`,
			expectRefactored(action, "const str = `hello`;")
		);
		testSingleFileService(
			`const str = ("hello" |+ i) + 1;`,
			expectRefactored(action, "const str = `hello${i}${1}`;")
		);
		testSingleFileService(
			`const str = "test";|`,
			expectNotRefactored(refactoringName)
		);
		testSingleFileService(
			`const str = (1 + "hello" |+ i) + 1;`,
			expectNotRefactored(refactoringName)
		);
	});
});

type TestFn = (
	service: ts.LanguageService,
	markers: number[],
	mainFile: { name: string; content: string }
) => void;

function testSingleFileService(content: string, fn: TestFn): void {
	const main = stripMarkers(content);
	const filename = "main.ts";
	const files = new Map<string, string>();
	files.set(filename, main.stripped);

	const serviceHost = new MockLanguageServiceHost(files, {});
	const baseService = ts.createLanguageService(
		serviceHost,
		ts.createDocumentRegistry()
	);

	const service = createDecoratedLanguageService(baseService);

	fn(service, main.markers, { name: filename, content: main.stripped });
}

const expectRefactored = (
	refactoringAction: { refactoringName: string; actionName: string },
	expectedSrc: string
): TestFn => (service, markers, mainFile) => {
	const info = service.getApplicableRefactors(
		mainFile.name,
		markers[0],
		undefined
	);

	const refactoring = info.find(
		i => i.name == refactoringAction.refactoringName
	)!;
	expect(refactoring).not.to.be.undefined;

	const action = refactoring.actions.find(
		a => a.name === refactoringAction.actionName
	)!;
	expect(action).not.to.be.undefined;

	const edit = service.getEditsForRefactor(
		mainFile.name,
		ts.getDefaultFormatCodeSettings(),
		markers[0],
		refactoring.name,
		action.name,
		undefined
	);

	if (!edit) {
		throw new Error("edit must no be undefined");
	}

	expect(edit.edits.length).to.eq(1);
	const e = edit.edits[0];
	expect(e.fileName).to.eq(mainFile.name);

	const result = applyTextChange(mainFile.content, e.textChanges);
	expect(result).to.equal(expectedSrc);
};

const expectNotRefactored = (refactoringName: string): TestFn => (
	service,
	markers,
	mainFile
) => {
	const info = service.getApplicableRefactors(
		mainFile.name,
		markers[0],
		undefined
	);

	const refactoring = info.find(i => i.name == refactoringName)!;
	expect(refactoring).to.be.undefined;
};

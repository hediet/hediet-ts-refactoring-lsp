process.env.NODE_ENV = "development";
import { MockLanguageServiceHost } from "./MockLanguageServiceHost";
import ts = require("typescript/lib/tsserverlibrary");
import { expect } from "chai";

export function stripMarkers(
	src: string
): { stripped: string; markers: number[] } {
	let stripped = "";
	const markers = new Array<number>();
	let i = 0;
	let first = true;
	for (const part of src.split("|")) {
		if (first) {
			first = false;
		} else {
			markers.push(i);
		}
		stripped += part;
		i += stripped.length;
	}
	return {
		stripped,
		markers,
	};
}

export function applyTextChange(str: string, changes: ts.TextChange[]): string {
	let result = str;
	const c = changes.sort((a, b) => a.span.start - b.span.start);
	for (const x of c) {
		result =
			result.substr(0, x.span.start) +
			x.newText +
			result.substr(x.span.start + x.span.length);
	}
	return result;
}

type TestFn = (
	service: ts.LanguageService,
	markers: number[],
	mainFile: { name: string; content: string }
) => void;

/**
 * Describes a test for a given content with markers.
 * Prepares services and calles `testFn` to do the actual testing.
 */
export function testSingleFileLanguageService(
	content: string,
	decorator: (base: ts.LanguageService) => ts.LanguageService,
	testFn: TestFn
): void {
	it(content.replace(/(\n| )+/g, " "), () => {
		const main = stripMarkers(content);
		const mainFile = { name: "main.ts", content: main.stripped };
		const files = new Map<string, string>([
			[mainFile.name, mainFile.content],
		]);
		const serviceHost = new MockLanguageServiceHost(files, {});
		const baseService = ts.createLanguageService(
			serviceHost,
			ts.createDocumentRegistry()
		);
		const decoratedService = decorator(baseService);
		testFn(decoratedService, main.markers, mainFile);
	});
}

export const expectRefactoring = (
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

export const expectNoRefactoring = (refactoringName: string): TestFn => (
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

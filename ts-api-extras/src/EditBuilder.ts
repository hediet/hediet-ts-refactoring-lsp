import type * as typescript from "typescript";

export class EditBuilder {
	public readonly edits = new Array<typescript.FileTextChanges>();
	public getEdits(): typescript.RefactorEditInfo {
		return { edits: this.edits };
	}

	public insert(pos: number, sf: typescript.SourceFile, text: string): void {
		this.edits.push({
			fileName: sf.fileName,
			isNewFile: false,
			textChanges: [
				{
					span: {
						start: pos,
						length: 0,
					},
					newText: text,
				},
			],
		});
	}

	public replaceArray(
		node: typescript.NodeArray<any>,
		newText: string,
		sourceFile: typescript.SourceFile
	): void {
		this.edits.push({
			fileName: sourceFile.fileName,
			isNewFile: false,
			textChanges: [
				{
					span: {
						start: node.pos,
						length: node.end - node.pos,
					},
					newText: newText,
				},
			],
		});
	}

	public replace(node: typescript.Node, newText: string): void {
		this.edits.push({
			fileName: node.getSourceFile().fileName,
			isNewFile: false,
			textChanges: [
				{
					span: {
						start: node.getStart(),
						length: node.getWidth(),
					},
					newText: newText,
				},
			],
		});
	}
}

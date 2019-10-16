import * as typescript from "typescript";

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

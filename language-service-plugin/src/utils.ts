export function findChild(
	node: ts.Node,
	position: number
): ts.Node | undefined {
	if (!(node.getStart() < position && position < node.getEnd())) {
		return undefined;
	}
	let result: ts.Node = node;
	node.forEachChild(
		node => {
			const c = findChild(node, position);
			if (c) {
				result = c;
			}
		},
		arr => {
			for (const item of arr) {
				const c = findChild(item, position);
				if (c) {
					result = c;
				}
			}
		}
	);

	return result;
}

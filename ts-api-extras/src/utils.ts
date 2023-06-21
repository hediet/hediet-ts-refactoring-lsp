import type * as ts from "typescript";

export function findInnerMostNodeAt(
	node: ts.Node,
	position: number
): ts.Node | undefined {
	if (!(node.getStart() <= position && position <= node.getEnd())) {
		return undefined;
	}
	let result: ts.Node = node;
	node.forEachChild(
		(node) => {
			const c = findInnerMostNodeAt(node, position);
			if (c) {
				result = c;
			}
		},
		(arr) => {
			for (const item of arr) {
				const c = findInnerMostNodeAt(item, position);
				if (c) {
					result = c;
				}
			}
		}
	);

	return result;
}

export function findAncestor(
	node: ts.Node,
	predicate: (node: ts.Node) => boolean
): ts.Node | undefined {
	if (predicate(node)) {
		return node;
	}
	if (node.parent) {
		return findAncestor(node.parent, predicate);
	}
	return undefined;
}

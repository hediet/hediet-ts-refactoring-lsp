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

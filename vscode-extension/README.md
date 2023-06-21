# Hediet TypeScript Refactorings

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

This is a VS Code Extension for refactorings that I had time and fun to program.
Feel free to use them too.

## Supported Refactorings

-   Convert string concatenation to string template

## Supported Actions

-   Convert expression statement to destructuring statement

![](./docs/destructureExpression.gif)

## Other Features

-   Set a directory with custom refactorings (see settings).

An example refactoring looks like this:

```ts
import {
	RefactorProviderBase,
	typescript,
	RefactorFilter,
	RefactorCollector,
	findChild,
} from "@hediet/ts-lsp/dist/src/api";
import {
	hotClass,
	enableHotReload,
	registerUpdateReconciler,
} from "@hediet/node-reload";

enableHotReload({ entryModule: module });

registerUpdateReconciler(module);

@hotClass(module)
export default class RefactorProvider extends RefactorProviderBase {
	protected collectRefactors(
		context: {
			program: typescript.Program;
			range: typescript.TextRange;
			sourceFile: typescript.SourceFile;
		},
		filter: RefactorFilter,
		collector: RefactorCollector
	): void {
		const n = findChild(context.sourceFile, context.range.pos);
		// TODO: do sth. with n here
	}
}
```

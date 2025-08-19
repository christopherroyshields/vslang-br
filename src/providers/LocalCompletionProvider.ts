import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemLabel, CompletionItemProvider, CompletionList, Position, ProviderResult, Range, TextDocument } from "vscode";
import BrParser from "../parser";
import { TypeLabel, pointToPos } from "../util/common";

export default class LocalVariableCompletionProvider implements CompletionItemProvider {
  parser: BrParser
  constructor(parser: BrParser) {
    this.parser = parser
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
		const varQuery = `(stringarray name: (_) @name) @variable
		(numberarray name: (_) @name) @variable
		(stringreference name: (_) @name) @variable
		(numberreference name: (_) @name) @variable`

		const varMap = new Map<string, [string, string]>()

    const tree = this.parser.getDocumentTree(document)
		const results = this.parser.match(varQuery, tree.rootNode)
		for (const result of results) {
			const node = result.captures[0].node
			const nodeRange = new Range(pointToPos(node.startPosition), pointToPos(node.endPosition))
			if (!nodeRange.contains(position)){
				const type = result.captures[0].node.type
				const name = result.captures[1].node.text
				varMap.set(name.toLowerCase() + type, [name, type])
			}
		}

    const completionItems: CompletionItem[] = []
    for (const [k,v] of varMap){
      const label: CompletionItemLabel = {
        label: v[0],
        detail: ` (${v[1]})`
      }
      const completionItem = new CompletionItem(label, CompletionItemKind.Variable)
      completionItems.push(completionItem)
    }

    return new CompletionList(completionItems, false)
  }
}
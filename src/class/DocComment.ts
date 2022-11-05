export default class DocComment {
	text?: string
	params: Map<string, string> = new Map<string,string>()
	static textSearch: RegExp = /^[\s\S]*?(?=@|$)/
	static paramSearch: RegExp = /@(?<tag>param)[ \t]+(?<name>(?:mat\s+)?\w+\$?)?(?:[ \t]+(?<desc>.*))?/gmi

	/**
	 * Function removes leading asterisk from comment lines
	 * @param comments
	 * @returns comments without asterisk
	 */
	static cleanComments(comments: string): string {
		return comments.replace(/^\s*\*\s/gm, "").trim()
	}

	static parse(commentText: string): DocComment {
		const docComment = new DocComment()
		commentText = commentText.substring(3,commentText.length - 2)
		// freeform text at beginning
		const textMatch = DocComment.textSearch.exec(commentText)
		if (textMatch != null){
			docComment.text = DocComment.cleanComments(textMatch[0])
		}

		// params
		const tagMatches = commentText.matchAll(DocComment.paramSearch)
		for (const tagMatch of tagMatches){
			if (tagMatch.groups){
				docComment.params.set(tagMatch.groups.name, tagMatch.groups.desc)
			}
		}
		return docComment
	}
}

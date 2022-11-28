import { DocumentSemanticTokensProvider, Position, ProviderResult, Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument } from "vscode";
import { RegExpMatchArrayWithIndices } from "./RegExpMatchArrayWithIndices";

const tokenTypes = ['string', 'number', "keyword", "operator", "comment", "variable", "invalid"];
const modifiers = ['deprecated']

export const LayoutLegend = new SemanticTokensLegend(tokenTypes, modifiers);

const PATH_LINE = /(?<path>.*?)(?:,(?<prefix>.*?))?(?:,[ \t]*(?<version>\d*))?$/d
const KEY_LINE = /(?<path>.*?)(?:,(?<keys>.*?))?$/d
const KEY_PARAM = /(?<=,[ \t]*|\/)(?<param>.*?)(?=\/|$)/gd

const RECL = /(?<keyword>recl)=(?<recl>\d+)/gd
const SEP = /^====+/g

const FIELD_VAR = /(?<name>.*?)(?:,(?<desc>.*?))?(?:,(?:(?<spec>[ \t]*(?<valid_spec>BH|BL|B|CC|CR|C|DH|DL|DT|D|GF|GZ|G|L|NZ|N|PIC|PD|P|SKIP|S|V|X|ZD)|[ \t]*(?<invalid>\w+))?(?<len>[ \t]*\d*.?\d*)?[ \t]*))?(?:,(?<comment>.*?))?$/gid
const EOF = /#eof#/gi

export default class LayoutSemanticTokenProvider implements DocumentSemanticTokensProvider {
  tokenGenerator(doc: TextDocument, builder: SemanticTokensBuilder): void {
    let pathLine = false
    let headerDone = false
    let eof=false

    for (let i = 0; i < doc.lineCount; i++) {
      const line = doc.lineAt(i);
      if (line.text.trim().length === 0){
        // skip
      } else if (eof || EOF.test(line.text)){
        eof=true
        if (line.text){
          builder.push(line.range, "comment")
        }
      } else if (line.text.trim().charAt(0)==="!"){
        builder.push(line.range, "comment")
      } else if (SEP.test(line.text)){
        builder.push(line.range, "comment")
        headerDone = true
      } else if (RECL.test(line.text)){
        RECL.lastIndex = 0
        const match = RECL.exec(line.text)
        if (match){
          const indices = (match as RegExpMatchArrayWithIndices).indices
          if (indices.groups.keyword){
            builder.push(new Range(i,indices.groups.keyword[0],i,indices.groups.keyword[1]), "keyword")
          }
          if (indices.groups.recl){
            builder.push(new Range(i,indices.groups.recl[0],i,indices.groups.recl[1]), "number")
          }
        }
        headerDone = true
      } else if (!pathLine && !headerDone) {
        const match = PATH_LINE.exec(line.text)
        if (match){
          pathLine=true
          const indices = (match as RegExpMatchArrayWithIndices).indices
          if (indices.groups.path){
            builder.push(new Range(i,indices.groups.path[0],i,indices.groups.path[1]), "string")
          }
          if (indices.groups.prefix){
            builder.push(new Range(i,indices.groups.prefix[0],i,indices.groups.prefix[1]), "string")
          }
          if (indices.groups.version){
            builder.push(new Range(i,indices.groups.version[0],i,indices.groups.version[1]), "number")
          }
        }
      } else if (pathLine && !headerDone){
        const match = KEY_LINE.exec(line.text)
        if (match){
          const indices = (match as RegExpMatchArrayWithIndices).indices
          if (indices.groups.path){
            builder.push(new Range(i,indices.groups.path[0],i,indices.groups.path[1]), "string")
          }

          let keymatch: RegExpExecArray | null
          while ((keymatch = KEY_PARAM.exec(line.text)) !== null) {
            const indices = (keymatch as RegExpMatchArrayWithIndices).indices
            if (indices.groups.param){
              builder.push(new Range(i,indices.groups.param[0],i,indices.groups.param[1]), "variable")
            }
          }
        }
      } else {
        FIELD_VAR.lastIndex=0
        const match = FIELD_VAR.exec(line.text)
        if (match){
          const indices = (match as RegExpMatchArrayWithIndices).indices
          if (indices.groups.name){
            builder.push(new Range(i, indices.groups.name[0], i, indices.groups.name[1]), "variable")
          }

          if (indices.groups.desc){
            builder.push(new Range(i, indices.groups.desc[0], i, indices.groups.desc[1]), "string")
          }

          if (indices.groups.valid_spec){
            builder.push(new Range(i, indices.groups.valid_spec[0], i, indices.groups.valid_spec[1]), "keyword")
          } else if (indices.groups.invalid){
            builder.push(new Range(i, indices.groups.invalid[0], i, indices.groups.invalid[1]), "invalid")
          }

          if (indices.groups.len){
            builder.push(new Range(i, indices.groups.len[0], i, indices.groups.len[1]), "number")
          }

          if (indices.groups.comment){
            builder.push(new Range(i, indices.groups.comment[0], i, indices.groups.comment[1]), "comment")
          }
        }
      }
    }
  }
  provideDocumentSemanticTokens(
    doc: TextDocument
  ): ProviderResult<SemanticTokens> {
    
    const tokensBuilder = new SemanticTokensBuilder(LayoutLegend);

    this.tokenGenerator(doc, tokensBuilder)

    return tokensBuilder.build();
  }
}

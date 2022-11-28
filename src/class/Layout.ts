type LayoutKey = {
  path: string
  keyFields: string[]
}

type Subscript = {
  name: string,
  description?: string,
  format: string,
  line: string
}

export default class Layout {
  path: string
  prefix: string
  version: number
  keys: LayoutKey[] = []
  subscripts: Subscript[]
  recordLength: number
  constructor(path: string, prefix: string, version = 0, keys=[], subscripts=[], recordLength=0){
    this.path = path
    this.prefix = prefix
    this.version = version
    this.keys = keys
    this.subscripts = subscripts
    this.recordLength = recordLength
  }
  static parse(text: string){
    const lines = text.split("\n")
    const firstLine = lines[0].split(",")
    // var completions = []
    const layout = new Layout(firstLine[0].trim(),firstLine[1].trim(),parseInt(firstLine[2]))

    // Read all subscripts
    let headerDone = false
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes("recl=")) {
        layout.recordLength=parseInt(lines[i].toLowerCase().replace("recl=",""))
        i++
        headerDone=true
      } else if (lines[i].includes("====")) {
        headerDone=true
      } else if (lines[i].trim().charAt(0)==="!") {
        // A comment line, ignore it
      } else if (headerDone){
        if (lines[i].toLowerCase().includes("#eof#")) {
          // a #EOF# line ends the layout
          i = lines.length
        } else {
          // console.log(lines[i]);
          if (lines[i].trim()!=='') {
            const detailLine = lines[i].split(",")
            // Strip out the dollar sign.
            if (detailLine.length>1){
              layout.subscripts.push({
                name: detailLine[0].trim(),
                description: detailLine[1].trim(),
                format: detailLine[2].trim(),
                line: lines[i].trim()
              })
            } else {
              console.log("Bad Layout Detail Line: " + lines[i])
            }
          }
        }
      } else {
        //parse Header
        const keyLine = lines[i].split(",")
        if (!keyLine[1]){
          console.log("Bad Layout Header Line:"+lines[i])
        } else {
          layout.keys.push({
            path: keyLine[0],
            keyFields: keyLine[1].split("/")
          })
        }
      }
    }
    return layout
  }
}
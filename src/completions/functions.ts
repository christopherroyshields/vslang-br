import {CompletionItem, CompletionItemKind, InsertTextFormat} from "vscode-languageserver"

export interface FunctionParameter {
  name: string,
  documentation?: string
}

export interface InternalFunction {
  name: string,
  description?: string,
  documentation?: string,
  params?: FunctionParameter[]
}

export function generateFunctionSignature(fn: InternalFunction): string {
  let sig: string = ''
  if (fn.params?.length) {
    sig += '('
    for (let paramindex = 0; paramindex < fn.params.length; paramindex++) {
      if (paramindex > 0) {
        sig += ','
      }
      const element = fn.params[paramindex];
      sig += element.name;
    }
    sig += ')'
  }
  return sig
}

export function getFunctionByName(name: string): InternalFunction |undefined {
  for (let fnIndex = 0; fnIndex < stringFunctions.length; fnIndex++) {
    const fn = stringFunctions[fnIndex];
    if (fn.name.toLowerCase() === name.toLowerCase()) {
      return fn
    }
  }
}

export const stringFunctions: InternalFunction[] = [
  {
    name: "BR_FileName$",
    documentation: "Returns the BR Filename version of the specified OS filename (reversing out your Drive statements).",
    params: [
      {
        name: "<os_filename>$"
      }
    ]
  },
  {
    name: "BRErr$",
    documentation: "Returns a description of the most recent error encountered.",
    params: []
  },
  {
    name: "CForm$",
    documentation: "Compiles a form statement for faster use and a smaller size string.",
    params: [
      {
        name: "<form>"
      }
    ]
  },
  {
    name: "Chr$",
    documentation: "Returns a Character from the ASCII table.",
    params: [
      {
        name: "<Number>"
      }
    ]
  }, {
    name: "Cnvrt$",
    documentation: "Converts a number to a string, by packing it into the specified Form spec.",
    params: [
      {
        name: "<Spec>"
      }, {
        name: "<Number>"
      }
    ]
  }, {
    name: "Date$",
    documentation: "Returns the current date, or converts a specific Julain date to a string Date.",
    params: [
      {
        name: "<days>"
      }, {
        name: "[<format$>]",
        documentation: ""
      }
    ]
  }, {
    name: "Decrypt$",
    documentation: "Unencrypts data encrypted with the encrypt keyword. (doesn't work on MD5, which cannot be unencrypted.)",
    params: [
      {
        name: "<string>"
      }, {
        name: "[<Algorithm>]"
      }
    ]
  }, {
    name: "Decrypt$",
    documentation: "Unencrypts data encrypted with the encrypt keyword. (doesn't work on MD5, which cannot be unencrypted.)",
    params: [
      {
        name: "<string>"
      }, {
        name: "\"MD5\""
      }
    ]
  }, {
    name: "Encrypt$",
    documentation: "Encrypts a string using one of a few common algorythms including MD5.",
    params: [
      {
        name: "<string>"
      }, {
        name: "[<Algorithm>]"
      }
    ]
  }, {
    name: "Env$",
    documentation: "Returns the contents of an Environment Variable.",
    params: [
      {
        name: "<VariableName>"
      }
    ]
  }, {
    name: "File$",
    documentation: "Returns the file name of the file specified.",
    params: [
      {
        name: "<Number>"
      }
    ]
  }, {
    name: "HELP$",
    documentation: "Displays the requested Help Topic from the HelpFile specified by the HELPDFLT config specification.",
    params: [
      {
        name: "<topic>"
      }, {
        name: "[<filename>]"
      }
    ]
  }, {
    name: "Hex$",
    documentation: "Converts the given string to Hexidecimal.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "KStat$",
    documentation: "Returns keystrokes from the keyboard buffer.",
    params: [
      {
        name: "[<Integer>]"
      }
    ]
  }, {
    name: "Login_Name$",
    documentation: "Returns the Windows User Name of the person logged in.",
    params: [
      {
        name: "[<UserName>]",
        documentation: 'The optional parameter can be used to Override Login_Name with another name.'
      }
    ]
  }, {
    name: "LPad$",
    documentation: "Pads a string on the left with spaces (or optionally, any other character).",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "LTrm$",
    documentation: "Trims off any spaces (or optionally any other specific character) from the left of the given string.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "Lwrc$",
    documentation: "Converts the given string to Lowercase.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "Max$",
    documentation: "Finds the String with the greatest ASCII value of the given strings.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "Min$",
    documentation: "Finds the String with the lowest ASCII value of the given strings.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "Msg$",
    documentation: "Displays custom text in the Status Line at the bottom of the BR Command Console window.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "OS_FileName$",
    documentation: "Returns the OS file name of the Specified BR Filename, taking into account the Drive statements.",
    params: [
      {
        name: "<BR_FileName>"
      }
    ]
  }, {
    name: "Pic$",
    documentation: "Sets or displays the Currency Symbol used by the PIC form statement.",
    params: [
      {
        name: "<CurrencySymbol>"
      }
    ]
  }, {
    name: "Program$",
    documentation: "Returns the currently active program.",
    params: []
  }, {
    name: "RPAD$",
    documentation: "Pads a string on the right with spaces (or optionally, any other character).",
    params: [
      {
        name: "string$"
      },
      {
        name: "length"
      },
      {
        name: "[character$]",
        documentation: 'An optional third parameter ("character") has been added to LPad$ and RPad$ to specify the character to be used for the padding (instead of blanks, which are still the default). The "char" parameter is limited to one character in length (error 410 will result if it is longer). Nulls and Chr$(0) are allowed.'
      }
      
    ]
  }, {
    name: "Rpt$",
    documentation: "Repeat the given character or string the specified number of times.",
    params: [
      {
        name: "<string>"
      }, {
        name: "<repeat>"
      }
    ]
  }, {
    name: "RTrm$",
    documentation: "Trims off any spaces (or optionally any other specific character) from the right of the given string.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "Session$",
    documentation: "Returns the current Session$ number, which is 2 digits identifying the Workstation number, and 1 digit identifying the Session.",
    params: []
  }, {
    name: "SRep$",
    documentation: "Search the given string and replace all occurances of the first string with the second string.",
    params: [
      {
        name: "<String$>"
      }, {
        name: "<SearchFor$>"
      }, {
        name: "<ReplaceWith$>"
      }
    ]
  }, {
    name: "Str$",
    documentation: "Converts the given number to string.",
    params: [
      {
        name: "<number>"
      }
    ]
  }, {
    name: "Time$",
    documentation: "Returns the current System Time.",
    params: [
      {
        name: "Time$"
      }
    ]
  }, {
    name: "Trim$",
    documentation: "Trims all spaces off both ends of the given string.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "UnHex$",
    documentation: "Converts Hexidecimal to Characters.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "UprC$",
    documentation: "Converts the given string to Uppercase.",
    params: [
      {
        name: "<string>"
      }
    ]
  }, {
    name: "UserID$",
    documentation: "Returns the licensee information from the BR logfile.",
    params: []
  }, {
    name: "Variable$",
    documentation: "Returns the Variable associated with the last Error, or if no error, the last variable processed by BR.",
    params: []
  }, {
    name: "WBPlatform$",
    documentation: "Displays the Operating System that BR is running under.",
    params: []
  }, {
    name: "WBVersion$",
    documentation: "Displays the current version of Business Rules.",
    params: []
  }, {
    name: "WSID$",
    documentation: "Displays the WSID$, a 2 digit unique identifier for this computer.",
    params: []
  }, {
    name: "Xlate$",
    documentation: "Returns a string translated using a second string as a translation table.",
    params: [
      {
        name: "<string>"
      }, {
        name: "<translation string>"
      }, {
        name: "[<position>]"
      }
    ]
  }
]

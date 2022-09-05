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

/**
 * User Defined BR Function found in source
 */
export class UserFunction implements InternalFunction {
  name: string
  description?: string | undefined
  documentation?: string | undefined
  params?: FunctionParameter[] | undefined
  uri: string = ''
  /**
   * @param name - function name
   */
  constructor(name: string) {
    this.name = name
  }
}

/**
 * Function to generate example function call for display purposes
 * @param fn Function to generate full function call
 */
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

export function getFunctionByName(name: string): InternalFunction | undefined {
  for (let fnIndex = 0; fnIndex < stringFunctions.length; fnIndex++) {
    const fn = stringFunctions[fnIndex];
    if (fn.name.toLowerCase() === name.toLowerCase()) {
      return fn
    }
  }
}

export function getFunctionsByName(name: string): InternalFunction[] | undefined {

  const fnMatches: InternalFunction[] = []

  for (let fnIndex = 0; fnIndex < stringFunctions.length; fnIndex++) {
    const fn = stringFunctions[fnIndex];
    if (fn.name.toLowerCase() === name.toLowerCase()) {
      fnMatches.push(fn)
    }
  }

  return fnMatches.length ? fnMatches : undefined
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
        name: "<number>",
        documentation: 'The number to convert to string representation.'
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
  },
  {
    name: "ABS",
    documentation: "Returns the Absolute Value of a Number.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "Mat",
    documentation:
      "Returns an array that is an ascending index obtained from sorting the array within parenthesis.",
    params: [
      {
        name: "MAT ArrayToBeIndexed$",
      },
    ],
  },
  {
    name: "Aidx",
    documentation:
      "Returns an array of Subscripts that is an ascending index obtained from sorting the array within parenthesis.",
    params: [
      {
        name: "MAT ArrayToBeIndexed$",
      },
    ],
  },
  {
    name: "Atn",
    documentation:
      "A trigonometric function that calculates the arctangent of the numeric expression in radians.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "Bell",
    documentation:
      "Returns a character which, when printed, sounds the printer's or terminal's bell. It is used mainly in PRINT statements.",
    params: [],
  },
  {
    name: "Ceil",
    documentation:
      "Calculates the smallest integer greater than or equal to X.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "CmdKey",
    documentation:
      "Returns a value to identify the last command key (function key) used to terminate keyboard input, or returns 0 if <ENTER> was the last key pressed.",
    params: [],
  },
  {
    name: "Cnt",
    documentation:
      "Returns the number of data items successfully processed by the last I/O statement.",
    params: [],
  },
  {
    name: "Cod",
    documentation:
      "Indicates the termination status of a program as set by the STOP or END statement.",
    params: [],
  },
  {
    name: "CoS",
    documentation:
      "Trigonometric function that calculates the cosine of X in radians.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "CurCol",
    documentation:
      "Returns cursor column from the last INPUT FIELDS or RINPUT FIELDS statement.",
    params: [],
  },
  {
    name: "CurFld",
    documentation:
      "Returns the number of the field containing the cursor from the last INPUT FIELDS.",
    params: [],
  },
  {
    name: "CurRow",
    documentation:
      "Returns the cursor's row from last Input Fields or RInput Fields statement.",
    params: [],
  },
  {
    name: "CurTab",
    documentation: "Returns the active tabbed window number.",
    params: [],
  },
  {
    name: "CurWindow",
    documentation: "Returns the number of the window currently in focus.",
    params: [],
  },
  {
    name: "Date",
    documentation:
      "Calculates and returns dates in numeric format, using no dashes or slashes as separators.",
    params: [
      {
        name: "[<Integer>]",
      },
      {
        name: "[*<order_of_components$>]",
      },
    ],
  },
  {
    name: "Days",
    documentation:
      "Returns the absolute, sequential value which is assigned to dates after January 1, 1900.",
    params: [
      {
      name: "<date>",
      },
      {
        name: "[<format$>]"
      }
    ],
  },
  {
    name: "Debug_Str",
    documentation:
      "Depending on loglevel (message-level must be equal or lower), send data to the logfile as well as to the debugger if it is attached, or optionally to the command console if the debugger is not attached and GUI is ON.",
    params: [
      {
        name: "<message-level>",
      },
      {
        name: "<string-value>",
      },
    ],
  },
  {
    name: "Didx",
    documentation:
      " returns an array that is a descending index obtained from sorting the array named.",
    params: [
      {
        name: "<array name>",
      },
    ],
  },
  {
    name: "Err",
    documentation: "Returns the error code of the most recent error.",
    params: [],
  },
  {
    name: "Exists",
    documentation:
      "The exists internal function returns a nonzero value if the specified file (PROC or program)exists and the user has read privileges. If one or both of these conditions is false, exists returns a value of zero. NOTE that on single-user systems, all files have read privileges for the current user.",
    params: [
      {
        name: "<filename>",
      },
    ],
  },
  {
    name: "Exp",
    documentation: "Calculates the exponential value of X.",
    params: [
      {
        name: "number",
      },
    ],
  },
  {
    name: "File",
    documentation:
      "The File internal function returns the numeric value that specifies the status of file associated with the File Handle.\n-1 \tFile not opened.\n0 \tOperation performed successfully.\n10 \tEnd of file occurred during input.\n11 \tEnd of file occurred during output.\n20 \tTransmission error during input.\n21 \tTransmission error during output.",
    params: [
      {
        name: "<file handle>",
      },
    ],
  },
  {
    name: "Filenum",
    documentation:
      "returns the number of the file that produced the most recent I/O error.",
    params: [],
  },
  {
    name: "Fkey",
    documentation:
      "Similar to CmdKey, but returns more information, particularly about how a field is exited.",
    params: [
      {
        name: "<value>",
      },
    ],
  },
  {
    name: "Fp",
    documentation: "Returns the fractional part of X. ",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "Freesp",
    documentation:
      "Returns the number of free (unused) bytes on the drive containing file N.",
    params: [
      {
        name: "<file name>",
      },
    ],
  },
  {
    name: "Inf",
    documentation:
      "Returns the largest possible number in Business Rules! on the current system.",
    params: [],
  },
  {
    name: "Int",
    documentation: "Returns the largest integer less than or equal to X.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "Ip",
    documentation: "Returns the integer part of X.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "KLN",
    documentation:
      "Returns the key length in bytes for master file specified by 'file name'.",
    params: [
      {
        name: "<file name>",
      },
      {
        name: "[<numeric expression>]",
      },
    ],
  },
  {
    name: "Kps",
    documentation:
      "Returns the byte position where the key for master file named starts. With an optional second parameter, KPS can also return the position of a section of a key when split keys are used.",
    params: [
      {
        name: "<file name>",
      },
      {
        name: "[<numeric expression>]",
      },
    ],
  },
  {
    name: "KRec",
    documentation:
      "When file N is a display file, KRec(N) acts as a line counter for lines output to the file. If file N is an internal file opened for Keyed processing, then KRec(N) returns the number of the last record accessed in the key file.",
    params: [
      {
        name: "N",
      },
    ],
  },
  {
    name: "Len",
    documentation:
      "The Len(string$) internal function returns the number of characters in variable string$.",
    params: [
      {
        name: "<string>",
      },
    ],
  },
  {
    name: "Line",
    documentation: "Returns the line number of the most recent error. ",
    params: [],
  },
  {
    name: "Lines",
    documentation:
      "Returns the number of lines printed since the last new page.",
    params: [
      {
        name: "<file number>",
      },
    ],
  },
  {
    name: "LineSPP",
    documentation:
      "Returns the current lines per page as set by a BRConfig.sys PRINTER spec's LPP parameter or 66 by default.",
    params: [
      {
        name: "<file number>",
      },
    ],
  },
  {
    name: "Log",
    documentation: "Returns the natural logarithm of its argument.",
    params: [
      {
        name: "<positive number>",
      },
    ],
  },
  {
    name: "Lrec",
    documentation: "Returns the number of the last record in the file.",
    params: [
      {
        name: "<file handle>",
      },
    ],
  },
  {
    name: "Mat2Str",
    documentation:
      "Mat2Str internal function which converts an array to a string",
    params: [
      {
        name: "MAT <Array Name>",
      },
      {
        name: "<String Variable>",
      },
      {
        name: "[<Delimiter$>]",
      },
      {
        name: "[<Quote-Type>] [:] [<trim>]",
      },
    ],
  },
  {
    name: "Max",
    documentation:
      "Returns the largest numeric value in the set of numbers inside parentheses (X1, X2 and so on).",
    params: [
      {
        name: "<value>",
      },
      {
        name: "<value>",
      },
      {
        name: "[...]",
      },
    ],
  },
  {
    name: "Min",
    documentation:
      "The Min internal function returns the smallest numeric value in the set of numbers inside parentheses (X1, X2 and so on). ",
    params: [
      {
        name: "<value>",
      },
      {
        name: "<value>",
      },
      {
        name: "[...]",
      },
    ],
  },
  {
    name: "Mod",
    documentation:
      "The Mod internal function returns the remainder of the numerator divided by the denominator. In other words, it is the remainder left after the division of one integer by another ",
    params: [
      {
        name: "<numerator>",
      },
      {
        name: "<denominator>",
      },
    ],
  },
  {
    name: "Msg",
    documentation:
      "The MSG internal function (without the dollar sign) is only available for Windows & CS versions. This should not be confused with Msg$.",
    params: [
      {
        name: '"KB"',
      },
      {
        name: "<string>",
      },
    ],
  },
  {
    name: "Msgbox",
    documentation:
      "The MsgBox Internal Function will display a Windows Message Box. It has four possible parameters.",
    params: [
      {
        name: "PROMPT$",
      },
      {
        name: "[TITLE$]",
      },
      {
        name: "[BUTTONS$]",
      },
      {
        name: "[ICON$]",
      },
    ],
  },
  {
    name: "Newpage",
    documentation:
      "The NewPage internal function returns a character which, when printed, causes the printer to do a form feed or the screen to clear.",
    params: [],
  },
  {
    name: "Ord",
    documentation:
      "ASCII ordinate value (from 0 to 255) of the first character in the string$.",
    params: [
      {
        name: "<string>",
      },
    ],
  },
  {
    name: "Pi",
    documentation: "Returns the mathematical constant of 3.14159265358979",
    params: [],
  },
  {
    name: "Pos",
    documentation:
      "Returns the position of the first character of a substring in str1$ that matches str2$.",
    params: [
      {
        name: "<string>",
      },
      {
        name: "[^]<string>",
      },
      {
        name: "[[-]<start>]",
      },
    ],
  },
  {
    name: "Printer_List",
    documentation: "Reads the list of available Windows printers into the provided array (mat a$). Returns the number of available printers.",
    params: [{
      name: "<Mat array name>"
    }],
  },
  {
    name: "ProcIn",
    documentation:
      "Returns 0 if input is from the screen. Returns 1 if input is from a procedure file.",
    params: [],
  },
  {
    name: "Rec",
    documentation: "Returns the number of the record last processed in file N.",
    params: [
      {
        name: "<file ref>",
      },
    ],
  },
  {
    name: "Rem",
    documentation:
      "Returns the remainder of the numerator divided by the denominator.",
    "params": [
{
name: '<numerator>'
},
{
name: '<denominator>'
}],
  },
  {
    name: "RLn",
    documentation: "returns the record length of an open file handle N.",
    "params": [
{
name: '<file handle>'
},
{
name: '[<new record length>]'
}],
  },
  {
    name: "RND",
    documentation: "Returns a random number between 0 and 1.",
    "params": [
{
name: '[<numeric expression>]'
}
],
  },
  {
    name: "Round",
    documentation:
      "Calculates the value of the first value rounded to the specified number of decimal places. ",
    "params": [
{
name: '<numeric expression>'
},
{
name: '<decimals>'
}],
  },
  {
    name: "Serial",
    documentation:
      "returns the serial number assigned to this copy of Business Rules!. ",
    params: [],
  },
  {
    name: "SetEnv",
    documentation:
      "Sets session based environmental variables in Business Rules!.",
    "params": [
{
name: '<field>'
},
{
name: '<value>'
}],
  },
  {
    name: "Sgn",
    documentation:
      "Returns a value which identifies whether a numeric value is negative, positive or zero.",
    "params": [
{
name: '<X>'
}
],
  },
  {
    name: "Sin",
    documentation:
      "Trigonometric function that returns the sine of X in radians.",
    params: [
      {
        name: "<number>",
      },
    ],
  },
  {
    name: "Sleep",
    documentation:
      "The Sleep internal function causes the processor to wait the specified number of seconds before continuing execution. It does not tie up the processor while waiting, which is especially important for multi-user systems.",
    params: [
      {
        name: "<seconds>",
      },
    ],
  },
  {
    name: "Sqr",
    documentation: "Returns the square root of its argument.",
    params: [
      {
        name: "<numeric expression>",
      },
    ],
  },
  {
    name: "Srch",
    documentation:
      'Searches an array and returns the row number matching the argument.\nIf the argument is not found, then either 0 (BR 4.1 and below) or -1 (BR 4.2 and above).\nThe argument must be the same data type (string or numeric) as the array. The optional "row"\nparameter defines the starting array element for the search.',
    params: [
      {
        name: "mat array$",
      },
      {
        name: "[^]<argument$>",
      },
      {
        name: "[<row>]",
      },
    ],
  },
  {
    name: "Str2Mat",
    documentation:
      "The Str2Mat Internal Function will split a string variable based on a\ndelimiter and place the resulting strings into an array which STR2MAT\ndynamically re-dimensions. The string to mat and mat to string functions\nhave been extended to ease parsing of CSV and XML data (as of 4.3).",
    params: [
      {
        name: "<string variable>",
      },
      {
        name: "MAT <array name>",
      },
      {
        name: "[MAT] <delimiter$>",
      },
      {
        name: "[<quote-type:trim>]",
      },
    ],
  },
  {
    name: "Sum",
    documentation:
      "The Sum internal function returns the sum of all the elements in the numeric array named.\nSUM also works with multi-dimensional matrices.",
    params: [
      {
        name: "<numeric array>",
      },
    ],
  },
  {
    name: "Tab",
    documentation:
      "The Tab(x) internal function positions the cursor at column x (similar to POS in a FORM statement), where x is any numeric expression.\nIf the current position of the line is greater than column x, the cursor is positioned at column x in the next line.\nIf x is negative, TAB(1) is assumed. If x is not an integer, it is rounded.\nIf x is greater than the record length, the cursor is positioned at column 1 in the next line.",
    params: [
      {
        name: "<col>",
      },
    ],
  },
  {
    name: "Tan",
    documentation:
      "The Tan internal function is a mathematical trigonometric function that calculates the tangent of X in radians. ",
    params: [
      {
        name: "<x>",
      },
    ],
  },
  {
    name: "Timer",
    documentation:
      'The Timer internal function returns a "Real Number" with 5 decimal digits accuracy with the number of seconds elapsed since midnight, January 1, 1970.\nThis starting point is obtained from the operating system so it is only as accurate as your system time.\nThis value is used internally by the pro filer to monitor performance, but may be used within programs to measure the time very accurately',
    params: [],
  },
  {
    name: "UDim",
    documentation:
      "The UDim(A$,X) internal function returns the number of rows in the array if X=1. Returns the number of columns in the array if X=2. Returns the current size of dimensions 3, 4, 5, 6 or 7 when X is 3, 4, 5, 6 or 7. If the optional parameter X is omitted, UDIM returns the size of the first dimension.",
    params: [
      {
        name: "<array name>",
      },
      {
        name: "[<dimension>]",
      },
    ],
  },
  {
    name: "VAL",
    documentation:
      "The Val(A$) internal function returns A$ expressed as a numeric value rather than a string.",
    params: [
      {
        name: "<string>",
      },
    ],
  },
  {
    name: "Version",
    documentation:
      "The Version internal function affects an open internal data file.\nIt will return the version of that file. It can also be used to set the version.",
    params: [
      {
        name: "<file_handle>",
      },
    ],
  },
]

import { Statement } from "../interface/Statement";

export const Statements: Statement[] = [
  {
    name: "do"
  },
  {
    name: "loop"
  },
  {
    name: "if"
  },
  {
    name: "end if"
  },
  {
    name: "def",
    description: "Def Statement",
    documentation: "Defines function.",
    docUrl: "http://www.brwiki.com/index.php?title=Def",
    example: 'def fnfoo(bar)\n\t! body\nfnend'
  },
  {
    name: "def library",
    description: "Def Library Fn ... fnend",
    documentation: "Define library function",
    docUrl: "http://www.brwiki.com/index.php?title=Def"
  },
  {
    name: "Chain",
    description: "Chain {<program name>|\"PROC=<name>\"|\"SUPROC=<name>\"} ...",
    documentation: "Loads and Runs the target program, immediately ending the current program. Optionally passes variables and files into the called program.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Chain"
  },
  {
    name: "Close",
    description: "Close {#<file/window number>} [,Free|Drop] [, ...] :",
    documentation: "The Close (CL) statement deactivates access to a data or window file for input or output.",
    docUrl: "http://www.brwiki.com/index.php?search=Close"
  },
  {
    name: "Continue",
    description: "Continue Statement",
    documentation: "Jumps to the line following the line that had the most recent error. Used to continue in an Error Handler.",
    docUrl: "http://www.brwiki.com/index.php?search=Continue"
  },
  {
    name: "Data",
    description: "Data {\"<string constant>\"|<numeric constant>}[,...]",
    documentation: "The Data statement can be used to populate the values of variables.",
    docUrl: "http://www.brwiki.com/index.php?search=Data"
  },
  {
    name: "Delete",
    description: "Delete",
    documentation: "Deletes the currently locked record from the identified data file..",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Delete_(statement)"
  },
  {
    name: "Dim",
    description: "Dim",
    documentation: "Declares Variables and Arrays. Arrays must be declared if they have other then 10 messages.",
    docUrl: "http://www.brwiki.com/index.php?search=Dim"
  },
  {
    name: "Display",
    description: "Display [Menu|Buttons] ...",
    documentation: "Display or Update the Windows Menu, or the Button Rows.",
    docUrl: "http://www.brwiki.com/index.php?search=Display"
  },
  {
    name: "End",
    description: "End",
    documentation: "Ends your program (continuing with any proc files that ran your program, or stopping if your program wasn't run from a proc.)",
    docUrl: "http://www.brwiki.com/index.php?search=End"
  },
  {
    name: "Execute",
    description: "Execute \"BR Command\"",
    documentation: "Executes a Command from within one of your programs.",
    docUrl: "http://www.brwiki.com/index.php?search=Execute"
  },
  {
    name: "Exit",
    description: "Exit <error condition line ref>[,...]",
    documentation: "Works in conjunction with the Exit error condition to list a bunch of error handlers in one place. ",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Exit"
  },
  {
    name: "Exit Do",
    description: "Exit Do Statement",
    documentation: "Jumps out of a do loop to the line following the loop.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Exit_do"
  },
  {
    name: "Fnend",
    description: "Fnend Statement",
    documentation: "The FnEnd (FN) and End Def statements indicates the end of a definition of a multi-lined user defined function.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Fnend"
  },
  {
    name: "Print",
    description: "Print Statement",
    documentation: "Prints a line to the console, or to a specific file.",
    docUrl: "http://www.brwiki.com/index.php?search=Print"
  },
  {
    name: "Input",
    description: "Input <Variables>",
    documentation: "Reads text from the user or from a display file (like a text file). It can also read text from a proc file, if the program is called from a proc.",
    docUrl: "http://www.brwiki.com/index.php?search=Input"
  },
  {
    name: "Linput",
    description: "Linput <StringVariable>",
    documentation: "Reads a line of text from a display file. This is useful for parsing CSV files and other files generated by external applications.",
    docUrl: "http://www.brwiki.com/index.php?search=Linput"
  },
  {
    name: "Input",
    description: "Input Fields",
    documentation: "Activates a bunch of controls on the screen and pauses execution, allowing the user to interact with them. This is the primary way that BR programs interact with the User.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Input_Fields"
  },
  {
    name: "Rinput",
    description: "Rinput Fields",
    documentation: "Updates and then activates a bunch of controls on the screen and pauses execution, allowing the user to interact with them. This is the primary way that BR programs interact with the User.",
    docUrl: "http://www.brwiki.com/index.php?search=Rinput"
  },
  {
    name: "Input",
    description: "Input Select",
    documentation: "Activates a bunch of controls and allows the user to select one of them.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Input_Select"
  },
  {
    name: "Rinput",
    description: "Rinput Select",
    documentation: "Activates and Displays a bunch of controls and allows the user to select one of them.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Rinput_select"
  },
  {
    name: "For",
    description: "Form",
    documentation: "The Form statement is used in conjunction with PRINT, WRITE, REWRITE, READ or REREAD statements to format input or output. FORM controls the size, location, field length and format of input or output.",
    docUrl: "http://www.brwiki.com/index.php?search=Form"
  },
  {
    name: "Gosub",
    description: "Gosub <LineLabel/LineNumber>",
    documentation: "Calls a subroutine, which runs until it encounters a return statement, at which point it returns here.",
    docUrl: "http://www.brwiki.com/index.php?search=Gosub"
  },
  {
    name: "Goto",
    description: "Goto <LineLabel/LineNumber>",
    documentation: "Jumps to the target line and continues running from there. (Try not to use Goto Statements. This is not the 80s.).",
    docUrl: "http://www.brwiki.com/index.php?search=Goto"
  },
  {
    name: "Library",
    description: "Library \"<Library>\" : <fnFunction1> [, fnFunction2] [, ...]",
    documentation: "Loads a BR Libary, allowing access to the library functions in it.",
    docUrl: "http://www.brwiki.com/index.php?search=Library"
  },
  {
    name: "Mat",
    description: "Mat <array name> [(<dimension>[,...])] = ....",
    documentation: "The Mat statement is used for working with Arrays. Its used to resize arrays, sort them (in conjunction with AIDX or DIDX), copy them, and process them in lots of other ways.",
    docUrl: "http://www.brwiki.com/index.php?search=Mat"
  },
  {
    name: "On",
    description: "On Statement"
  },
  {
    name: "Open",
    description: "Open #<FileNumber> \"Name=...\"",
    documentation: "Opens a file or window or http connection or comm port.",
    docUrl: "http://www.brwiki.com/index.php?search=Open"
  },
  {
    name: "Pause",
    description: "Pause",
    documentation: "Pauses program execution allows the programmer to interact with the program in the Command Console.",
    docUrl: "http://brwiki2.brulescorp.com/index.php?title=Pause"
  },
  {
    name: "Randomize",
    description: "Randomize",
    documentation: "Generates a new Random Number Seed for the Random Number Generator (based on the system clock so as to be truly random).",
    docUrl: "http://www.brwiki.com/index.php?search=Randomize"
  },
  {
    name: "Read",
    description: "Read Statement",
    documentation: "Reads data",
    docUrl: "http://www.brwiki.com/index.php?search=Read"
  },
  {
    name: "Reread",
    description: "Reread  #<file number> [, USING {<formStatement>}] : <Variables> ",
    documentation: "Rereads the previous record read again, in the selected data file or data statements, storing the information in the variables provided.",
    docUrl: "http://www.brwiki.com/index.php?search=Reread"
  },
  {
    name: "Write",
    description: "Write  #<file number> [, USING {<formStatement>}] : <Variables> ",
    documentation: "Adds a record to the file containing the information from the variables you list.",
    docUrl: "http://www.brwiki.com/index.php?search=Write"
  },
  {
    name: "Rewrite",
    description: "Rewrite  #<file number> [, USING {<formStatement>}] : <Variables> ",
    documentation: "Updates the record that is locked in the file (usually the last record read), with the data in the variables now.",
    docUrl: "http://www.brwiki.com/index.php?search=Rewrite"
  },
  {
    name: "Restore",
    description: "Restore  #<file number> [,<Key|Rec|Pos|Search> = <SearchValue|Position>: ",
    documentation: "Jumps to the beginning (or other specified point) in the targeted file.",
    docUrl: "http://www.brwiki.com/index.php?search=Restore"
  },
  {
    name: "Retry",
    description: "Retry",
    documentation: "Jumps to the line that had the most recent error. Used to try again in an Error Handler.",
    docUrl: "http://www.brwiki.com/index.php?search=Retry"
  },
  {
    name: "Return",
    description: "Return",
    documentation: "Exits a Subroutine and returns control back up to the code following the Gosub statement.",
    docUrl: "http://www.brwiki.com/index.php?search=Return"
  },
  {
    name: "Scr_Freeze",
    description: "Scr_Freeze",
    documentation: "Stops the screen from updating, significantly increasing the speed of the programs. The screen starts running again at the next Input Statement or Scr_Thaw statement.",
    docUrl: "http://www.brwiki.com/index.php?search=Scr_freeze"
  },
  {
    name: "Scr_Thaw",
    description: "Scr_Thaw",
    documentation: "Causes the screen to refresh and begin updating again after it was frozen with a Scr_Freeze command.",
    docUrl: "http://www.brwiki.com/index.php?search=Scr_thaw"
  },
  {
    name: "Stop",
    description: "Stop",
    documentation: "Ends your program (continuing with any proc files that ran your program, or stopping if your program wasn't run from a proc.)",
    docUrl: "http://www.brwiki.com/index.php?search=Stop"
  },
  {
    name: "Trace",
    description: "Trace [On|Off|Print]",
    documentation: "Displays or outputs the line numbers as they're executed. Used for debugging code, but the modern debugging tools are much better.",
    docUrl: "http://www.brwiki.com/index.php?search=Trace"
  }
]
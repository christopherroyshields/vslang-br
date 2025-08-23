# Business Rules! Language Grammar - Complete Reference

## Executive Summary

Business Rules! (BR!) is a procedural programming language designed for business applications. This document provides a comprehensive grammar description to enhance AI understanding and generation of BR! code.

## Table of Contents

1. [Language Overview](#language-overview)
2. [Lexical Structure](#lexical-structure)
3. [Data Types](#data-types)
4. [Variables and Identifiers](#variables-and-identifiers)
5. [Operators and Expressions](#operators-and-expressions)
6. [Statements](#statements)
7. [Control Structures](#control-structures)
8. [Functions](#functions)
9. [File Operations](#file-operations)
10. [Error Handling](#error-handling)
11. [Program Structure](#program-structure)
12. [Syntax Quick Reference](#syntax-quick-reference)

## Language Overview

### Key Characteristics
- **Line-numbered**: Every statement must have a line number
- **Case-insensitive**: Keywords can be UPPER, lower, or MiXeD case
- **Abbreviated keywords**: Most statements have short forms (e.g., PRINT → PR)
- **String suffix**: String variables end with $ (e.g., NAME$)
- **1-based arrays**: Arrays start at index 1 by default
- **Implicit typing**: Variables don't require explicit declaration
- **Multiple statements per line**: Use : to separate statements on same line

### Syntax Notation Conventions
- `KEYWORD` - Required keywords (can use abbreviations)
- `[optional]` - Optional elements
- `{choice1|choice2}` - Required choice (one of)
- `<placeholder>` - Replace with actual value
- `[,...]` - Preceding element can be repeated

## Lexical Structure

### Line Numbers
```bnf
<line-number> ::= <integer>
```
- Required for every program line
- Typically increment by 10 (100, 110, 120...)
- Range: 1 to 99999

### Comments
```bnf
<comment> ::= '!' <any-text-to-end-of-line>
            | REM <any-text-to-end-of-line>
            | '/*' <any-text> '*/'
            | '/**' <javadoc-content> '*/'

<javadoc-content> ::= <javadoc-line>*
<javadoc-line> ::= [<line-number>] [<whitespace>] ['*'] <text>
```

#### Comment Types
1. **Single-line comments**: Start with `!` or `REM`
2. **Multi-line comments**: Enclosed in `/* ... */`
3. **JavaDoc comments**: Enclosed in `/** ... */` for function documentation

#### JavaDoc Tags
- `@param <name>` - Describes a function parameter
- `@returns` or `@return` - Describes the return value
- `@example` - Provides usage example
- `@deprecated` - Marks as deprecated
- `@see` - References related items

Example:
```business-rules
00090 /**
00091  * Calculate sales tax for a given amount
00092  * @param amount - The base amount to calculate tax on
00093  * @param rate - The tax rate as a decimal
00094  * @returns The calculated tax amount
00095  */
00100 DEF FNCALCTAX(AMOUNT, RATE)
00110   LET FNCALCTAX = AMOUNT * RATE
00120 FNEND
```

### Identifiers
```bnf
<identifier> ::= <letter> { <letter> | <digit> | '_' }*
```
- 1-30 characters
- Must start with a letter (except FN)
- Cannot be reserved words
- Case insensitive

## Data Types

### Numeric
```bnf
<numeric-literal> ::= <integer> | <floating-point>
<integer> ::= [+|-] <digit>+
<floating-point> ::= [+|-] <digit>+ '.' <digit>* [E[+|-]<digit>+]
```
- Up to 15 significant digits
- Scientific notation supported

### String
```bnf
<string-literal> ::= '"' <any-char-except-quote>* '"'
```
- Default max length: 18 characters
- Can specify max length with DIM

### Arrays
```bnf
<array-declaration> ::= DIM <identifier> '(' <dimension> [',' <dimension>]* ')'
```
- 1-based by default (can change with OPTION BASE 0)
- Up to 7 dimensions

## Variables and Identifiers

### Variable Types
```bnf
<numeric-variable> ::= <identifier>
<string-variable> ::= <identifier> '$'
<array-variable> ::= <identifier> '(' <subscript> [',' <subscript>]* ')'
```

### Declaration
```bnf
DIM <variable-list>
<variable-list> ::= <variable-declaration> [',' <variable-declaration>]*
<variable-declaration> ::= <numeric-variable>
                        | <string-variable> '*' <max-length>
                        | <array-variable>
```

Example:
```business-rules
00100 DIM NAME$*30, AMOUNT, SCORES(100), MATRIX(10,10)
```

## Operators and Expressions

### Operator Precedence (highest to lowest)
| Level | Operators | Description |
|-------|-----------|-------------|
| 1 | `()` `[]` | Grouping, array indexing |
| 2 | `^` `**` | Exponentiation |
| 3 | `*` `/` `MOD` | Multiplication, division, modulo |
| 4 | `+` `-` | Addition, subtraction |
| 5 | `&` | String concatenation |
| 6 | `=` `<>` `<` `>` `<=` `>=` | Comparison |
| 7 | `NOT` | Logical NOT |
| 8 | `AND` | Logical AND |
| 9 | `OR` | Logical OR |

### Expression Types
```bnf
<expression> ::= <numeric-expression> | <string-expression>
<numeric-expression> ::= <numeric-term> [ <numeric-operator> <numeric-term> ]*
<string-expression> ::= <string-term> [ '&' <string-term> ]*
```

## Statements

### Assignment
```bnf
[LET] <variable> = <expression>
```
LET is optional and usually omitted.

### Input/Output
```bnf
PRINT [#<file-num> ':'] [<print-list>]
INPUT [#<file-num> ':'] [<prompt> ','] <variable-list>
LINPUT [#<file-num> ':'] [<prompt> ','] <string-variable>
```

### Formatted I/O
```bnf
PRINT USING <line-ref> ':' <expression-list>
INPUT FIELDS <field-spec> ':' <variable-list>
```

### Common Statement Abbreviations
| Full | Abbrev | Description |
|------|--------|-------------|
| PRINT | PR | Output data |
| INPUT | IN | Input data |
| LET | LE | Assignment |
| GOTO | GOT | Jump to line |
| GOSUB | GOS | Call subroutine |
| RETURN | RETU | Return from subroutine |
| DIM | DI | Declare variables |
| OPEN | OPE | Open file |
| CLOSE | CL | Close file |
| READ | REA | Read from file/DATA |
| WRITE | WR | Write to file |
| DELETE | DEL | Delete record |
| END | EN | End program |

## Control Structures

### Conditional Execution
```bnf
IF <condition> THEN <statement-or-line> [ELSE <statement-or-line>]
IF <condition> THEN
    <statements>
[ELSE
    <statements>]
END IF
```

### Loops
```bnf
FOR <variable> = <start> TO <end> [STEP <increment>]
    <statements>
NEXT [<variable>]

DO [{WHILE|UNTIL} <condition>]
    <statements>
LOOP [{WHILE|UNTIL} <condition>]
```

### Branching
```bnf
GOTO <line-ref>
GOSUB <line-ref>
ON <expression> {GOTO|GOSUB} <line-ref> [',' <line-ref>]*
```

## Functions

### User-Defined Functions
```bnf
DEF FN<name>[(<parameter-list>)]
    <statements>
    [LET] FN<name> = <expression>
FNEND
```

### Internal Functions (Built-in)

#### String Functions
- `CHR$(n)` - Character from ASCII code
- `STR$(n)` - Convert number to string
- `UPRC$(s$)` - Convert to uppercase
- `LWRC$(s$)` - Convert to lowercase
- `TRIM$(s$)` - Remove leading/trailing spaces
- `RPAD$(s$,n)` - Right pad to length
- `LPAD$(s$,n)` - Left pad to length

#### Numeric Functions
- `VAL(s$)` - Convert string to number
- `INT(n)` - Integer part
- `ROUND(n,d)` - Round to d decimals
- `ABS(n)` - Absolute value
- `SQR(n)` - Square root
- `SIN(n)`, `COS(n)`, `TAN(n)` - Trigonometric
- `LOG(n)`, `EXP(n)` - Logarithmic

#### System Functions
- `DATE$` - Current date
- `TIME$` - Current time
- `ERR` - Last error number
- `LINE` - Current line number

## File Operations

### File Types
- Internal files (keyed/sequential data files)
- External files (display files)
- Communications files
- Window files

### File Operations
```bnf
OPEN #<file-num> ':' <file-spec> [, <access-mode>] [, <file-type>]
READ #<file-num> [, <options>] ':' <variable-list>
WRITE #<file-num> [, <options>] ':' <expression-list>
REWRITE #<file-num> [, <options>] ':' <expression-list>
DELETE #<file-num> [, <options>]
CLOSE #<file-num>
```

### File Options
- `REC=<n>` - Record number
- `KEY=<string>` - Key value
- `SEARCH=<string>` - Search key

## Error Handling

### Error Control
```bnf
ON ERROR {GOTO <line-ref> | SYSTEM | IGNORE}
EXIT <line-ref> ERROR <error-list>
```

### Error Recovery
```bnf
RETRY    ! Re-execute statement that caused error
CONTINUE ! Continue after statement that caused error
```

### Common Error Codes
- 0 - No error
- 11 - File not found
- 4152 - File not found
- 4225 - Record not found
- 4300 - Duplicate key

## Program Structure

### Basic Template
```business-rules
00100 ! Program: [Name]
00110 ! Purpose: [Description]
00120 ! Author: [Name]
00130 ! Date: [Date]
00140 !
00200 ! === Initialize ===
00210 DIM [variables]
00220 ON ERROR GOTO 9000
00230 !
00300 ! === Main Program ===
00310 GOSUB 1000  ! Initialize
00320 GOSUB 2000  ! Process
00330 GOSUB 3000  ! Output
00340 !
00999 STOP
01000 ! === Initialize Subroutine ===
01010 ! [initialization code]
01990 RETURN
02000 ! === Process Subroutine ===
02010 ! [processing code]
02990 RETURN
03000 ! === Output Subroutine ===
03010 ! [output code]
03990 RETURN
09000 ! === Error Handler ===
09010 PRINT "Error"; ERR; "at line"; LINE
09020 STOP
99999 END
```

## Syntax Quick Reference

### Common Patterns

#### Variable Assignment
```business-rules
LET X = 10
LET NAME$ = "John Doe"
LET TOTAL = PRICE * QUANTITY * (1 + TAX_RATE)
```

#### Screen I/O
```business-rules
PRINT "Enter customer name: ";
INPUT NAME$
PRINT "Hello, "; NAME$
```

#### File Processing
```business-rules
OPEN #1: "NAME=customer.dat,RECL=80", INTERNAL, OUTIN, KEYED
WRITE #1, USING 100: CUSTNO$, NAME$, BALANCE
100 FORM C 10, C 30, N 10.2
READ #1, KEY=SEARCH$: CUSTNO$, NAME$, BALANCE
CLOSE #1
```

#### Loop Examples
```business-rules
! FOR loop
FOR I = 1 TO 10
    PRINT I; " squared is "; I * I
NEXT I

! DO WHILE loop
DO WHILE AMOUNT > 0
    PRINT "Processing..."
    LET AMOUNT = AMOUNT - PAYMENT
LOOP

! DO UNTIL loop
DO
    INPUT "Continue (Y/N)? ", ANSWER$
LOOP UNTIL UPRC$(ANSWER$) = "N"
```

#### Error Handling
```business-rules
ON ERROR GOTO 9000
OPEN #1: "data.dat", INTERNAL, INPUT
! ... file operations ...
9000 ! Error handler
IF ERR = 4152 THEN
    PRINT "File not found!"
    STOP
END IF
RETRY
```

### Tips for AI Code Generation

1. **Always use line numbers** - Required for every statement
2. **String variables end with $** - This is mandatory
3. **Comments have three styles**:
   - `!` for single-line comments (most common)
   - `/* ... */` for multi-line comments
   - `/** ... */` for JavaDoc-style function documentation
4. **Abbreviations are common** - PR for PRINT, etc.
5. **Case doesn't matter** - Keywords can be any case
6. **Default string length is 18** - Use DIM to specify longer
7. **Arrays are 1-based** - First element is (1), not (0)
8. **Multiple statements per line** - Separate with :
9. **GOTO is acceptable** - Common in BR! programs
10. **Subroutines use GOSUB/RETURN** - Not CALL
11. **Document functions with JavaDoc** - Use `@param` and `@returns` tags

This grammar reference provides comprehensive coverage of the Business Rules! language for AI-assisted code reading and generation.
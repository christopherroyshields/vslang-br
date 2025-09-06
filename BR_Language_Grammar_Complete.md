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
9. [Screen Operations](#screen-operations)
10. [Libraries](#libraries)
11. [File Operations](#file-operations)
12. [Printing Operations](#printing-operations)
13. [Multi-User Programming](#multi-user-programming)
14. [Error Handling](#error-handling)
15. [Help Facility](#help-facility)
16. [Program Structure](#program-structure)
17. [Commands](#commands)
18. [Procedures](#procedures)
19. [Configuration (BRConfig.sys)](#configuration-brconfig-sys)
20. [JSON and Data Store](#json-and-data-store)
21. [Web Integration](#web-integration)
22. [Client Server](#client-server)
23. [Syntax Quick Reference](#syntax-quick-reference)

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

### Syntax vs Semantic Rules

#### Syntax Rules
- **Definition**: Rules about the parts of a statement and their order
- **Purpose**: Define valid structure and format
- **Examples**:
  - Variable must appear on left side of = in LET
  - Line numbers must be integers 1-99999
  - String variable names must end with $
- **Violations**: Result in syntax errors

#### Semantic Rules
- **Definition**: Rules about the meaning or purpose of a statement
- **Purpose**: Define what statements do when executed
- **Examples**:
  - LET evaluates right side, assigns to left side
  - INPUT waits for user data entry
  - PRINT displays output
- **Violations**: May not cause errors but produce incorrect results

**Key Distinction**: Syntax is about form, semantics is about function

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
```

**Purpose**: Add non-executable documentation to code

**Characteristics**:
- Completely ignored by BR! during execution
- Can appear anywhere on a line after `!`
- Preserves case (not converted to uppercase)
- Used for readability and documentation

**Examples**:
```business-rules
00001 ! ========================================
00002 ! Program: MILEAGE
00003 ! Author: Your Name
00004 ! Date: 2024-01-15
00005 ! Purpose: Calculate miles per gallon
00006 ! ========================================
00020 INPUT MI CONV 80    ! MI = Number of miles
00040 INPUT GAL CONV 80   ! GAL = Number of gallons
00050 LET MPG = MI / GAL  ! Calculate miles per gallon
```

**Best Practices**:
- Use header comments for program identification
- Document variable purposes
- Explain complex logic
- Note modifications and version history

### Identifiers
```bnf
<identifier> ::= <letter> { <letter> | <digit> | '_' }*
```
- 1-30 characters
- Must start with a letter (except FN)
- Cannot be reserved words
- Case insensitive

### Line Labels
```bnf
<line-label> ::= <identifier> ':'
<line-ref> ::= <line-number> | <line-label>
```

**Purpose**: Provide meaningful names for program lines

**Characteristics**:
- Must appear immediately after line number
- Followed by colon (:)
- Can be used anywhere a line number is expected
- Must be unique within program
- Can have same name as keywords or variables

**Syntax**:
```business-rules
<line-number> <label>: <statement>
```

**Examples**:
```business-rules
00020 INPUT MI CONV CONVRSN     ! Reference to label
00050 FORMULA: LET MPG = MI/GAL ! Label definition
00080 CONVRSN: PRINT "Please enter numbers, not letters."
00090 RETRY
00100 GOTO FORMULA               ! Jump to labeled line
```

**Benefits**:
- Improves code readability
- Makes maintenance easier
- Self-documenting for error handlers
- Easier to remember than line numbers

## Data Types

### Numeric
```bnf
<numeric-literal> ::= <integer> | <floating-point>
<integer> ::= [+|-] <digit>+
<floating-point> ::= [+|-] <digit>+ '.' <digit>* [E[+|-]<digit>+]
```

#### Numeric Constants
- **Rules**:
  1. May include digits 0-9, optional decimal point, optional sign (+/-)
  2. Sign must be at the beginning if included
  3. Cannot include commas (use PIC for display formatting)
  4. Negative numbers must begin with minus sign
  5. No sign implies positive
  6. Up to 15 significant digits
  7. Scientific notation supported (E notation)

- **Types**:
  - **Integer**: Whole number without decimal fraction
  - **Fixed-point**: Number with decimal fraction
  - **Scientific**: Using E notation (e.g., 1.23E+10)

- **Examples**:
  ```business-rules
  10      ! Integer constant
  -10     ! Negative integer
  +10     ! Explicit positive integer
  12.34   ! Fixed-point number
  12.     ! Valid (trailing decimal)
  -12.3   ! Negative fixed-point
  1.5E+6  ! Scientific notation (1,500,000)
  ```

- **Invalid Examples**:
  ```business-rules
  10-     ! Sign must be at beginning
  12,345  ! No commas allowed
  $100.10 ! No currency symbols
  12+3    ! Cannot combine operations
  ```

#### Special Numeric Constants
- **inf**: Represents infinity (highest possible number in BR!)
  - Value: Approximately 1E+307 (10^307)
  - Used in substring operations to represent end of string
  - Example: `S$(inf:inf) = "END"` appends to end of string
  - Useful for open-ended ranges and comparisons

### String
```bnf
<string-literal> ::= '"' <any-char-except-quote>* '"'
                  | "'" <any-char-except-apostrophe>* "'"
```

#### String Constants
- **Delimiters**: Either double quotes (") or single quotes (')
- **Embedded quotes**:
  - Use opposite delimiter type
  - Or double the quote character ("" inside double-quoted string)
- **Default max length**: 18 characters
- **Extended length**: Use DIM statement to specify up to 32767 characters

#### Examples:
```business-rules
"Hello, world!"              ! Double-quoted string
'Hello, world!'              ! Single-quoted string
"Bruno's computer"           ! Apostrophe inside double quotes
'He said "Hello"'           ! Double quotes inside single quotes
"He said ""Hello"""       ! Doubled quotes for embedding
```

### Arrays

Arrays in BR! are lists of values assigned to a single variable name, allowing reference by array name and index/subscript. Arrays are fundamental for handling collections of related data efficiently. Also called matrices, arrays can hold numeric or string values and support multiple dimensions.

#### Array Size Limits (Version 3.90+)
- **Legacy limit**: Arrays were previously limited to 64KB
- **Expanded arrays**: Arrays can now occupy up to 512KB of memory
- **Performance**: Sort and index operations utilize significantly more memory for better performance

#### Array Concepts

##### Subscripted vs Unsubscripted Variables
- **Unsubscripted variable**: Single value (e.g., `TEMP = 72`)
- **Subscripted variable**: Multiple values referenced by position (e.g., `TEMP(1) = 6`, `TEMP(2) = 17`)
- **Subscript**: Position number in parentheses (always starts at 1 by default)

##### Array Benefits
- Reduces variable management complexity
- Enables efficient loop processing
- Simplifies related data handling
- Supports mathematical operations on entire datasets

Example comparison:
```business-rules
! Without arrays - 24 separate variables needed:
00010 LET SPJAN=6
00020 LET SPFEB=17
00030 LET NYJAN=27
00040 LET NYFEB=37

! With arrays - 2 variables hold all values:
00050 DIM SPTEMP(12), NYTEMP(12)
00060 LET SPTEMP(1)=6    ! January St. Paul temp
00070 LET SPTEMP(2)=17   ! February St. Paul temp
00080 LET NYTEMP(1)=27   ! January New York temp
00090 LET NYTEMP(2)=37   ! February New York temp
```

#### Array Declaration (DIM Statement)
```bnf
<array-declaration> ::= DIM <array-name> '(' <dimension> [',' <dimension>]* ')' ['*' <max-length>]
<dimension> ::= <integer-constant> | <numeric-expression>
```

**Purpose**: Reserve memory space and specify array dimensions before use

**Key Rules**:
- Must specify number of elements before assigning values
- Dimension must be integer (not variable in original syntax)
- Can dimension multiple arrays in one statement (comma-separated)
- Non-executable (processed before program runs)
- Can appear anywhere in program (typically at beginning/end)
- Arrays with ≤10 elements don't require DIM (auto-dimensioned to 10)

Examples:
```business-rules
00050 DIM SPTEMP(12), NYTEMP(12)     ! Two 12-element numeric arrays
00060 DIM EMPLOYEE$(14)*30           ! 14-element string array, max 30 chars
00070 DIM SCORES(100)                 ! 100-element numeric array
00080 DIM MATRIX(5,4)                 ! 5x4 two-dimensional array
00090 DIM DATA$(5,3,2)*20             ! Three-dimensional string array
```

#### Array Characteristics
- **1-based indexing**: Default first element is index 1 (not 0)
- **Dynamic redimensioning**: Arrays can be resized at runtime using MAT
- **Multiple dimensions**: Support for 1 to 7 dimensions
- **Contiguous elements**: Elements stored consecutively in memory
- **Type consistency**: All elements must be same type (numeric or string)
- **Default values**: Numeric arrays initialize to 0, string arrays to empty string

#### Array Types
```bnf
<numeric-array> ::= <identifier> '(' <subscript-list> ')'
<string-array> ::= <identifier> '$' '(' <subscript-list> ')'
<subscript-list> ::= <subscript> [',' <subscript>]*
```

#### One-Dimensional Arrays

Linear arrays for simple lists of values:

##### Assigning Values - Multiple Methods

**Method 1: Individual LET statements**
```business-rules
00070 DIM SPTEMP(12)
00080 LET SPTEMP(1)=6
00090 LET SPTEMP(2)=17
00100 LET SPTEMP(3)=38
! ... continue for all 12 elements
```

**Method 2: READ/DATA statements**
```business-rules
00070 DIM SPTEMP(12)
00080 DATA 6,17,38,49,66,75,93,84,77,67,42,22
00090 READ SPTEMP(1),SPTEMP(2),SPTEMP(3)  ! ... list all 12
```

**Method 3: FOR/NEXT loop (most efficient)**
```business-rules
00070 DIM SPTEMP(12), NYTEMP(12)
00080 DATA 6,17,38,49,66,75,93,84,77,67,42,22
00090 DATA 27,37,52,69,73,84,92,83,79,78,50,43
00100 FOR J=1 TO 12
00110   READ SPTEMP(J)
00120 NEXT J
00130 FOR K=1 TO 12
00140   READ NYTEMP(K)
00150 NEXT K
```

**Method 4: INPUT with loop**
```business-rules
00060 DIM EMPLOYEE$(14)
00070 FOR X=1 TO 14
00080   PRINT "Enter employee's name"
00090   INPUT EMPLOYEE$(X)
00100 NEXT X
```

**Method 5: MAT READ (fastest)**
```business-rules
00040 DIM SPTEMP(12)
00050 DATA 6,17,38,49,66,75,93,84,77,67,42,22
00060 READ MAT SPTEMP    ! Reads all 12 values at once
```

##### Array Arithmetic Operations

**Between Arrays**:
```business-rules
00170 DIM TEMPDIF(12)
00180 FOR C=1 TO 12
00190   LET TEMPDIF(C)=SPTEMP(C)-NYTEMP(C)  ! Element-wise subtraction
00200   PRINT SPTEMP(C),NYTEMP(C),TEMPDIF(C)
00210 NEXT C
```

**Within Arrays (Aggregation)**:
```business-rules
00210 FOR A=1 TO 12
00220   LET SPAV=SPAV+SPTEMP(A)   ! Sum all elements
00230   LET NYAV=NYAV+NYTEMP(A)
00240 NEXT A
00250 LET SPAV=SPAV/12           ! Calculate average
00260 LET NYAV=NYAV/12
00270 PRINT SPAV,NYAV
```

#### Two-Dimensional Arrays (Matrices)

Rectangular arrays with rows and columns:

```bnf
<2d-array-declaration> ::= DIM <array-name> '(' <rows> ',' <columns> ')'
```

**Referencing Elements**: `ARRAY(row,column)` - row always specified first

Example - 5x4 Powers table:
```business-rules
00040 DIM POWERS(5,4)
! Element POWERS(2,1) = value at row 2, column 1
! Element POWERS(3,4) = value at row 3, column 4
```

##### Assigning Values to 2D Arrays

**Method 1: Nested FOR/NEXT loops**
```business-rules
00050 DIM POWERS(5,4)
00060 FOR ROW=1 TO 5
00070   FOR COL=1 TO 4
00080     READ POWERS(ROW,COL)
00090   NEXT COL
00100 NEXT ROW
```

**Method 2: MAT READ (row-by-row order)**
```business-rules
00040 DIM POWERS(5,4)
00050 DATA 1,1,1,1,2,4,8,16,3,9,27,81,4,16,64,256,5,25,125,625
00060 READ MAT POWERS    ! Fills all 20 elements
```

##### Column and Row Operations

**Column Arithmetic**:
```business-rules
00140 DIM SUMCOL(4)
00150 FOR C=1 TO 4
00160   FOR R=1 TO 3
00170     LET SUMCOL(C)=SUMCOL(C)+SCORES(R,C)
00180   NEXT R
00190   PRINT SUMCOL(C)/3    ! Column average
00200 NEXT C
```

**Row Arithmetic**:
```business-rules
00200 DIM SUMROW(3)
00210 FOR R=1 TO 3
00220   FOR C=1 TO 4
00230     LET SUMROW(R)=SUMROW(R)+SCORES(R,C)
00240   NEXT C
00250   PRINT SUMROW(R)/4    ! Row average
00260 NEXT R
```

#### Dimension Examples
- **One-dimensional**: `DIM AGE_COUNTS(120)` - Linear array for simple lists
- **Two-dimensional**: `DIM OFFICE_COUNTS(40,5)` - Rectangular array (matrix)
- **Three-dimensional**: `DIM TEMPERATURES(99,99,24)` - Cubic array for 3D data
- **Multi-dimensional**: Up to 7 dimensions supported for complex data structures

## Variables and Identifiers

### Variable Types

#### Numeric Variables
```bnf
<numeric-variable> ::= <identifier>
```
- **Purpose**: Store numbers for arithmetic operations
- **Default value**: 0 (zero)
- **Naming**: Must start with letter, can contain letters, digits, underscore
- **Examples**: `MI`, `GAL`, `MPG`, `AMOUNT`, `X`, `TOTAL_COST`

#### String Variables
```bnf
<string-variable> ::= <identifier> '$'
```
- **Purpose**: Store text data (letters, numbers, symbols)
- **Default value**: Empty string (zero length/null string)
- **Naming**: Must end with $ sign
- **Examples**: `NAME$`, `ADDRESS$`, `PHONE$`, `COUNTRY$`
- **Note**: Cannot perform arithmetic even if value is numeric

#### Array Variables
```bnf
<array-variable> ::= <identifier> '(' <subscript> [',' <subscript>]* ')'
```

### Variable Characteristics

#### Memory and Values
- **Persistent memory**: Variables retain values until:
  - New value assigned
  - CLEAR command executed
  - RUN command (resets all to defaults)
  - LOAD command (performs implicit CLEAR)
  - Exit Business Rules!
- **Case insensitive**: `NAME$`, `name$`, and `Name$` are the same variable
- **Implicit declaration**: Variables created on first use

#### Naming Rules
- Must begin with a letter (except FN for functions)
- Maximum 30 characters
- Can contain: letters, digits, underscore (_)
- Cannot contain spaces or special characters (except $ at end for strings)
- Cannot be reserved keywords

### Declaration
```bnf
DIM <variable-list>
<variable-list> ::= <variable-declaration> [',' <variable-declaration>]*
<variable-declaration> ::= <numeric-variable>
                        | <string-variable> '*' <max-length>
                        | <array-variable>
```

#### DIM Statement Details
- **Purpose**: Specify maximum length for string variables and declare arrays
- **String dimensioning**: Required when string exceeds 18 characters
- **Syntax**: `DIM variable$*length` where `*` separates name from length
- **Maximum vs Actual length**:
  - DIM sets maximum possible length
  - Actual length can be less or even zero (null string)
  - Use `LEN(string$)` function to get current actual length

#### Examples:
```business-rules
00100 DIM NAME$*30, AMOUNT, SCORES(100), MATRIX(10,10)
00110 DIM COUNTRY$*50       ! String with max 50 chars
00120 DIM LONG_MESSAGE$*80  ! Allow 80 characters
00130 DIM BUFFER$*255       ! Large buffer
00140 DIM NAMES$(100)*30    ! Array of 100 strings, each max 30 chars
```

#### String Overflow Error (SOFLOW)
When input exceeds dimensioned length, a string overflow error occurs.

```business-rules
00010 DIM MESSAGE$*50
00020 INPUT MESSAGE$ SOFLOW 100  ! Handle overflow at line 100
00100 PRINT "Message too long, please try again"
00110 RETRY
```

## Operators and Expressions

### Operator Precedence (highest to lowest)
| Level | Operators | Description | Example |
|-------|-----------|-------------|----------|
| 1 | `()` `[]` | Grouping, array indexing | `(5+3)*2`, `ARRAY(5)` |
| 2 | `^` `**` | Exponentiation | `2**3` = 8 |
| 3 | `*` `/` `MOD` | Multiplication, division, modulo | `10/2`, `7 MOD 3` |
| 4 | `+` `-` | Addition, subtraction | `5+3`, `10-7` |
| 5 | `&` | String concatenation (joining strings) | `"Hi" & " there"` |
| 6 | `=` `==` `<>` `><` `<` `>` `<=` `=<` `>=` `=>` | Comparison/Relational | `X > 10` |
| 7 | `NOT` `~` | Logical NOT (negation) | `NOT FOUND` |
| 8 | `AND` | Logical AND | `X>0 AND Y>0` |
| 9 | `OR` | Logical OR | `A=1 OR B=1` |

#### Algebraic Hierarchy Rules
When evaluating complex expressions:
1. **Parentheses** - Innermost first
2. **Exponents** - Powers and roots
3. **Multiplication/Division** - Left to right
4. **Addition/Subtraction** - Left to right

**Memory Aid**: PEMDAS or "Please Excuse My Dear Aunt Sally"
- Please (Parentheses)
- Excuse (Exponents)
- My (Multiplication)
- Dear (Division)
- Aunt (Addition)
- Sally (Subtraction)

**Example Evaluation**:
```business-rules
((5+1)*(1+2))+2**3/4
  = (6*3)+2**3/4       ! Parentheses first
  = 18+2**3/4          ! More parentheses
  = 18+8/4             ! Exponentiation
  = 18+2               ! Division
  = 20                 ! Addition
```

### Expression Types
```bnf
<expression> ::= <numeric-expression> | <string-expression> | <relational-expression>
<numeric-expression> ::= <numeric-term> [ <numeric-operator> <numeric-term> ]*
<string-expression> ::= <string-term> [ '&' <string-term> ]*
                      | <string-variable> '(' <start> ':' <end> ')'
<substring> ::= <string-expr> '(' <numeric-expr> ':' <numeric-expr> ')'
```

### String Operations

#### Concatenation
Concatenation joins two or more strings using the ampersand (&) operator.

```bnf
<concatenation> ::= <string-expr> '&' <string-expr> [ '&' <string-expr> ]*
```

**Examples**:
```business-rules
00100 A$ = "Hello"
00110 B$ = "World"
00120 C$ = A$ & " " & B$      ! Result: "Hello World"
00130 PRINT "Name: " & NAME$ & ", Age: " & STR$(AGE)
```

#### Substrings
Substrings extract or modify portions of a string using position notation.

```bnf
<substring> ::= <string-variable> '(' <start-pos> ':' <end-pos> ')'
```

**Position Parameters**:
- `start-pos`: Starting position (1-based)
- `end-pos`: Ending position (inclusive)
- `0`: Insert at beginning when used as both start and end
- `inf`: Represents end of string (infinity)

**Substring Operations**:

1. **Extraction** (right side of assignment):
```business-rules
00100 S$ = "ABCDEF"
00110 PART$ = S$(2:4)    ! Result: "BCD"
00120 FIRST$ = S$(1:1)   ! Result: "A"
00130 LAST$ = S$(6:6)    ! Result: "F"
```

2. **Replacement** (left side of assignment):
```business-rules
00200 X$ = "ABCD"
00210 X$(2:3) = "23"     ! Result: "A23D"
```

3. **Deletion** (replace with empty string):
```business-rules
00300 Y$ = "ABCD"
00310 Y$(2:3) = ""       ! Result: "AD"
```

4. **Insertion**:
```business-rules
00400 Z$ = "ABCD"
00410 Z$(2:0) = "123"    ! Insert at position 2, Result: "A123BCD"
00420 Z$(0:0) = "Start"  ! Insert at beginning
00430 Z$(inf:inf) = "End" ! Append to end
```

**Important Notes**:
- String must be dimensioned large enough for insertions
- Attempting to insert string longer than substring range causes error
- Variables can be used for positions: `S$(A:B)`
- Positions outside string bounds are handled gracefully
<relational-expression> ::= <expression> <relational-operator> <expression>
```

### Relational Operators and Expressions

**Purpose**: Perform comparisons between two operands, returning true (1) or false (0)

#### Relational Operators
| Operator | Alternative | Description |
|----------|-------------|-------------|
| `<` | | Less than |
| `>` | | Greater than |
| `=` | `==` | Equal to |
| `<>` | `><` | Not equal to |
| `<=` | `=<` | Less than or equal to |
| `>=` | `=>` | Greater than or equal to |

#### Key Characteristics
- Work with both numeric and string values
- Always return 1 (true) or 0 (false)
- String comparisons are character-by-character using ASCII values
- Case-sensitive for string comparisons

#### Operator Types
- **Binary operators**: Require two operands (e.g., `+`, `-`, `=`, `<`)
- **Unary operators**: Require one operand (e.g., `NOT`, `~`)

#### Negation Operator
- `NOT` or `~`: Returns opposite of operand's truth value
- `NOT` is preferred for readability
- Example: `IF NOT X > 0 THEN PRINT "X is not positive"`

#### String Comparisons
- Compared character-by-character left to right
- Based on ASCII table values
- Stops at first unequal character pair
- Examples:
  ```business-rules
  00010 IF "a" < "b" THEN PRINT "a is less than b"     ! True
  00020 IF "Aaron" > "Aardvark" THEN PRINT "Aaron > Aardvark"  ! True (o > d)
  ```

#### Logical Operators with Relational Expressions

##### AND Operator
- Both conditions must be true for expression to be true
- Processed before OR in mixed expressions
- Truth table:
  | Condition1 | Condition2 | Result |
  |------------|------------|--------|
  | true | true | true |
  | true | false | false |
  | false | true | false |
  | false | false | false |

##### OR Operator
- At least one condition must be true for expression to be true
- Processed after AND in mixed expressions
- Truth table:
  | Condition1 | Condition2 | Result |
  |------------|------------|--------|
  | true | true | true |
  | true | false | true |
  | false | true | true |
  | false | false | false |

##### Operator Precedence in Complex Expressions
1. Parentheses evaluated first
2. NOT processed before AND and OR
3. AND processed before OR
4. OR processed last
5. Left to right for same precedence

**Examples**:
```business-rules
00100 IF X > 10 AND Y < 5 THEN GOTO 500
00110 IF NAME$ = "John" OR NAME$ = "JOHN" OR NAME$ = "john" THEN GOTO 200
00120 IF (A > 0 OR B > 0) AND C = 100 THEN PRINT "Valid"
00130 IF NOT SCORE >= 0 THEN GOTO SCORE_PROMPT
```

## Statements

### Assignment

#### LET Statement
```bnf
[LET] <variable> = <expression>
```

**Purpose**: Assigns values to variables and performs calculations

**Syntax Forms**:
- Explicit: `LET variable = value`
- Implicit: `variable = value` (LET is optional)

**Examples**:
```business-rules
00050 LET MPG = MI/GAL          ! Calculate miles per gallon
00060 LET NAME$ = "John Smith"   ! Assign string value
00070 LET TOTAL = 100           ! Assign numeric constant
00080 PUMA = COUGAR            ! Implicit LET - copy variable
00090 X = Y * 2 + Z            ! Implicit LET - formula
```

**String Assignment Rules**:
- String values must be enclosed in quotes
- Cannot perform arithmetic on string variables
```business-rules
00100 LET CITY$ = "New York"    ! Correct
00110 LET ZIP$ = "10001"        ! Numbers stored as string
00120 ! LET RESULT = ZIP$ * 2   ! ERROR - can't multiply strings
```

**Immediate Mode Assignment** (without line numbers):
```
MI = 300       ! Sets MI to 300 and prints result
NAME$ = "Bob"  ! Sets NAME$ and prints result
```
LET is optional and usually omitted.

### MAT Statement (Matrix/Array Operations)

The MAT statement provides powerful array operations including initialization, copying, arithmetic, sorting, and redimensioning. MAT operations are significantly faster than equivalent loop-based operations.

#### MAT Syntax
```bnf
MAT <array-name> [(<dimension>[,...])] = {
    (<string-expression>) |
    (<numeric-expression>) |
    <array-name> |
    (<numeric-expression>) <math-operator> <numeric-array> |
    <numeric-array> +|- <numeric-array> |
    AIDX(<array-name>) |
    DIDX(<array-name>) |
    (<numeric-expression>) <math-operator> <numeric-array>
}
```

#### Core MAT Operations

##### Array Initialization
Sets all elements to the same value:
```business-rules
00100 MAT A = (0)          ! Initialize all elements to 0
00110 MAT B$ = ("")        ! Initialize all string elements to empty
00120 MAT C = (100)        ! Initialize all elements to 100
00130 MAT SAL = (17900)     ! Initialize all salaries to 17900
```

##### Array Copying
Copies entire array contents:
```business-rules
00200 MAT A = B            ! Copy array B to array A
00210 MAT NAME$ = TEMP$   ! Copy string array
00220 MAT BACKUP = ORIGINAL ! Create backup copy
```

##### Array Arithmetic
Performs element-wise operations:
```business-rules
00300 MAT A = B + C        ! Element-wise addition
00310 MAT A = B - C        ! Element-wise subtraction
00320 MAT A = (10) * B     ! Multiply all elements by scalar
00330 MAT A = (1/X) * B    ! Divide all elements by scalar
00340 MAT A = (-1) * B     ! Negate all elements

! Practical example - 6.4% salary increase:
00350 MAT SAL = (1.064) * SAL  ! Apply raise to all salaries
```

**Important**: Scalar values must be in parentheses when used with operators

##### Array Redimensioning
Dynamically changes array size at runtime:
```business-rules
00400 DIM A(100), B(50)
00410 MAT A(200)           ! Increase to 200 elements
00420 MAT B(25)            ! Decrease to 25 elements
00430 MAT A(10,10) = A     ! Change from 100x1 to 10x10
00440 MAT B(N) = A         ! Copy A to B, resizing B to N elements

! Practical example - growing employee list:
00450 DIM SAL(5)
00460 ! ... later when adding 4 more employees:
00470 MAT SAL(9)           ! Expand array from 5 to 9 elements
```

**Notes**: 
- Existing values preserved when expanding
- Extra values lost when shrinking
- Cannot exceed original DIM size without re-DIMming

##### Array Sorting (Index Generation)
Creates index arrays for sorted access without modifying original:
```business-rules
00500 DIM CUST$(5)*20, ORDER(5)
00510 DATA "Smith","Jones","Adams","Wilson","Brown"
00520 READ MAT CUST$
00530 MAT ORDER = AIDX(CUST$)   ! Generate ascending index

! Print in alphabetical order using index:
00540 FOR I = 1 TO 5
00550    PRINT CUST$(ORDER(I))  ! Prints: Adams, Brown, Jones, Smith, Wilson
00560 NEXT I

! Original array unchanged:
00570 PRINT CUST$(1)  ! Still prints "Smith"
```

**AIDX (Ascending Index)**:
- Numeric arrays: Lowest to highest
- String arrays: Alphabetical order (A to Z)

**DIDX (Descending Index)**:
- Numeric arrays: Highest to lowest  
- String arrays: Reverse alphabetical (Z to A)

Example with numeric array:
```business-rules
00600 DIM SCORES(5), INDEX(5)
00610 DATA 85,92,78,95,88
00620 READ MAT SCORES
00630 MAT INDEX = DIDX(SCORES)  ! Descending index

00640 PRINT "Scores from highest to lowest:"
00650 FOR I = 1 TO 5
00660    PRINT SCORES(INDEX(I))  ! Prints: 95, 92, 88, 85, 78
00670 NEXT I
```

#### MAT with I/O Operations

##### MAT with READ
Assigns DATA values to entire array at once:
```business-rules
! One-dimensional array:
00600 DIM NAME$(5)*20, SAL(5)
00610 DATA Andrew,Rhonda,Silvia,Jack,Warren
00620 DATA 17900,89500,26500,86000,47000
00630 READ MAT NAME$       ! Read all 5 names
00640 READ MAT SAL         ! Read all 5 salaries

! Two-dimensional array (row-by-row order):
00700 DIM MATRIX(3,4)
00710 DATA 1,2,3,4,5,6,7,8,9,10,11,12
00720 READ MAT MATRIX      ! Fills: row 1: 1,2,3,4; row 2: 5,6,7,8; etc.
```

**Advantages over loop-based READ**:
- Faster execution
- Cleaner, more readable code
- Automatic size matching with DIM

##### MAT with PRINT
Outputs all array elements:
```business-rules
00800 PRINT MAT NAMES$     ! Prints all elements space-separated
00810 PRINT MAT VALUES     ! Numeric array output

! Output formatting:
00820 DIM ITEMS$(3)*10
00830 MAT ITEMS$ = ("Test")
00840 PRINT MAT ITEMS$     ! Outputs: Test Test Test
```

**Note**: Elements printed on same line, space-separated

##### MAT with File I/O
```business-rules
00900 READ #1, USING FORM$: MAT DATA$, MAT DATA
00910 WRITE #1, USING FORM$: MAT DATA$, MAT DATA
00920 REWRITE #1, USING FORM$: MAT DATA$, MAT DATA
00930 PRINT #1, USING FORM$: MAT REPORT$
```

#### MAT Subarray Operations (4.2+)
```business-rules
00900 MAT A(6:10) = B      ! Copy B(1:5) to A(6:10)
00910 MAT B = A(6:10)      ! Copy A(6:10) to B, resize B to 5
00920 MAT B(1:5) = A(6:10) ! Copy portion to portion
00930 READ MAT A(1:5)      ! Read only elements 1-5
00940 PRINT FIELDS SF$: MAT A$(F:F+9) ! Display 10 elements starting at F
```

#### MAT Grouping in Full-Screen I/O
```business-rules
01000 ! Alternate input between arrays B$ and C
01010 INPUT FIELDS A$: (MAT B$, MAT C), X$
01020 ! Equivalent to: B$(1),C(1),B$(2),C(2),...
```

### Input/Output

#### INPUT Statement
```bnf
INPUT [#<file-num> ':'] [<prompt> ','] <variable-list> [<error-condition>]*
<error-condition> ::= CONV <line-ref>
                   | SOFLOW <line-ref>
                   | EOF <line-ref>
```

**Purpose**: Accept user input and assign to variables

**Basic Syntax**:
```business-rules
00020 INPUT MI                   ! Simple input
00030 INPUT "Enter name: ", NAME$ ! With prompt
00040 INPUT MI, GAL              ! Multiple variables
```

**With Error Handling**:
```business-rules
00020 INPUT MI CONV 80           ! Handle conversion error
00040 INPUT GAL CONV CONVRSN     ! Use line label
00050 INPUT #1: CUSTNO EOF 900   ! File input with EOF handling
```

**Error Conditions**:
- **CONV**: Handles conversion errors (letters entered for numeric)
- **SOFLOW**: String overflow (input exceeds max length)
- **EOF**: End of file reached

**INPUT Mode Behavior**:
- Status line shows "INPUT" prompt
- Program waits for user entry
- ENTER key required to submit
- Type checking enforced for numeric variables

#### PRINT Statement
```bnf
PRINT [#<file-num> ':'] [<print-list>]
<print-list> ::= <expression> [';'|',' <expression>]*
```

**Dual Usage**:
- **As Command**: Executes immediately (no line number)
- **As Statement**: Part of program (requires line number)

**Special Features**:
- **Calculator Mode**: `PRINT 6+4` displays `10`
- **Implicit PRINT**: Expression alone assumes PRINT (e.g., `6+4` prints `10`)
- **String Delimiters**: Use `" "` or `' '` to print literal text
  - `PRINT "6+4"` displays `6+4` (literal)
  - `PRINT 6+4` displays `10` (calculated)

**Examples**:
```business-rules
! Command mode (immediate execution)
PRINT 8*4                                        ! Displays 32
PRINT "Hello World"                             ! Displays Hello World
PRINT 'Single quotes work too'                  ! Displays Single quotes work too

! Statement mode (in program)
00010 PRINT "Total number of miles?"            ! String literal
00060 PRINT "Miles Per Gallon="; MPG            ! Mixed output
00070 PRINT NAME$; " is "; AGE; " years old."   ! Multiple items
```

**Separator Usage**:
- `;` (semicolon): No spacing between items
- `,` (comma): Tab to next print zone

**Mathematical Operations**:
- Uses standard algebraic precedence
- `*` for multiplication, `/` for division
- Parentheses override precedence

#### LINPUT Statement
```bnf
LINPUT [#<file-num> ':'] [<prompt> ','] <string-variable>
```
**Purpose**: Input entire line including special characters

#### READ Statement (Data Table)
```bnf
READ <variable-list>
```

**Purpose**: Read values from DATA statements into variables

**Characteristics**:
- Accesses values from internal data table
- Data pointer advances after each READ
- Error if no more data available

Examples:
```business-rules
00100 DATA 100,200,300
00110 READ X,Y,Z             ! X=100, Y=200, Z=300
00120 DATA "John","Doe",25
00130 READ FIRST$,LAST$,AGE  ! String and numeric mixed
```

#### DATA Statement
```bnf
DATA <value1> [,<value2>] [,...]
```

**Purpose**: Define values for READ statements

**Characteristics**:
- Non-executable (skipped in program flow)
- All DATA statements combined into single table
- Order determined by line numbers
- Values can be numeric or string constants

Examples:
```business-rules
00100 DATA 1,2,3,4,5
00110 DATA "Apple","Banana","Cherry"
00120 DATA 3.14159, "PI", 2.71828, "E"
```

#### RESTORE Statement
```bnf
RESTORE [<line-ref>]
```

**Purpose**: Reset DATA pointer to beginning or specific DATA statement

Examples:
```business-rules
00300 RESTORE              ! Reset to first DATA item
00310 RESTORE 200          ! Reset to DATA at line 200
```

### Formatted I/O
```bnf
PRINT USING <line-ref> ':' <expression-list>
INPUT FIELDS <field-spec> ':' <variable-list>
RINPUT FIELDS <field-spec> ':' <variable-list>
PRINT FIELDS <field-spec> ':' <expression-list>
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

#### IF Statement
```bnf
IF <condition> THEN <statement-or-line> [ELSE <statement-or-line>]
IF <condition> THEN <statement-or-line> [ELSE IF <condition> THEN <statement-or-line>]* [ELSE <statement-or-line>]
IF <condition> THEN
    <statements>
[ELSE IF <condition> THEN
    <statements>]*
[ELSE
    <statements>]
END IF
```

**Purpose**: Conditional branching statement with one or more possible branches

**Key Characteristics**:
- Executes first branch where condition is true
- Only one branch executes, never more
- Evaluates conditions sequentially until one is true
- ELSE branch executes if no conditions are true
- Single-line form does not require END IF
- Multi-line form requires END IF

**Truth Values**:
- True evaluates to 1
- False evaluates to 0
- Any non-zero number evaluates to true in IF statement
- Single strings cannot be used as conditions

**Examples**:
```business-rules
00070 IF CHOICE = 1 THEN PRINT "Video games cost $17.99 each"
00090 IF CHOICE = 2 THEN PRINT "DVDs cost $14.00 each" ELSE PRINT "Item not recognized"

! Multi-line IF with ELSE IF
00100 IF AGE <= 5 THEN
00110    PRINT "Kids get 50% off"
00120    LET DISCOUNT = 50
00130 ELSE IF AGE > 5 AND AGE < 65 THEN
00140    PRINT "Regular price"
00150    LET DISCOUNT = 0
00160 ELSE
00170    PRINT "Senior discount 20%"
00180    LET DISCOUNT = 20
00190 END IF
```

### Loops

#### FOR/NEXT Loops
```bnf
FOR <num-var> = <num-expr> TO <num-expr> [STEP <num-expr>]
    <statements>
NEXT <num-var>
```

**Purpose**: Create loops that execute a specified number of times

**Syntax Components**:
- `<num-var>`: Loop variable (any numeric variable)
- `<num-expr> TO <num-expr>`: Beginning and ending values
- `STEP <num-expr>`: Optional increment amount (default: 1)

**Execution Sequence**:
1. Loop variable assigned beginning value
2. Test if loop variable ≤ ending value (or ≥ if STEP is negative)
3. Execute statements within loop
4. Increment loop variable by STEP amount
5. Return to step 2 until condition fails
6. Continue with first statement after NEXT

**Key Characteristics**:
- Loop executes until loop variable exceeds ending value
- NEXT statement must specify same variable as FOR
- Loop variable can be used in expressions within loop
- Variable retains final value after loop exits
- Statements within loop typically indented for readability

**Examples**:
```business-rules
! Basic loop
00010 FOR X = 1 TO 10
00020   PRINT X
00030 NEXT X

! Loop with STEP
00100 FOR T = 10 TO -10 STEP -1
00110   PRINT T
00120 NEXT T

! Loop variable in calculations
00200 FOR NUMBER = 1 TO 12
00210   LET PRODUCT = TABLE * NUMBER
00220   PRINT TABLE; "x"; NUMBER; "="; PRODUCT
00230 NEXT NUMBER

! Using expressions for bounds
00300 FOR I = N*.5 TO N*2 STEP 5
00310   ! Process...
00320 NEXT I
```

#### Nested FOR/NEXT Loops

**Rules for Nesting**:
- Inner loop must be entirely contained within outer loop
- Inner loop executes completely for each outer loop iteration
- BR! allows up to 20 levels of nesting
- Loops cannot partially overlap

**Execution Pattern**:
```business-rules
00010 FOR A = 1 TO 4           ! Outer loop: executes 4 times
00020   PRINT "A"
00030   FOR B = 1 TO 2         ! Inner loop: executes 2×4=8 times total
00040     PRINT TAB(5);"B"
00050   NEXT B
00060 NEXT A
```

**Correct vs Incorrect Nesting**:
```business-rules
! CORRECT - Properly nested
00010 FOR T = 1 TO 6
00020   FOR N = 0 TO -3 STEP -1
00030   NEXT N
00040 NEXT T

! INCORRECT - Overlapping loops
00010 FOR T = 1 TO 6
00020   FOR N = 0 TO -3 STEP -1
00030   NEXT T    ! Wrong variable
00040 NEXT N
```

#### DO Loops
```bnf
DO [{WHILE|UNTIL} <condition>]
    <statements>
    [EXIT DO]
LOOP [{WHILE|UNTIL} <condition>]
```

**Purpose**: Flexible loops with condition testing at beginning or end

**Types**:
1. **DO WHILE**: Execute while condition is true
2. **DO UNTIL**: Execute until condition becomes true
3. **Condition at top**: Test before first execution
4. **Condition at bottom**: Always execute at least once

**Key Features**:
- No line labels or numbers required for loop structure
- Can exit early with EXIT DO statement
- More flexible than FOR/NEXT for complex conditions
- Continue until condition changes

**Examples**:
```business-rules
! Test at beginning
00010 LET X = 1
00020 DO WHILE X < 10
00030   PRINT "Hello Cat"
00040   LET X = X + 1
00050 LOOP

! Test at end (always executes once)
00100 DO
00110   INPUT "Enter password: ": PASSWORD$
00120 LOOP UNTIL PASSWORD$ = "SECRET"

! Exit on special condition
00200 DO
00210   READ #1: DATA$ EOF EXIT_LOOP
00220   IF DATA$ = "STOP" THEN EXIT DO
00230   ! Process data...
00240 LOOP
00250 EXIT_LOOP: !
```

#### ON GOTO Statement
```bnf
ON <num-expr> GOTO <line-ref> [',' <line-ref>]* [NONE <line-ref>]
```

**Purpose**: Conditional multi-way branching based on numeric expression value

**How it Works**:
1. Evaluates numeric expression
2. Rounds result to nearest integer
3. Branches to nth line-ref based on value (1=first, 2=second, etc.)
4. If value < 1 or > number of line-refs, uses NONE or continues to next line

**Examples**:
```business-rules
00080 INPUT "Day (1-5): ": DAY
00090 ON DAY GOTO 500, 1000, 1500, 2000, 2500
00100 PRINT "Invalid day": STOP

00500 PRINT "Monday": STOP
01000 PRINT "Tuesday": STOP
01500 PRINT "Wednesday": STOP
02000 PRINT "Thursday": STOP
02500 PRINT "Friday": STOP

! With NONE clause
00200 ON CHOICE GOTO 1000, 2000, 3000 NONE 100
```

#### ON GOSUB Statement
```bnf
ON <num-expr> GOSUB <line-ref> [',' <line-ref>]* [NONE <line-ref>]
```

**Purpose**: Call different subroutines based on numeric expression

**Key Difference from ON GOTO**:
- Transfers to subroutine that must end with RETURN
- Returns to statement after ON GOSUB when done
- Used for menu-driven programs

**Example**:
```business-rules
00120 INPUT "Choose bill (1-4): ": CHOICE
00130 ON CHOICE GOSUB ELEC, NATGAS, PHONE, CABLE
00140 PRINT "Continue with next bill?"

01000 ELEC: ! Electricity calculation
01010   ! Calculate...
01100 RETURN

02000 NATGAS: ! Natural gas calculation
02010   ! Calculate...
02100 RETURN
```

#### Common Loop Patterns

**Counting Loop**:
```business-rules
00100 FOR COUNT = 1 TO 100
00110   ! Process item COUNT
00120 NEXT COUNT
```

**Accumulator Loop**:
```business-rules
00200 LET TOTAL = 0
00210 FOR I = 1 TO N
00220   LET TOTAL = TOTAL + VALUES(I)
00230 NEXT I
```

**Time Delay Loop**:
```business-rules
00300 FOR DELAY = 1 TO 10
00310   SLEEP(1)  ! Wait 1 second
00320   IF EXISTS("file.dat") THEN EXIT FOR
00330 NEXT DELAY
```

**Input Validation Loop**:
```business-rules
00400 DO
00410   INPUT "Enter value (1-10): ": VALUE
00420 LOOP UNTIL VALUE >= 1 AND VALUE <= 10
```

**File Processing Loop**:
```business-rules
00500 DO
00510   READ #1: RECORD$ EOF DONE
00520   ! Process record
00530 LOOP
00540 DONE: CLOSE #1
```

### Branching Statements

#### GOTO Statement
```bnf
GOTO <line-ref>
```

**Purpose**: Unconditional branching statement that transfers program control to any line

**Characteristics**:
- Always transfers control regardless of conditions
- Target line must exist before SAVE/REPLACE
- Can create loops when branching backward
- Can skip code when branching forward

**Examples**:
```business-rules
00100 GOTO 450                     ! Jump to line 450
00110 GOTO MENU                    ! Jump to label MENU
00040 IF X < 10 THEN GOTO 20      ! Conditional use with IF
```

#### GOSUB and RETURN Statements
```bnf
GOSUB <line-ref>
RETURN
```

**Purpose**: Call a subroutine and return to calling point

**Subroutine Definition**:
- A set of lines separated from main program flow
- Can be executed multiple times
- Must end with RETURN statement
- Can contain any valid BR statements

**Key Characteristics**:
- GOSUB requires line-ref (line number or label)
- RETURN is required at end of subroutine
- Program returns to line after GOSUB when RETURN executed
- Maintains call stack in FLOWSTACK
- Maximum 50 active (nested) GOSUBs
- Subroutines can call other subroutines (nesting)

**Examples**:
```business-rules
00250 GOSUB SALESTAX              ! Call subroutine
00260 PRINT "Tax calculated"      ! Execution continues here after RETURN

10000 SALESTAX: ! Subroutine to calculate 6% sales tax
10010 PRINT "Enter purchase price"
10020 INPUT PRICE
10030 LET TAX = PRICE * 0.06
10040 RETURN                     ! Return to line 260

! Nested subroutines example
00040 GOSUB CALCULATE_TAX
00080 CALCULATE_TAX:
00090    GOSUB CHECK_TAX_FREE_WEEKEND
00100    IF TAX_FREE$ = "Y" THEN LET TAX = 0 ELSE LET TAX = PRICE * 0.06
00150    RETURN
00170 CHECK_TAX_FREE_WEEKEND:
00180    PRINT "Is today tax free? (Y/N)"
00190    INPUT TAX_FREE$
00200    RETURN
```

#### ON GOTO/GOSUB Statement
```bnf
ON <expression> {GOTO|GOSUB} <line-ref> [',' <line-ref>]*
```

**Purpose**: Multi-way branching based on numeric expression

**Examples**:
```business-rules
00100 ON CHOICE GOTO 1000, 2000, 3000, 4000
00110 ON MENU_OPTION GOSUB ADD_ROUTINE, EDIT_ROUTINE, DELETE_ROUTINE
```

#### EXIT Statement
```bnf
EXIT {FOR|DO}
```

**Purpose**: Early termination of loop structures

**Types**:
- `EXIT FOR`: Exits current FOR/NEXT loop
- `EXIT DO`: Exits current DO/LOOP structure

**Characteristics**:
- Transfers control to first statement after loop
- Only exits innermost loop when nested
- Useful for special conditions or early termination
- Can be used with conditional statements

**Examples**:
```business-rules
! Exit FOR loop on condition
00100 FOR I = 1 TO 100
00110   IF DATA$(I) = "STOP" THEN EXIT FOR
00120   PRINT DATA$(I)
00130 NEXT I
00140 ! Execution continues here after EXIT FOR

! Exit DO loop on special condition
00200 DO
00210   READ #1: RECORD$ EOF DONE
00220   IF RECORD$ = "END" THEN EXIT DO
00230   ! Process record
00240 LOOP
00250 ! Execution continues here after EXIT DO
00260 DONE: !
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

##### Core String Functions
- `CHR$(n)` - Character from ASCII code
- `STR$(n)` - Convert number to string
- `UPRC$(s$)` - Convert to uppercase
  ```business-rules
  PRINT UPRC$("hello")    ! Prints: HELLO
  
  ! Practical use - Standardize names for sorting
  00470 LET LASTNAME$(NEWSIZE)=UPRC$(ANSWERS$(2))
  ```
- `LWRC$(s$)` - Convert to lowercase
  ```business-rules
  PRINT LWRC$("HELLO")    ! Prints: hello
  ```
- `TRIM$(s$)` - Remove leading/trailing spaces
- `RPAD$(s$,n)` - Right pad to length n
- `LPAD$(s$,n)` - Left pad to length n
- `LEN(s$)` - Returns actual string length (not maximum)
  ```business-rules
  DIM NAME$*50
  NAME$ = "John"
  PRINT LEN(NAME$)        ! Prints: 4 (not 50)
  ```
- `RPT$(s$,n)` - Repeat string n times
  ```business-rules
  PRINT RPT$("*=", 10)    ! Prints: *=*=*=*=*=*=*=*=*=*=
  PRINT RPT$("-", 40)     ! Prints 40 dashes
  ```
- `SREP$(source$, search$, replace$)` - String replace (if available)
- `LOGIN_NAME$` - Returns current user's login name (3.83h+)
  - Can be used in BRConfig.sys with [LOGIN_NAME$] substitution
  ```business-rules
  PRINT "User: "; LOGIN_NAME$
  ! In BRConfig.sys: DRIVE G: G:\HOME\[LOGIN_NAME$] G:
  ```

##### System String Functions (No Parameters)
- `DATE$` - Current system date (yy/mm/dd format)
  ```business-rules
  PRINT DATE$             ! Prints: 24/03/15 (for March 15, 2024)
  ```
- `TIME$` - Current system time (hh:mm:ss format)
  ```business-rules
  PRINT TIME$             ! Prints: 14:30:45 (for 2:30:45 PM)
  ```

#### Y2K Date Functions (3.83+)

##### DAYS Function (Enhanced)
```bnf
DAYS(<date-value>[, <format-mask>])
```

**Y2K Enhancements (3.83+):**
- Now permits four-digit years even without 'C' in mask
- Utilizes current default date format (mdy/ymd/dmy)
- BASEYEAR processing applied to two-digit years
- If unsuccessful with 6-digit date, automatically tries century format

**3.90+ Enhancement:**
- Can store and perform date arithmetic on dates beginning with year 1700
- Uses negative numbers to denote dates before 1900

**Examples:**
```business-rules
! Pre-3.83: Required 'C' for century
DAYS(1001021,"YMD")     ! Treated as 001021
DAYS(1001021,"CYMD")    ! Treated as 1001021

! 3.83+: Automatic century detection
DAYS(1001021,"YMD")     ! Now automatically tries as CYMD if YMD fails
DAYS(991231,"YMD")      ! Uses BASEYEAR for 99 (1999 or 2099)
DAYS(001021,"YMD")      ! Uses BASEYEAR for 00 (1900 or 2000)
```

**Special Y2K Rules:**
- Year zero (00) with month and day zero = 0 (not 2000)
- Blank year receives BASEYEAR year value (3.83k+)

##### Date Storage Types (Y2K Compliant)
New FORM data types for Y2K-compliant date storage:

**DT (Date Type):**
- `DT 3`: 3-byte binary date storage
- `DT 4`: 4-byte binary date storage
- Uses days() processing with current date format
- Y2K compliant when used with proper BASEYEAR

**DL (Date Long):**
- `DL 3`: 3-byte binary date storage (long format)
- `DL 4`: 4-byte binary date storage (long format)
- Corresponds to BL storage format

**DH (Date High):**
- `DH 3`: 3-byte binary date storage (high-to-low order)
- `DH 4`: 4-byte binary date storage (high-to-low order)
- Corresponds to BH storage format
- Can be indexed as character fields for sorting

**Usage Example:**
```business-rules
00100 DIM DATES(100)
00110 FORM C 20, DH 4, C 30
00120 WRITE #1, USING 110: NAME$, DAYS(DATE$), DESCRIPTION$
! Date stored in binary format, Y2K compliant
```

#### System Functions (3.83+)

##### SLEEP Function (Enhanced)
```bnf
SLEEP(<seconds>)
```

**3.83h+ Enhancement:**
- Now accepts decimal fractions of a second
- Resolution accuracy in milliseconds (up to 3 decimal places)
- Parameter still specified in seconds
- Some DOS environments have lower resolution than milliseconds

**Examples:**
```business-rules
SLEEP(1)        ! Sleep for 1 second
SLEEP(0.5)      ! Sleep for 500 milliseconds (3.83h+)
SLEEP(0.001)    ! Sleep for 1 millisecond (3.83h+)
SLEEP(2.75)     ! Sleep for 2.75 seconds (3.83h+)
```

##### Screen Control Functions (4.17k+)
```bnf
SCR_FREEZE
SCR_THAW
```

**Purpose:** Control screen updates for batch operations
- `SCR_FREEZE` - Temporarily suspends screen updates
- `SCR_THAW` - Resumes screen updates after freeze

**Example:**
```business-rules
00100 LET SCR_FREEZE
00110 ! Perform multiple screen updates
00120 PRINT FIELDS "5,10,C 20": "Processing..."
00130 ! More screen operations
00140 LET SCR_THAW ! Screen updates all at once
```

##### Clipboard Functions (4.17+)
```bnf
SETENV("clipboard", <value$>)
ENV$("clipboard")
```

**Purpose:** Access Windows clipboard for data exchange
- `SETENV("clipboard", value$)` - Write to clipboard
- `ENV$("clipboard")` - Read from clipboard
- Case-insensitive keyword "clipboard"

**Example:**
```business-rules
00100 SETENV("clipboard", "Data to copy")
00110 LET COPIED$ = ENV$("clipboard")
```

##### System Information Functions (4.17+)
```bnf
ENV$("color.<component-name>")
ENV$("font.<component-name>")
ENV$("OPEN#<window-num>.FONT.LABELS")
USERID$
```

**Purpose:** Retrieve system settings and information
- `ENV$("color.<component>")` - Returns color as "#RRGGBB"
- `ENV$("font.<component>")` - Returns font name
- `ENV$("OPEN#window.FONT.LABELS")` - Returns window font
- `USERID$` - Returns BR licensee name (undocumented)

**Example:**
```business-rules
00100 PRINT "User: "; USERID$
00110 PRINT "Button color: "; ENV$("color.button")
00120 PRINT "Default font: "; ENV$("font.default")
```

**Use STATUS ENV command to see all available environment values**

#### Numeric Functions
- `VAL(s$)` - Convert string to number
- `INT(n)` - Integer part (truncates decimals)
- `ROUND(n,d)` - Round to d decimal places
- `ABS(n)` - Absolute value (removes sign)
- `SQR(n)` - Square root
  ```business-rules
  PRINT SQR(36)           ! Prints: 6
  LET X = 25 - SQR(16)    ! X = 21 (25 - 4)
  ```
- `SIN(n)`, `COS(n)`, `TAN(n)` - Trigonometric functions (radians)
- `LOG(n)` - Natural logarithm
- `EXP(n)` - e raised to power n
- `MOD(a,b)` - Modulo (remainder after division)
  ```business-rules
  PRINT 7 MOD 3           ! Prints: 1
  ```

#### System Functions
- `DATE$` - Current date
- `TIME$` - Current time
- `ERR` - Last error number
- `LINE` - Current line number
- `BRERR$(error-code)` - Returns the description of BR ERR value (4.30+)
- `ENV$(status-string [, MAT config$ [, search-arg]])` - Environment interrogation (4.30+)

#### Array Processing Functions

##### Array Information Functions
- `UDIM(<array-name> [, <dimension>])` - Returns current array dimension size
  - Without dimension parameter: returns size of first dimension
  - With dimension (1-7): returns size of specified dimension  
  - Useful for dynamic array management
  - Example: `UDIM(DATA)` returns total elements in 1D array
  - Example: `UDIM(DATA,2)` returns columns in 2D array
  
  **Common uses**:
  ```business-rules
  ! Get array size for loop processing:
  00100 FOR I = 1 TO UDIM(NAMES$)
  00110    PRINT NAMES$(I)
  00120 NEXT I
  
  ! Dynamic array growth:
  00200 DIM EMPLOYEES$(1)*30
  00210 LET COUNT = UDIM(EMPLOYEES$)
  00220 MAT EMPLOYEES$(COUNT+1)  ! Add one more slot
  00230 INPUT "New employee: ": EMPLOYEES$(COUNT+1)
  
  ! 2D array dimensions:
  00300 DIM MATRIX(10,5)
  00310 LET ROWS = UDIM(MATRIX,1)     ! Returns 10
  00320 LET COLS = UDIM(MATRIX,2)     ! Returns 5
  ```

- `SUM(<numeric-array>)` - Returns sum of all array elements
  - Works with multi-dimensional arrays
  - Example: `TOTAL = SUM(SCORES)`

##### Array Search Functions
- `SRCH(<array-name>, <argument> [, <start-row>])` - Search array for value
  - Returns row number if found, 0 or -1 if not found (version dependent)
  - String searches: prefix with ^ for case-insensitive substring match
  - Example: `POS = SRCH(MAT STATES$, "CA")`
  - Example: `POS = SRCH(MAT NAMES$, "^john")` - case-insensitive substring
  
  **Practical Example - Finding All Three-Item Orders**:
  ```business-rules
  00400 PRINT "The following people ordered all three items:"
  00410 PRINT "Row ";"Name"
  00420 !
  00430 DO WHILE SRCH(ITEM1,1,Y)>0
  00440   LET X=SRCH(ITEM1,1,Y)  ! Find next person who ordered item1
  00450   IF ITEM2(X)=1 AND ITEM3(X)=1 THEN  ! Check if they also ordered 2 and 3
  00460     PRINT X;" ";FIRSTNAME$(X);" ";LASTNAME$(X)
  00470   END IF
  00480   LET Y=X+1  ! Continue search from next position
  00490 LOOP
  ```

##### Array Sorting Functions (Used with MAT statement)
- `AIDX(<array-name>)` - Generate ascending sort index
  - Returns index array for accessing original in sorted order
  - Must be used with MAT statement
  - Example: `MAT INDEX = AIDX(NAMES$)`

- `DIDX(<array-name>)` - Generate descending sort index
  - Returns index array for accessing original in reverse sorted order
  - Must be used with MAT statement
  - Example: `MAT INDEX = DIDX(VALUES)`
  
  **Practical Example - Sorting Sales Data**:
  ```business-rules
  00470 DIM SALESTOTAL(12)
  00480 DATA 300,500,66,789,1023,24,56,72,800,945,15,7
  00490 READ MAT SALESTOTAL
  00500 MAT CHANGED(12)=DIDX(SALESTOTAL)  ! Get descending index
  00510 FOR I=1 TO 12
  00520   PRINT SALESTOTAL(CHANGED(I))  ! Print in descending order
  00530 NEXT I
  ```

##### String/Array Conversion Functions (4.20+)
- `STR2MAT(str$, MAT array$ [, [MAT] Sep$ [, flags$]])` - Split string into array
  - Dynamically resizes target array
  - Default separator: CR/LF combinations
  - Flags: `[Q|QUOTES|(')|(")][:LTRM|:TRIM|:RTRM]`
  - Q/QUOTES: Auto-detect quote type, strip quotes
  - Trim options: :LTRM (left), :TRIM (both), :RTRM (right)
  - Supports CSV and XML parsing
  - Returns number of elements created
  - Example: `STR2MAT(CSV_LINE$, MAT FIELDS$, ",", "Q:TRIM")`
  
  **Practical Example - Replacing DATA/READ with STR2MAT**:
  ```business-rules
  ! Traditional approach with DATA/READ:
  00040 DATA "First Name","Last Name","Address","City","State","Zip Code"
  00050 READ MAT HEADINGS$
  
  ! Modern approach with STR2MAT:
  00040 STR2MAT("First Name,Last Name,Address,City,State,Zip Code", MAT HEADINGS$, ",")
  
  ! For forms array:
  00070 F$="CC 30,CC 30,CC 30,CC 15,CC 2,CC 7,CC 1,N 1,N 1,N 1"
  00080 STR2MAT(F$, MAT FORMS$, ",")
  ```

- `MAT2STR(MAT array$, str$ [, [MAT] sep$ [, flags$]])` - Join array into string
  - Concatenates array elements with separator
  - Default separator: CR on Linux, CRLF on Windows
  - Flags: same as STR2MAT for quote processing and trimming
  - Multi-dimensional arrays: use multiple separators
  - Automatically adds quotes when data contains separators
  - Example: `MAT2STR(MAT CODES$, OUTPUT$, ",", "Q:TRIM")`

#### Encryption Functions (4.30+)
- `ENCRYPT$(data$ [, key$ [, type$ [, iv$]]])` - Encrypt data
  - Types: AES, BLOWFISH, DES, 3DES, RC4, RC2
  - Default: AES:256:CBC:128
- `DECRYPT$(data$ [, key$ [, type$ [, iv$]]])` - Decrypt data
- Hash functions (one-way):
  - `ENCRYPT$(data$, "", "MD5")` - MD5 hash
  - `ENCRYPT$(data$, "", "SHA")` - SHA hash
  - `ENCRYPT$(data$, "", "SHA-1")` - SHA-1 hash

#### Date Functions

##### Enhanced DATE() Formats (4.17+)
Additional date format support:
```business-rules
DATE$(days,"day month, ccyy")  ! Returns: "23 January, 2007"
DATE$(days,"d3 m3 dd, ccyy")   ! Returns: "Tue Jan 10, 2005"
DAYS("January 17, 1945", "month dd, ccyy")  ! Parse text dates
```

##### Extended Date Functions (4.30+)
- Extended DATE$ masks with time support:
  - `H#.##` or `H` - Hours with fractions
  - `M#.###` or `M#.#` - Minutes
  - `S#.####`, `S` or `S#` - Seconds
  - `AM/PM` - 12-hour format
- `SQL_DATE$(BR-date, "format")` - Format date for SQL storage
- `BR_DATE$(SQL-date, "format")` - Unpack SQL date value

### FnSnap Library Functions (Printing and PCL)

FnSnap provides a comprehensive set of user-defined functions for advanced printing, PCL (Printer Control Language) formatting, and report management.

#### Font Management Functions

##### FNFONT$*30 - Create PCL font string
```business-rules
FNFONT$*30(SYMBOL_SET$, PROPORTIONAL, CHR_PER_INCH, STYLE$, WEIGHT$, TYPEFACE$)
```
Creates an HP PCL5 font string from specified parameters for laser printer font selection.

##### FNLOADFONT$*50 - Load PCL font to printer
```business-rules
FNLOADFONT$*50(NUMBER$, FONTCALL$*50; FONT$*100, OUTFILE)
```
Moves a downloadable font into an open display file and returns the font calling string. Works even if font file is invalid or missing.

#### Report Reprinting Functions

##### FNOPEN - Create log file for saved reports
```business-rules
FNOPEN(&FLNM$, &FLPATH$; PRINTDESC$*80, LLEN, PRINTTYPE$, SAVE_DAYS)
```
Opens a display file in specified directory with auto-generated sequence number. Returns file name and number for creating RAW print files.

**Parameters:**
- `FLNM$`: Leading characters for filename (completed with sequence number)
- `FLPATH$`: Absolute or relative path for print file
- `PRINTDESC$`: Description for REPORTLOG reprint dialog
- `LLEN`: Line length (0 for EOL=NONE)
- `PRINTTYPE$`: "ALL" (default), "DIRECT", or "MATRIX"
- `SAVE_DAYS`: Retention days (0 uses 30-day default)

##### FNPRINT - Print saved report
```business-rules
FNPRINT(FILNM$*100, PRINTER$*50)
```
Prints a stored RAW file to specified printer with print substitutions.

##### FNREPRINT - Display and reprint saved reports
```business-rules
FNREPRINT(; ALL, LOGNAME$*100, LOGKEY$*100)
```
Displays monthly report list with security filtering and allows reprinting.

##### FNCLEANLOG - Maintain report log
```business-rules
FNCLEANLOG(; REPORTLOG)
```
Reviews report log, sets default 30-day retention, deletes expired reports, and removes old deletion entries.

#### Bar Code Functions

##### FNBARCODEM - Matrix printer postal bar code
```business-rules
FNBARCODEM(ODEV, ZIP$; INDENT)
```
Prints postal bar code on matrix printer.

##### FNCODE3OF9 - 3 of 9 bar code in PCL
```business-rules
FNCODE3OF9(PRINTFILE, V, H, TEXT$*30, PRNTXT$; HEIGHT, CHECKD)
```
Creates 3 of 9 format bar code for laser printers.

##### FNCODEUPC - UPC bar code in PCL
```business-rules
FNCODEUPC(PRINTFILE, V, H, TEXT$*30; HEIGHT)
```
Creates UPC format bar code for laser printers.

##### FNPOSTNET - Print postal bar code
```business-rules
FNPOSTNET(PRINTFILE, V, H, TEXT$*20)
```
Prints postal bar code in PCL format. Works in both PCL and NWP modes.

**Parameters:**
- `PRINTFILE`: Open print file number
- `V`: Vertical position (inches)
- `H`: Horizontal position (inches)
- `TEXT$`: Zip code to convert

##### FNPOSTNET$*4000 - Create postal bar code string
```business-rules
FNPOSTNET$*4000(TEXT$*20)
```
Returns postal bar code as PCL string. Returns blank if invalid zip.

#### Envelope and Label Functions

##### FNENVELOPE - Print envelope with bar code
```business-rules
FNENVELOPE(PRTFILE, DATAFILE, SIZE$; SUPRET, MAT INNAMES$, NOLBLS, NOCLOSE)
```
Prints envelope on laser printer with postal bar code and optional return address.

##### FNLABEL - Print 3x4 laser labels
```business-rules
FNLABEL(FILNUM, MAT FADD$, MAT TADD$; START, NUMBER)
```
Prints mailing labels with postal bar codes on 6-per-sheet laser label stock.

##### FNGETZIP - Extract zip code
```business-rules
FNGETZIP$(ADD$*50)
```
Extracts valid zip code from end of address string, excluding dashes.

#### Forms and Formatting Functions

##### FNDRAWBOX - PCL shaded box
```business-rules
FNDRAWBOX(PRINTFILE, VP, HP, VL, HL, WEIGHT; FILL)
```
Draws PCL5 box with outline and optional shading.

##### FNPRINTBOX - PCL line and formatted text
```business-rules
FNPRINTBOX(PRINTFILE, V, H, BV, BH, SHADE; TV, TH, TEXT$*6000, CPI, FONT$*40)
```
Creates PCL5 lines and positions formatted text.

**Parameters:**
- `V`, `H`: Upper-left corner position (inches)
- `BV`, `BH`: Box dimensions (inches)
- `SHADE`: Gray level (0=white to 100=black, multiples of 10)
- `TV`, `TH`: Text position relative to box corner (inches)
- `TEXT$`: Text to print (-1 for TH centers text in PCL mode)

##### FNGREYBAR$ - Overlay with gray bar effect
```business-rules
FNGREYBAR$(MACRO, PRINTFILE, V, H, BV, BH, SHADE, HEAD, BAR)
```
Creates PCL5 macro simulating green-bar paper and returns macro call.

**Parameters:**
- `MACRO`: Macro number to assign
- `V`, `H`: Paper upper-left corner (inches)
- `BV`, `BH`: Area dimensions (inches)
- `SHADE`: Bar darkness (20-30 recommended)
- `HEAD`: Header space (inches)
- `BAR`: Gray bar height (inches)

##### FNPRINTFORM$*40 - Extract form from library
```business-rules
FNPRINTFORM$*40(FILNUM, FORMFILE, SHORTNAME$)
```
Extracts form/page/macro/font from library file to open print file.

##### FNSIGNBOX - Print signature/graphic
```business-rules
FNSIGNBOX(FILNUM, V, H, SIGFIL, SHORT$, &PASS$)
```
Places signature or small graphic at specified document location with password protection.

##### FNREFERENCE - Page reference in PCL
```business-rules
FNREFERENCE(PTYPE$, REFERENCE$; PFILE, LGL)
```
Prints page reference in lower-right corner for HP printers.

##### FNMAKEPCL - Convert HP6L file for overlay
```business-rules
FNMAKEPCL(INFILE$*100, OUTFILE$*100)
```
Processes HP6L saved print file for use as PCL macro overlay.

#### RTF (Rich Text Format) Functions

##### FNRTFSTART - Open RTF source file
```business-rules
FNRTFSTART(HEADER$*100, FOOTER$*100, TITLE$*500, MAT HEADER$; CELLNO)
```
Opens file for RTF creation using RTFLIB.dll.

**Parameters:**
- `HEADER$`: Page header text
- `FOOTER$`: Page footer (use "[PAGE]" for page numbers)
- `TITLE$`: First page title
- `MAT HEADERS$`: Column headers (bar-delimited)
- `CELLNO`: Optional cell number for repeating headers

##### FNRTFEND - Convert to RTF document
```business-rules
FNRTFEND$*100(RTFNO, RTFNAME$*100, RTFSPEC$*100; WORD)
```
Converts source file to finished RTF document with specified formatting.

#### Utility Functions

##### FNPRINT_FILE - Print text file with formatting
```business-rules
FNPRINT_FILE(FILE_NAME$*100; INDENT)
```
Prints ASCII file with 100-character lines on grey-bar paper with ruler.

##### FNPRINTERS - Generate printer list
```business-rules
FNPRINTERS(; DRIVE_LOC$)
```
Creates printed list of printers and printers.sys file.

##### FNMENUACCESS - Check reprint permissions
```business-rules
FNMENUACCESS(MNAME$*10, MSEQ$*3, MPGM$*50)
```
Verifies user permissions for report reprinting in WORKMENU environment.

## Screen Operations

### Overview
Business Rules! provides comprehensive screen input/output capabilities including:
- Full screen processing (positioning at any row/column)
- Windowing (mini-screens with borders and captions)
- Screen attributes (colors, highlighting, protection)
- Graphical controls (combo boxes, radio buttons, check boxes, grids, lists)
- Field help windows and tooltips

### Full Screen Processing

Full screen processing allows positioning text and input at any row/column on the screen, creating professional data entry forms and interactive displays. Unlike regular INPUT/PRINT which operate at the bottom command line, full screen processing provides complete control over the entire display area.

#### Core Statements

##### PRINT FIELDS
```bnf
PRINT [#<window-num>,] FIELDS <field-spec> : <expression-list>
```
Displays information at specified screen positions with formatting and attributes.

##### INPUT FIELDS
```bnf
INPUT [#<window-num>,] FIELDS <field-spec> [,ATTR <attributes>] [,HELP <helpstring>] : <variable-list> [<error-cond>]
```
Accepts operator input at specified screen positions.

##### RINPUT FIELDS
```bnf
RINPUT [#<window-num>,] FIELDS <field-spec> [,ATTR <attributes>] [,HELP <helpstring>] : <variable-list> [<error-cond>]
```
RINPUT (Reverse INPUT) displays current values and accepts changes - combines PRINT FIELDS and INPUT FIELDS functionality.

#### Field Definition Syntax

The field definition specifies location, format, and appearance:

##### Field Windowing (3.90+)
Enables entering and processing more text than a field can display:
```bnf
INPUT FIELDS "row,col,C width/maxlength,attributes": variable$
```

**Example:**
```business-rules
INPUT FIELDS "10,5,C 8/12,UH": NAME$
```
Allows entering up to 12 characters in an 8-character display window.

##### Combo Box Graphic (3.90+)
Adds a dropdown arrow graphic that generates keyboard input when clicked:
```bnf
PRINT FIELDS "row,col,C length,Q,Xhex": "caption"
```

**Example:**
```business-rules
PRINT FIELDS "5,10,C 10,Q,X02": "Select Item"
```
Displays field with dropdown arrow that generates hex 02 when double-clicked.

##### Hot Text (3.90+)
Any FIELDS text can generate a scancode when double-clicked, similar to buttons:

```bnf
<field-spec> ::= "<row>,<col>,<format-spec>[,<attributes>]"
                | "<field-def>[;<field-def>]*"  ! Multiple fields
                | MAT <string-array>             ! Array of field definitions

<field-def> ::= <row>,<col>,<format>[,<attributes>]

<row> ::= <integer>         ! 1-24 (default screen)
<col> ::= <integer>         ! 1-80 (default screen)
```

**Field Definition Components (in order):**
1. **Row position** (required) - Screen row (1-24 default)
2. **Column position** (required) - Starting column (1-80 default)  
3. **Format specification** (required) - Type and length
4. **Attributes** (optional) - Display and control attributes

Example:
```business-rules
00030 PRINT FIELDS "12,39,C 3,B:W": X$
!                    ^row ^col ^format ^attributes
```

#### Format Specifications

```bnf
<format-spec> ::= <string-format> [<length>]
                | <numeric-format> <length>[.<decimals>]
                | PIC(<picture-spec>)
                | DATE(<date-format>)
                | TEXT <rows>/<cols>[/<capacity>]
                | FILTER
```

#### Format Types

**Core Format Specifications:**
- `C <length>` - Character string, left-aligned
- `N <length>[.<decimals>]` - Numeric, right-aligned
- `PIC(<picture>)` - Picture format with insertion characters
- `G <length>` - General (accepts character or numeric)
- `L <length>` - Long format (binary storage)
- `B <length>` - Binary format
- `V <length>` - Variable (like C but trims trailing spaces)

**String Format Modifiers:**
- `C` - Character, left-aligned (default)
- `CR` - Character, right-aligned
- `CC` - Character, center-aligned
- `CU` - Character, uppercase only
- `CL` - Character, lowercase only
- `V` - Variable length (trims trailing spaces)
- `VU` - Variable uppercase
- `VL` - Variable lowercase

**Numeric Format Modifiers:**
- `N` - Numeric, right-aligned
- `NZ` - Numeric with zero suppression
- `NL` - Numeric with leading sign
- `G` - General numeric
- `GZ` - General with zero suppression

**Display Width Override (4.17+):**
```bnf
<displayed-length>/<field-spec>
```

**Extended Field Capacity Syntax:**
- Format: `row,col,displayed-length/field-spec`
- Allows entering more data than displayed
- Particularly useful for proportional fonts

**Examples:**
```business-rules
"5,10,7/N 10.2"      ! 10 digits with decimal displayed in 7 chars
"7,10,11/PIC(#,###.##)" ! 7 digits with punctuation in 11 chars
"9,10,20/C 25"       ! 25 chars capacity displayed in 20 positions
```

**OPTION 45:** Allows both old and new extended field specification formats

#### Screen Attributes

Attributes control appearance and behavior of fields. They consist of three optional components:

```bnf
<attributes> ::= [<display-attrs>][/<color-attrs>]
<attributes> ::= [<control-attrs>][<display-attrs>][/<color-attrs>]
```

##### Display Attributes
Legacy monochrome attributes (still supported):
- `B` - Blink (deprecated)
- `H` - Highlight (brighter text, deprecated) 
- `U` - Underline (deprecated)
- `R` - Reverse video (dark on light)
- `N` - Normal (reset to default)
- `I` - Invisible/Password field (4.17+: displays as asterisks or dots)
- `S` - Sunken/3D appearance (PRINT FIELDS only)

##### Color Attributes
```bnf
/<foreground>[:<background>]
```

**Basic Colors:**
- `R` - Red
- `G` - Green  
- `B` - Blue
- `H` - Grey
- `W` - Windows default (black on grey)
- `T` - Transparent (default black foreground)

**Color Combinations:**
- `BG` - Light blue (Blue + Green = Cyan)
- `RB` - Purple/Magenta (Red + Blue)
- `RG` - Olive/Yellow (Red + Green)
- `BGR` - White (all colors)

**Hexadecimal Colors:**
```bnf
/#RRGGBB[:#RRGGBB]
```
Example: `/#228B22:#CC99FF` (forest green on light purple)

**Color Priority (4.17+):**
When multiple color specs are present, priority is:
1. #RRGGBB style values (highest)
2. W (Windows system colors)
3. HRGB values (lowest)

This allows specifying fallback colors for different display types.

##### Control Attributes
Control field input behavior:

- `A` - Auto-advance to next field when current field filled
- `E` - Enter (submit all fields) when exited with changes
- `AE` - Auto-enter when field filled (A+E combined)
- `C` - Cursor starts here (multiple field processing only)
- `T` - Tab to next field when filled
- `P` - Protect (read-only)
- `L` - Lowercase only
- `^` - Uppercase only
- `X` - Return control on any key press
- `Q` - Enable dropdown for combo box

#### New Field Types (4.30+)

**TEXT Field Format:**
- Multi-line text input with optional scrollbars
- Syntax: `TEXT rows/cols[/capacity]`
- Supports attributes: `^ENTER_LF` (default), `^ENTER_CRLF`, `^NOWRAP`
- ENTER key adds line feeds, Control+ENTER returns control
- Home/End operate on current line

**DATE Field Format (4.17+):**
```bnf
DATE(<date-format>)
```
- Displays values as formatted dates
- Stores internally as day of century (numeric)
- Mask can be any valid DATE() format
- Enables numeric sorting while displaying as dates

**Example:**
```business-rules
PRINT FIELDS "10,20,DATE(mm/dd/yy)": INVOICE_DATE
INPUT FIELDS "10,20,DATE(dd/mm/ccyy)": BIRTH_DATE
```

**FILTER Field Type:**
- Search/filter field for LIST and GRID controls
- Automatically filters displayed data as user types
- Works with FILTER_DELIMITERS configuration

**DATE Input Field:**
- Syntax: `DATE(mask)` for input fields
- Automatic date picker when configured
- Punctuation auto-skip during entry
- Supports paste from Excel/OpenOffice
- Config: `DATE [ALWAYS|INVALID|NEVER]`

**Enhanced Numeric Input:**
- Decimal fractions for ROW/COL positioning
- CHR$(6) field separator for right justification

### Multiple Field Processing

Multiple field processing allows handling multiple fields in a single statement using arrays:

#### Field Definition Arrays
```business-rules
00100 DIM FIELDEF$(3)*30
00110 LET FIELDEF$(1) = "10,20,C 15,R/B:W"
00120 LET FIELDEF$(2) = "12,20,N 10.2"  
00130 LET FIELDEF$(3) = "14,20,C 30"
00140 PRINT FIELDS MAT FIELDEF$: "Name", 123.45, "Description"
```

#### Array Processing with MAT
```business-rules
00100 DIM FLDDEF$(3)*20, VALUES$(3)*30
00110 DATA "10,10,C 20,A","12,10,C 30,A","14,10,C 25,AE"
00120 READ MAT FLDDEF$
00130 RINPUT FIELDS MAT FLDDEF$: MAT VALUES$
```

#### Control Attribute Behavior in Multiple Fields
- Without control attributes: Must press TAB or arrow keys to move between fields
- With `A`: Auto-advances to next field when current field filled
- With `AE` on last field: Submits all fields when last field filled
- With `C`: Specifies which field gets initial cursor focus
- ENTER key submits all fields in the group

### Attribute Configuration with BRConfig.sys

Define reusable attribute combinations using subattributes:

#### Subattribute Definition Syntax
```
ATTRIBUTE [name] specification
```

Examples:
```
ATTRIBUTE [X]/#006600:#FFFFFF               ! Forest green on white
ATTRIBUTE [BLUE]/#0000FF                    ! Blue foreground
ATTRIBUTE [PINK]/#FF00FF                    ! Pink foreground
ATTRIBUTE [heading][X]                      ! Copy X to heading
ATTRIBUTE [hilite_text]/#rrggbb:#rrggbb,font=arial:ital:max
```

#### Using Subattributes in Programs
```business-rules
00100 PRINT FIELDS "10,10,C 20,[heading]": "Main Menu"
00110 INPUT FIELDS "12,10,C 30,[hilite_text]": NAME$
```

#### Font Specifications
In BRConfig.sys:
```
FONT=LUCIDA                         ! Default font
FONT.TEXT=Courier                   ! Text fields
FONT.LABELS=Arial                   ! Labels
FONT.BUTTONS=Tahoma                 ! Buttons
```

Font qualifiers:
- Family: `decor`, `roman`, `script`, `swiss`, `modern`
- Weight: `light`, `bold`
- Style: `ital`, `slant`
- Decoration: `under`
- Size: `small`, `medium`, `large`, `max`

### Examples

#### Basic Full Screen Input
```business-rules
00100 PRINT NEWPAGE
00110 PRINT FIELDS "5,10,C 20": "Enter Name:"
00120 INPUT FIELDS "5,31,C 30,U": NAME$
00130 PRINT FIELDS "7,10,C 20": "Enter Amount:"
00140 INPUT FIELDS "7,31,N 10.2": AMOUNT
```

#### Data Entry Form with Multiple Fields
```business-rules
00100 DIM FLDDEF$(6)*30, NAME$*30, ADDR$*40, CITY$*20, STATE$*2, ZIP$*10, PHONE$*12
00110 DATA "8,15,C 30,A","10,15,C 40,A","12,15,C 20,A"
00120 DATA "12,36,CU 2,A","12,39,C 10,A","14,15,C 12,AE"
00130 READ MAT FLDDEF$
00140 PRINT NEWPAGE
00150 PRINT FIELDS "8,5,CR 9": "Name:"
00160 PRINT FIELDS "10,5,CR 9": "Address:"  
00170 PRINT FIELDS "12,5,CR 9": "City/St:"
00180 PRINT FIELDS "14,5,CR 9": "Phone:"
00190 RINPUT FIELDS MAT FLDDEF$: NAME$,ADDR$,CITY$,STATE$,ZIP$,PHONE$
```

#### Password Field with Masking
```business-rules
00100 PRINT NEWPAGE
00110 PRINT FIELDS "10,10,C 15": "Username:"
00120 INPUT FIELDS "10,26,C 20": USERNAME$
00130 PRINT FIELDS "12,10,C 15": "Password:"
00140 INPUT FIELDS "12,26,C 20,I": PASSWORD$  ! I attribute masks input
```

#### Field with Colors and Control
```business-rules
00100 ! Using hexadecimal colors and auto-enter
00110 PRINT FIELDS "10,10,C 20,/#FFFFFF:#0000FF": "Important:"
00120 INPUT FIELDS "10,31,C 30,AE/#FFFF00:#000000": RESPONSE$
```

#### Window on a Field (scrollable input)
```business-rules
00100 ! Allow 100 characters in a 40-character display field
00110 INPUT FIELDS "10,20,40/C 100,N/W:W": TEXT$
```

### Full Screen Processing Best Practices

#### Important Guidelines
1. **Always use PRINT NEWPAGE** before and after full screen sections
2. **Don't mix** full screen processing with regular PRINT/INPUT statements
3. **Dimension strings** longer than 18 characters using DIM
4. **Line numbers required** for every statement (typically increment by 10)

#### Navigation Keys
- **TAB** - Move to next field
- **Shift+TAB** - Move to previous field
- **Arrow keys** - Navigate between fields
- **Field+/Field-** - Next/previous field
- **ENTER** - Submit all fields (multiple field processing)
- **Home/End** - Beginning/end of current field

#### Common Patterns

**Single vs Multiple Field Processing:**
- Single field: Each INPUT FIELDS processes one field independently
- Multiple fields: One statement processes all fields as a unit
- Multiple fields allow easy navigation and correction

**Control Attribute Strategy:**
```business-rules
! First fields get A (auto-advance)
00100 DATA "10,10,C 20,A","12,10,C 30,A"
! Last field gets AE (auto-enter)  
00110 DATA "14,10,C 25,AE"
! Field needing focus gets C
00120 DATA "8,10,C 15,C"
```

**Color Strategy with BRConfig.sys:**
```
! Define standard colors in BRConfig.sys
ATTRIBUTE [error]/#FF0000:#FFFF00    ! Red on yellow
ATTRIBUTE [input]/#000000:#FFFFFF    ! Black on white
ATTRIBUTE [label]/#FFFFFF:#000080    ! White on dark blue
```

### Window Operations

#### OPEN Window
```bnf
OPEN #<window-num>: "SROW=<row>,SCOL=<col>[,EROW=<row>][,ECOL=<col>][,ROWS=<n>][,COLS=<n>][,BORDER=<type>][,CAPTION=<text>][,PARENT=<num>][,TAB=<text>]", DISPLAY, {OUTPUT|INPUT|OUTIN}
```

**Border Types:**
- `S` - Single line
- `D` - Double line
- `H` - Shadow
- `B` - Blank
- `NONE` - No border
- Custom: 8 characters for corners and sides

#### Examples
```business-rules
00100 ! Open a window with single border
00110 OPEN #1: "SROW=5,SCOL=10,EROW=15,ECOL=60,BORDER=S,CAPTION=Data Entry", DISPLAY, OUTIN
00120 PRINT #1: NEWPAGE
00130 INPUT #1,FIELDS "2,5,C 20": NAME$
00140 CLOSE #1:
```

#### PRINT BORDER
```bnf
PRINT #<window-num>, BORDER [<border-spec>] [: <caption>]
```

### Field Help Specifications

#### Help String Syntax
```bnf
<helpstring> ::= "[<field-help>][;<field-help>]*"
<field-help> ::= [{1|2|3|4}][{A|B|L|R|<window-num>}][<|>]<sep><text><sep>
                | X
                | &<field-num>;
```

**Help Levels:**
- `1` - Always display (important)
- `2` - Intermediate users
- `3` - Novice users only
- `4` - Tooltips only (no windows)

**Placement:**
- `A` - Above field
- `B` - Below field
- `L` - Left of field
- `R` - Right of field
- `<` - Flush left
- `>` - Flush right

#### Example with Help
```business-rules
00100 INPUT FIELDS "10,10,C 20,U", HELP "2B;Enter customer name\nLast, First format;": NAME$
```

### Graphical Controls

#### Combo Box
```bnf
PRINT FIELDS "<row>,<col>[,<display-cols>/]COMBO <data-cols>,{=|+|-}[,SELECT][,<fkey>]": MAT <array>
INPUT FIELDS "<row>,<col>[,<display-cols>/]COMBO <data-cols>[,<attributes>]": <variable>
```

Example:
```business-rules
00100 DIM OPTIONS$(5)*20
00110 DATA "Daily","Weekly","Monthly","Quarterly","Annually"
00120 READ MAT OPTIONS$
00130 PRINT FIELDS "10,10,20/COMBO 20,=": MAT OPTIONS$
00140 INPUT FIELDS "10,10,20/COMBO 20": SELECTED$
```

#### Radio Buttons
```bnf
{PRINT|INPUT|RINPUT} FIELDS "<row>,<col>,RADIO <cols>[,<group>][<attributes>][,<fkey>][,NOWAIT]": "[^]<caption>"
```

**Purpose**: Create mutually exclusive selection options where only one option can be selected within a group.

**Key Characteristics**:
- Radio buttons work in groups - only one can be selected per group
- Use `^` prefix to indicate selected state
- Group number (after cols) links buttons together
- FKEY value can be assigned to trigger action on selection
- RINPUT displays current selection and allows changes

**Basic Example**:
```business-rules
00100 LET OPT1$="^Option 1" : LET OPT2$="Option 2" : LET OPT3$="Option 3"
00110 RINPUT FIELDS "10,10,RADIO 15,1;11,10,RADIO 15,1;12,10,RADIO 15,1": OPT1$,OPT2$,OPT3$
```

**Practical Example - Shipping Selection**:
```business-rules
00150 LET X$="^Overnight"  ! Default selection with ^
00160 LET Y$="Regular"
00170 PRINT FIELDS "12,5,C 30": "Shipping preference: "
00180 RINPUT FIELDS "13,5,RADIO 10,2,8;14,5,RADIO 7,2,9": X$,Y$
00190 IF FKEY=8 THEN PRINT FIELDS "15,5,C 30": "It will be there tomorrow!"
00200 IF FKEY=9 THEN PRINT FIELDS "16,5,C 50": "It will be there within 3 to 7 business days!"
00220 IF X$(1:1)="^" THEN SHIPPING$="O"  ! Check which is selected
00230 IF Y$(1:1)="^" THEN SHIPPING$="R"
```

#### Check Boxes
```bnf
{PRINT|INPUT|RINPUT} FIELDS "<row>,<col>,CHECK <cols>[<attributes>][,<fkey>][,NOWAIT]": "[^]<caption>"
```

**Purpose**: Create multiple independent selection options where zero, one, or multiple items can be selected.

**Key Characteristics**:
- Each checkbox is independent - multiple can be selected
- Use `^` prefix to indicate checked state
- FKEY value can be assigned to each checkbox
- Can be used with DO LOOP for continuous selection
- Check state stored in first character of variable

**Basic Example**:
```business-rules
00100 LET CHECK1$="^Include Tax" : LET CHECK2$="Express Shipping"
00110 RINPUT FIELDS "10,10,CHECK 20;11,10,CHECK 20": CHECK1$,CHECK2$
```

**Practical Example - Item Selection with Loop**:
```business-rules
00260 DIM BOXNAMEFORM$(3)*20, BOXNAME$(3)*20, BOX$(3)*20
00270 DATA "22,15,C 10","23,15,C 10","24,15,C 10"
00280 DATA "Item 1","Item 2","Item 3"
00290 READ MAT BOXNAMEFORM$
00300 READ MAT BOXNAME$
00310 PRINT FIELDS "20,5,C 35": "Please select items to order:"
00320 PRINT FIELDS MAT BOXNAMEFORM$: MAT BOXNAME$
00340 PRINT FIELDS "23,30,CC 8,,B99": "Done"  ! Button with FKEY=99
00350 DO
00360   INPUT FIELDS "22,14,CHECK 8,,10;23,14,CHECK 8,,11;24,14,CHECK 8,,12": BOX$(1),BOX$(2),BOX$(3)
00370   PRINT FIELDS "24,1,N 2": FKEY
00380 LOOP WHILE FKEY~=99
00390 ! Convert checkbox states to numeric
00400 FOR I=1 TO UDIM(BOX$)
00410   IF BOX$(I)(1:1)="^" THEN ORDERED(I)=1 ELSE ORDERED(I)=0
00420 NEXT I
```

#### Buttons
```bnf
PRINT FIELDS "<row>,<col>,CC <cols>,,B<fkey>": "<caption>"
```

**Purpose**: Create clickable buttons that trigger specific FKEY values for program control.

**Key Characteristics**:
- Use CC (center) format for button text
- B prefix followed by FKEY number (e.g., B99)
- Can be combined with other controls
- Commonly used for Done, OK, Cancel operations

**Example - Done Button**:
```business-rules
00340 PRINT FIELDS "23,30,CC 8,,B99": "Done"
00350 DO
00360   INPUT FIELDS "2,2,C 10": DUMMY$  ! Wait for input
00370 LOOP WHILE FKEY~=99
```

**Example - Yes/No Options**:
```business-rules
01090 PRINT FIELDS "2,2,C 42": "Would you like to add a new record?"
01100 PRINT FIELDS "2,46,CC 8,,B98;2,55,CC 8,,B9": "Yes","No"
01110 LET KSTAT$(1)  ! Check keyboard status
01120 IF FKEY=9 THEN GOTO ENDALL
01130 IF FKEY=98 THEN GOSUB ADD_RECORD
```

#### Grid/List (2D Controls)

**Overview**: Grid and List (ListView) are two-dimensional controls containing rows and columns for displaying and managing tabular data.

**Key Differences**:
- **GRID**: Used for data entry with editable cells
- **LIST (ListView)**: Used for selection only, read-only display
- Both support multi-column layouts with headers
- RINPUT does not work with 2D controls (output and input operations differ)

##### Basic Syntax

```bnf
! Headers operation - must be done first
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,HEADERS[,<attributes>][,<fkey>]": 
    (MAT <headings$>, MAT <widths>, MAT <forms$>)

! Populate operation
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,{=|+|-}[{R|C|L|S}][,<fkey>]": 
    MAT <data> | (MAT <col1>, MAT <col2>, ...)

! Input operation
INPUT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,<read-type>,<selection>[,<qualifier>][,<fkey>]": 
    <variable-spec>
```

##### Read Types

**For both GRID and LIST**:
- `ROWCNT` - Number of rows specified
- `ROWSUB` - Subscripts of specified rows
- `ROW` - Read all cells in each specified row
- `COLCNT` - Number of columns established by headers (4.30+)
- `SORT_ORDER` - Column sort sequence (4.3+)
- `HEADERS` - Read original header values (4.30+)
- `MASK` - Read display mask setting (4.30+)

**For GRID only**:
- `CNT` - Number of cells specified
- `SUB` - Read cell subscript values
- `CELL` - Read each cell specified

##### Selection Types

**For both GRID and LIST**:
- `SEL` - Read one or more selected items
- `SELONE` - Select only one item
- `ALL` - Read all items (except headers)
- `CUR` - Current cell or row number
- `NEXT` - Cell cursor is going to next (4.2+)
- `RANGE` - Specified portion of control (4.3+)
- `CELL_RANGE` - Special output range type (4.3+)

**For GRID only**:
- `CHG` - All items changed since last populate or CHG retrieval

##### Read Qualifiers (Optional)
- `DISPLAYED_ORDER` - Read in current display order, not original (4.30+)
- `NOWAIT` - Don't wait for user input
- `FKEY` - Trigger FKey event on selection

##### Population Flags

**Primary Flags**:
- `=` - Replace any previous data
- `+` - Add to end of previously populated data
- `-` - Insert at beginning of previously populated data (4.16+)

**Secondary Flags**:
- `R` - Load by row (default with grouped arrays)
- `C` - Load by column (for same data type columns)
- `L` - Provide FKEY interrupt on up/down beyond bounds
- `S` - Single click activates Enter/FKEY event (4.17+)

##### Special Operations

```bnf
! Masking - restrict displayed rows
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,MASK": MAT <mask_array>

! Sorting - programmatic column sort (4.17+)
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,SORT": {<column>|MAT <sort_array>}

! Range output - replace/insert/delete rows
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,RANGE": <start>, <end>, MAT <data>

! Cell range output
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,CELL_RANGE": <start>, <end>, MAT <data>

! Attribute override - change cell appearance (4.17+)
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,ATTR": 
    (MAT <start>, MAT <end>, MAT <attributes$>)

! Gridlines for LIST - make LIST look like GRID
PRINT FIELDS "<row>,<col>,LIST <rows>/<cols>,GRIDLINES": {0|1}

! Pre-selection
PRINT FIELDS "<row>,<col>,{GRID|LIST} <rows>/<cols>,^select ATTR": 
    (MAT <start>, MAT <end>, MAT <attr$>)

! Variable positioning control (4.17k+)
RINPUT FIELDS "<row>,<col>,15/SEARCH 10,<attributes>,<grid-row>,<grid-col>": <str-value>
```

**4.17+ Enhancements**:

**Column Sorting**: Columns can be sorted programmatically as if user clicked the header:
```business-rules
PRINT FIELDS "10,10,GRID 10/40,SORT": 2  ! Sort by column 2
```
- Automatically toggles between ascending and descending
- Error generated if no column previously sorted

**Section Coloring**: Override attributes for ranges of cells/rows:
```business-rules
DIM START(5), END(5), ATTR$(5)*20
LET START(1)=1 : END(1)=3 : ATTR$(1)="/BGR:R"  ! Rows 1-3 white on red
PRINT FIELDS "10,10,GRID 10/40,ATTR": (MAT START, MAT END, MAT ATTR$)
```
- Supports P (protect) attribute
- Clear with empty string attribute

**Numeric Column Sorting**: Facilitates proper numeric sorting:
- Works with DATE field format (stored as day of century)
- All numeric columns sort numerically, not as strings

##### Headers Operation Details

The HEADERS operation must be performed before populating data:

**Components**:
- **MAT HEADINGS$**: Column titles displayed at top
- **MAT WIDTHS**: Display width in character positions (0 for hidden columns)
- **MAT FORMS$**: BR FORM for each column (e.g., "C 15", "N 10.2", "DATE(mm/dd/ccyy)")
  - Can include comma and attributes: "C 20,R" for red text
  - Add "P" for protected (read-only) columns in GRID
  - AEX and P attributes supported in headers (4.17+)

**4.17+ Headers Enhancement**: Specify field attributes for header row:
```business-rules
PRINT FIELDS "10,20,LIST 10/80,HEADERS,[list-headers]": 
    (MAT HEADINGS$, MAT WIDTHS, MAT FIELD_FORMS$)
```
  - Add "^nosort" to prevent user sorting (4.2+)

##### Cell Subscript Calculation

For a GRID with rows×columns dimensions:
- Cell subscript = (row-1) × columns + column
- Example for 5×4 grid:
  ```
  Row 1:  1   2   3   4
  Row 2:  5   6   7   8
  Row 3:  9  10  11  12
  Row 4: 13  14  15  16
  Row 5: 17  18  19  20
  ```

##### Cursor Movement Configuration

```bnf
CONFIG GRID_CURSOR_MOVE {DOWN|RIGHT|NONE|DEFAULT}
```
Controls cursor movement after Enter or Field+/- keys.

**Field +/- Behavior**:
- Always returns fkey 114/115 in navigation and edit mode
- Forces numeric field signing in edit mode
- Right truncates data before exiting field

##### FKey Processing

- Set FKey value during output or input operations
- Clear with FKey value of -1
- **Inactive control**: Single click produces FKey interrupt
- **Active in INPUT**: Double click produces FKey completion
- CURROW/CURCOL return cell position within 2D control when active

##### Automatic Features

- **Column sorting**: Click header to sort, double-click to reverse
- **Aggregate sorting**: Equal values retain previous order (4.2+)
- **Numeric sorting**: Proper numeric/date column sorting
- **Array resizing**: Arrays automatically resized in 4.3+ when receiving data
- **String/numeric conversion**: Automatic VAL/STR conversion (4.2+)
- **Grid validation**: Validated as each cell is exited
- **Protected field bell**: Issues bell on protected field input attempt (4.1+)

##### Range Operations (4.3+)

**Range Input**:
```business-rules
! Read specific cell range
INPUT FIELDS "row,col,LIST rows/cols,CELL,RANGE": start, end, MAT Data$

! Read specific row range
INPUT FIELDS "row,col,LIST rows/cols,ROW,RANGE": start, end, 
    (MAT Array1$, MAT Array2, MAT Array3$)

! Read multiple ranges
INPUT FIELDS "row,col,GRID rows/cols,ROW,RANGE": MAT start, MAT end, 
    (MAT Data1$, MAT Data2$, MAT Data3)
```

**Range Output**:
```business-rules
! Replace rows
PRINT FIELDS "7,8,GRID 10/75,RANGE": start, end, MAT Data$

! Insert rows (end < start)
PRINT FIELDS "7,8,LIST 10/75,RANGE": 7, 0, (MAT NAME$, MAT CITY$)

! Delete rows (arrays dimensioned to 0)
PRINT FIELDS "7,8,LIST 10/75,RANGE": 7, 11, (MAT EMPTY$)

! Append rows (start beyond existing rows)
PRINT FIELDS "7,8,LIST 10/75,RANGE": 5000, 5000, (MAT NEW_DATA$)
```

##### Complete Example: Editable Grid with Change Tracking

```business-rules
00100 DIM HEADERS$(4)*20, WIDTHS(4), FORMS$(4)*20
00110 DIM NAMES$(100)*30, CITIES$(100)*20, AGES(100), WEIGHTS(100)
00120 DIM SUBSCR(1), CHANGED_ROWS

00200 ! Set up headers
00210 MAT HEADERS$ = ("Name", "City", "Age", "Weight")
00220 MAT WIDTHS = (30, 20, 10, 10)
00230 MAT FORMS$ = ("C 30", "C 20", "N 3", "N 6.2")

00300 ! Create grid with headers
00310 PRINT FIELDS "5,10,GRID 15/70,HEADERS": (MAT HEADERS$, MAT WIDTHS, MAT FORMS$)

00400 ! Load initial data
00410 NAMES$(1) = "John Smith" : CITIES$(1) = "New York" : AGES(1) = 35 : WEIGHTS(1) = 180.5
00420 NAMES$(2) = "Jane Doe" : CITIES$(2) = "Chicago" : AGES(2) = 28 : WEIGHTS(2) = 145.2
00430 PRINT FIELDS "5,10,GRID 15/70,=": (MAT NAMES$, MAT CITIES$, MAT AGES, MAT WEIGHTS)

00500 ! Process changes
00510 INPUT FIELDS "5,10,GRID 15/70,ROWCNT,CHG": CHANGED_ROWS
00520 IF CHANGED_ROWS > 0 THEN
00530   MAT SUBSCR(CHANGED_ROWS)
00540   INPUT FIELDS "5,10,GRID 15/70,ROWSUB,CHG,NOWAIT": MAT SUBSCR
00550   MAT NAMES$(CHANGED_ROWS) : MAT CITIES$(CHANGED_ROWS)
00560   MAT AGES(CHANGED_ROWS) : MAT WEIGHTS(CHANGED_ROWS)
00570   INPUT FIELDS "5,10,GRID 15/70,ROW,CHG,NOWAIT": 
          (MAT NAMES$, MAT CITIES$, MAT AGES, MAT WEIGHTS)
00580   ! Process changed data here
00590 END IF
```

##### ListView Selection Example

```business-rules
00100 DIM HEADERS$(2)*20, WIDTHS(2), FORMS$(2)*20
00110 DIM ITEMS$(50)*30, PRICES(50), SELECTED_ROWS, SUBSCR(1)

00200 ! Set up list headers
00210 MAT HEADERS$ = ("Item", "Price")
00220 MAT WIDTHS = (30, 10)
00230 MAT FORMS$ = ("C 30", "N 8.2")

00300 ! Create list with FKey 1000
00310 PRINT FIELDS "5,10,LIST 10/40,HEADERS,1000": (MAT HEADERS$, MAT WIDTHS, MAT FORMS$)

00400 ! Populate list
00410 PRINT FIELDS "5,10,LIST 10/40,=": (MAT ITEMS$, MAT PRICES)

00500 ! Get user selection
00510 INPUT FIELDS "5,10,LIST 10/40,ROWCNT,SEL,1000": SELECTED_ROWS
00520 IF SELECTED_ROWS > 0 THEN
00530   MAT SUBSCR(SELECTED_ROWS)
00540   INPUT FIELDS "5,10,LIST 10/40,ROWSUB,SEL,NOWAIT": MAT SUBSCR
00550   ! Process selected items
00560   FOR I = 1 TO SELECTED_ROWS
00570     PRINT "Selected: "; ITEMS$(SUBSCR(I)); " at $"; PRICES(SUBSCR(I))
00580   NEXT I
00590 END IF
```

**Special Considerations**:
- Headers must be set before populating data
- Use parentheses to group multiple arrays for single control
- CHG flags reset after reading changed data

### Practical File Operations with GUI Controls

**Example - Complete Order Entry System**:

This example demonstrates integrating GUI controls with file operations:

```business-rules
! Open file for order storage with keyed access
00440 OPEN #1: "NAME=ORDERS.INT,RECL=118,USE,KFNAME=LASTFIRST.INT,KPS=31/1,KLN=30/30", INTERNAL, OUTIN, KEYED

! Collect customer information using input fields
00030 DIM CLIENTFORM$(6)*20, CLIENTWORDS$(6)*20, ANSWERFORM$(6)*30, ANSWERS$(6)*30, ORDERED(3)
00040 DATA "5,3,C 20","6,3,C 20","7,3,C 20","8,3,C 10","8,36,C 10","9,3,C 10"
00050 READ MAT CLIENTFORM$
00060 DATA "First Name: ","Last Name: ","Address: ","City: ","State: ","Zip Code: "
00070 READ MAT CLIENTWORDS$
00080 DATA "5,20,C 30","6,20,C 30","7,20,C 30","8,20,C 15","8,43,C 2","9,20,C 7"
00090 READ MAT ANSWERFORM$
00110 PRINT FIELDS MAT CLIENTFORM$: MAT CLIENTWORDS$
00130 INPUT FIELDS MAT ANSWERFORM$: MAT ANSWERS$

! Radio buttons for shipping preference
00160 LET X$="^Overnight"  ! Default selection
00170 LET Y$="Regular"
00180 PRINT FIELDS "12,5,C 30": "Shipping preference: "
00190 RINPUT FIELDS "13,5,RADIO 10,2,8;14,5,RADIO 7,2,9": X$,Y$
00220 IF X$(1:1)="^" THEN SHIPPING$="O"
00230 IF Y$(1:1)="^" THEN SHIPPING$="R"

! Checkboxes for item selection
00310 PRINT FIELDS "20,5,C 35": "Please select items to order:"
00340 PRINT FIELDS "23,30,CC 8,,B99": "Done"
00350 DO
00360   INPUT FIELDS "22,14,CHECK 8,,10;23,14,CHECK 8,,11;24,14,CHECK 8,,12": BOX$(1),BOX$(2),BOX$(3)
00380 LOOP WHILE FKEY~=99
00390 FOR I=1 TO UDIM(BOX$)
00400   IF BOX$(I)(1:1)="^" THEN ORDERED(I)=1 ELSE ORDERED(I)=0
00410 NEXT I

! Write complete order to file
00450 WRITE #1, USING RECFORM: MAT ANSWERS$, SHIPPING$, MAT ORDERED
00460 RECFORM: FORM C 30,C 30,C 30,C 15,C 2,C 7,C 1,N 1,N 1,N 1
00470 CLOSE #1:
```

**Example - Searching Keyed Files**:

```business-rules
! Open keyed file for searching
00010 OPEN #1: "NAME=ORDERS.INT,KFNAME=FIRSTLAST.INT,KPS=1,KLN=60", INTERNAL, INPUT, KEYED

! Search by last name
00007 PRINT FIELDS "2,2,C 50": "Which last name do you wish to search for?"
00008 INPUT FIELDS "4,2,C 30": LASTNAME$

! Read first matching record
00016 READ #1, USING READFORM, SEARCH=LASTNAME$: FIRST$,LAST$,ADDRESS$,CITY$,STATE$,ZIPCODE$,SHIPMETHOD$,ITEM1,ITEM2,ITEM3
00017 READFORM: FORM C 30,C 30,C 30,C 15,C 2,C 7,C 1,N 1,N 1,N 1

! Display results
00018 PRINT FIELDS "8,2,C 6;8,9,C 30;8,39,C 1;8,40,C 30": "Name: ",FIRST$," ",LAST$
00019 PRINT FIELDS "9,2,C 9;9,12,C 30": "Address: ",ADDRESS$

! Allow navigation through multiple matches
00021 PRINT FIELDS "17,2,C 15": "Next record?"
00022 PRINT FIELDS "18,2,CC 10,,B8;18,14,CC 10,,B9": "Yes","Quit"
00023 AGAIN: !
00024 DO
00025   INPUT FIELDS "24,1,C 1": NOMATTER$
00026 LOOP UNTIL FKEY=8 OR FKEY=9
00027 IF FKEY=8 THEN
00028   READ #1, USING READFORM: FIRST$,LAST$,ADDRESS$,CITY$,STATE$,ZIPCODE$,SHIPMETHOD$,ITEM1,ITEM2,ITEM3
00029   ! Display next record...
00030   GOTO AGAIN
00031 ELSE 
00032   END
```

**Example - Reading File into Arrays for Grid Display**:

```business-rules
! Read file records into arrays for grid/list display
00120 OPEN #1: "NAME=ORDERS.INT,RECL=118,USE", INTERNAL, OUTIN

! Initialize arrays to size 0
00140 MAT FIRSTNAME$(0)
00150 MAT LASTNAME$(0)
00160 MAT ADDRESS$(0)

00250 READTHENEXTONE: !
00260 READ #1, USING RECFORM: MAT ANSWERS$, SHIPPING$, MAT ORDERED EOF DONEREADING
00270 RECFORM: FORM C 30,C 30,C 30,C 15,C 2,C 7,C 1,N 1,N 1,N 1

! Expand arrays by 1 for new record
00290 LET NEWSIZE=UDIM(FIRSTNAME$)+1
00310 MAT FIRSTNAME$(NEWSIZE)
00320 MAT LASTNAME$(NEWSIZE)
00330 MAT ADDRESS$(NEWSIZE)

! Store record data
00420 FIRSTNAME$(NEWSIZE)=ANSWERS$(1)
00430 LASTNAME$(NEWSIZE)=ANSWERS$(2)
00440 ADDRESS$(NEWSIZE)=ANSWERS$(3)

00530 GOTO READTHENEXTONE

00550 DONEREADING: !
! Arrays now contain all file data ready for grid/list display
```
- Shift+PgUp/PgDn selects within control
- Compatible with FILTER field for search functionality
- User sorting doesn't affect BR program (data returned in original order)

### Special Processing Features

#### Multiple Statements per Field
```business-rules
00100 ! Process 3 fields in one statement
00110 INPUT FIELDS "10,10,C 20;12,10,N 10.2;14,10,C 30": NAME$, AMOUNT, DESCRIPTION$
```

#### Array-based Field Processing
```business-rules
00100 DIM FLDSPEC$(5)*30, VALUES$(5)*50
00110 DATA "10,10,C 20","12,10,C 30","14,10,N 10.2","16,10,C 15","18,10,C 25"
00120 READ MAT FLDSPEC$
00130 RINPUT FIELDS MAT FLDSPEC$: MAT VALUES$
```

#### Text Box with Word Wrap
```business-rules
00100 ! Open a window for text entry
00110 OPEN #10: "SROW=10,SCOL=10,ROWS=5,COLS=40", DISPLAY, OUTIN
00120 ! Allow 2000 chars with wrapping in window
00130 RINPUT #10,FIELDS "1,1,100/C 2000,N/W:W": TEXT$
00140 CLOSE #10:
```

### Screen Navigation Keys
- `Tab` / `Shift+Tab` - Next/previous field
- `Enter` - Next field (unless NOWAIT)
- `F1` - Field help
- `Esc` - Cancel input
- `PgUp` / `PgDn` - Scroll in grids/lists
- `Home` / `End` - First/last character in field
- `Ctrl+Home` / `Ctrl+End` - First/last field

### Error Conditions
- `CONV` - Conversion error (wrong data type)
- `ERROR` - General error
- `EXIT` - User pressed Esc
- `HELP` - User pressed Help key
- `SOFLOW` - String overflow

## Libraries

### Overview
Business Rules! includes a comprehensive Library Facility enabling programs to access user-defined functions from separate programs (libraries). Libraries work similarly to DLLs (Dynamic Link Libraries) and can be loaded in three ways:
- **Resident**: Stays loaded regardless of main program status
- **Present**: Remains active as long as main program is active
- **As-needed**: Loaded when needed, unloaded after function execution

### Key Benefits
1. **Reduces executable size** - Eliminates duplicate function code across programs
2. **Saves maintenance time** - Change once, update everywhere
3. **Encourages standards** - Promotes consistent programming practices
4. **Memory flexibility** - Choose optimal loading strategy per environment

### Library Function Definition

#### DEF LIBRARY Statement
```bnf
<def-library> ::= DEF LIBRARY <function-name>[(<parameters>)]
                  <function-body>
                  FNEND
```

Example:
```business-rules
52400 DEF LIBRARY FNRESLIB2
52500    PRINT "This is a library function"
52600 FNEND

52700 DEF LIBRARY FNSEND(MESSAGE$*60)
52800    IF NOT COMM_OPENED THEN 
52900       OPEN #40: "NAME=COM2:,FORMAT=ASYNC,BAUD=2400",DISPLAY,OUTIN
53000       LET COMM_OPENED = 1
53100    END IF
53200    PRINT #40: MESSAGE$
53300 FNEND
```

### LIBRARY Statement Syntax

#### Complete Syntax
```bnf
<library-statement> ::= LIBRARY [RELEASE] [,NOFILES] ["<library-name>"] : <function>[,<function>]*
                      | LIBRARY ["<library-name>"] :
```

#### Statement Types

##### Named Linkage
Explicitly links functions to a specific library:
```business-rules
00100 LIBRARY "PRESLIB": FNPRESLIB1, FNPRESLIB2, FNPRESLIB3
00200 LIBRARY "ENV$(BRLIBS)mylib.br": fnprocess, fnvalidate
```

##### Unnamed Linkage
BR! searches loaded libraries for functions:
```business-rules
00100 LIBRARY : FNALIBI, FNPROCESS  ! Search all loaded libraries
```

##### As-Needed Loading (RELEASE)
Library loaded only when function called:
```business-rules
00100 LIBRARY RELEASE,"ASNLIB": FNASNLIB1, FNASNLIB2
00200 LET FNASNLIB1  ! Loads ASNLIB, executes function, unloads
```

##### Independent File System (NOFILES)
Library maintains its own file handles:
```business-rules
00100 LIBRARY RELEASE,NOFILES,"MNTCUST": FNMNTCUST
```

### Library Loading Methods

#### 1. Resident Libraries
Loaded via LOAD command, remain in memory across program runs:
```business-rules
00100 EXECUTE "LOAD RESLIB,RESIDENT"
00110 LIBRARY "RESLIB": FNRESLIB1
00120 LET FNRESLIB1
```

#### 2. Present Libraries
Remain loaded while main program is active:
```business-rules
! Method 1: Load immediately
00100 LIBRARY "CURLIB":  ! Loads library now

! Method 2: Load on first use
00200 LIBRARY "CURLIB": FNCURLIB1
00210 LET FNCURLIB1  ! Loads library on first call
```

#### 3. As-Needed Libraries
Loaded and unloaded for each function call:
```business-rules
00100 LIBRARY RELEASE,"ASNLIB": FNASNLIB1
00110 LET FNASNLIB1  ! Load, execute, unload
```

### Common Library Functions (FNSNAP Screen Processing)

BR! systems commonly include the FNSNAP library for advanced screen processing capabilities. These functions extend BR!'s native screen handling with dialog boxes, buttons, progress bars, and GUI-like features.

#### Dialog and Message Functions

##### FNBUTTON - Button Bar Management
```business-rules
FNBUTTON(BUTTON_TEXT$, FK; BTN)
```
Creates buttons on the button bar (left to right).
- `BUTTON_TEXT$`: Text to display (max 10 chars)
- `FK`: Function key value to return when pressed
- `BTN`: Optional button number to replace existing button

##### FNCLRBUTTON - Remove Button
```business-rules
FNCLRBUTTON(; BTN)
```
Removes button from button bar.
- `BTN`: Button number (99 clears all buttons)

##### FNDIALOG$ - Dialog Box Display
```business-rules
FNDIALOG$*40(SROW$, SCOL$, DBWIDTH, TXTSTR$*900, OPT1$*40, OPT2$*40, OPT3$*40, REMOVE, DFLTOPT, DISPANYKEY, KEYWAIT)
```
Displays dialog box with up to three options. Returns selected text.

##### FNOK - OK/Cancel Dialog
```business-rules
FNOK
```
Displays OK/Cancel dialog. Returns true if OK selected.

##### FNOPTIONS - Radio Button Selection
```business-rules
FNOPTIONS(MAT O$; DEFAULT, TITLE$*100, MESSAGE$*1000, WAITTIME, SROW, SCOL)
```
Creates popup radio button selection window.
- `MAT O$`: Array of option descriptions
- `DEFAULT`: Initially selected item number
- `TITLE$`: Window title
- `MESSAGE$`: Explanatory message
- `WAITTIME`: Auto-accept timeout (seconds)
- `SROW`, `SCOL`: Position parameters

##### FNOPTIONS$ - Checkbox Selection
```business-rules
FNOPTIONS$*100(MAT O$; DEFAULT$*100, TITLE$*100, MESSAGE$*1000, WAITTIME, NONE)
```
Creates popup checkbox selection window (multiple selections allowed).
- `NONE`: Flag allowing no selections if true

#### Help System Functions

##### FNHELP - Context-Sensitive Help
```business-rules
FNHELP(HPATH$*60, HFILE$*20, HBASE$, HFLD, HROW, HCOL; HTITLE$*80)
```
Displays help window based on cursor position.
- `HPATH$`: Help file directory path
- `HFILE$`: Help file name
- `HBASE$`: Anchor point in file
- `HFLD`: Field number (from CURFLD)
- `HROW`, `HCOL`: Cursor position for window placement
- `HTITLE$`: Optional window title

##### FNHELPTIP - Display Help Record
```business-rules
FNHELPTIP(PROGPATH$*100, TEXTFILE$*50, TITLE$*50, RECORD, HROW, HCOL; NO_WAIT)
```
Displays specific record from text file in popup window.
- `RECORD`: Record number to display

#### Window Button Functions

##### FNWINBUTTONS - GUI Buttons in Window
```business-rules
FNWINBUTTONS(BROW, BTEXT$*100; BWIN, CENTER, FONT$)
```
Creates GUI-style buttons in specified window (4.17+ GUI mode only).
- `BROW`: Row position (negative counts from bottom)
- `BTEXT$`: Button definitions (^F1:Text format)
- `BWIN`: Window number
- `CENTER`: 1 to center buttons, 0 for right-align
- `FONT$`: Optional font specification

##### FNPFKEYLINE - Function Key Line
```business-rules
FNPFKEYLINE(ROW, TXT$*80; FKWIN)
```
Creates hot-clickable function key line in window.
- `ROW`: Row number (negative from bottom, 0 = bottom)
- `TXT$`: Text with function keys (^F9 Exit format)
- `FKWIN`: Window number

#### String Processing Functions

##### FNENCRYPT$ - Simple Encryption
```business-rules
FNENCRYPT$(PW$)
```
Basic string encryption (not for sensitive data).

##### FNDECRYPT$ - Decryption
```business-rules
FNDECRYPT$(PW$)
```
Decrypts FNENCRYPT$ output.

##### FNPROPER$ - Title Case Conversion
```business-rules
FNPROPER$*60(A_IN$*60)
```
Converts string to title/proper case.

##### FNPHONE$ - Phone Number Formatting
```business-rules
FNPHONE$(X)
```
Formats 10-digit number as (###) ###-####.

#### Screen Information Functions

##### FNWINROWCOL - Window Dimensions
```business-rules
FNWINROWCOL(WINNO, &WROWS, &WCOLS)
```
Returns window dimensions (GUI mode only).
- `WINNO`: Window number
- `WROWS`, `WCOLS`: Return variables for dimensions

##### FNWINSIZE - All Windows Information
```business-rules
FNWINSIZE(MAT S_WINNO, MAT S_SROW, MAT S_SCOL, MAT S_EROW, MAT S_ECOL, MAT S_ROWS, MAT S_COLS, MAT S_PARENT)
```
Populates arrays with all open windows' dimensions.

##### FNPARSERES - Resolution Information
```business-rules
FNPARSERES(W$, MAT SCRNRES, MAT WINRES, MAT CONRES)
```
Returns screen and window resolution data.
- `W$`: Workstation ID
- `MAT SCRNRES`: Terminal resolution in pixels
- `MAT WINRES`: Window resolution data
- `MAT CONRES`: Console resolution data

#### Progress and Wait Functions

##### FNPROGRESS - Progress Bar
```business-rules
FNPROGRESS(&PCT_WINDEV, PCT_TOTAL, PCT_DONE; SR$, CAPTION$*55)
```
Displays expandable progress bar.
- `PCT_TOTAL`: Total items to process
- `PCT_DONE`: Items completed
- `CAPTION$`: Progress bar caption

##### FNTEXTBOX - Text Input Box
```business-rules
FNTEXTBOX$*4000(&TEXTWIN, SROW, SCOL, ROWS, COLS, TLEN, PARENT, TEXT$*4000; BORDER, TKEY$)
```
Creates text box with word wrap capability.
- `TEXTWIN`: Window handle variable
- `SROW`, `SCOL`: Starting position
- `ROWS`, `COLS`: Box dimensions
- `TLEN`: Maximum text length
- `PARENT`: Parent window number
- `TEXT$`: Initial/returned text
- `BORDER`: 0 for no border
- `TKEY$`: Function key for hot window

#### Utility Functions

##### FNCHECK - Checkbox State
```business-rules
FNCHECK(L$*100)
```
Returns 1 if checkbox/radio element is checked.

##### FNCHECK$ - Toggle Check Mark
```business-rules
FNCHECK$*100(L$*100, L)
```
Adds/removes ^ check indicator based on flag.

##### FNFKEY - Convert Function Key Value
```business-rules
FNFKEY(AKEY)
```
Converts FKEY values > 1000 to standard values.

##### FNAUTO - Automatic Field Exit
```business-rules
FNAUTO(LASTFLD)
```
Returns 1 if last field exited automatically (E or X attribute).

##### FNCLKBUF - Clear Keyboard Buffer
```business-rules
FNCLKBUF
```
Clears keyboard buffer.

##### FNPRINTSCREEN - Trigger Print Screen
```business-rules
FNPRINTSCREEN
```
Programmatically triggers print screen (Ctrl-P).

#### Error Handling Functions

##### FNERRTRAP - Error Trapping
```business-rules
FNERRTRAP(EPROG$*50, ELINE, EERR, ECOUNT, EVARIABLE$, &ECURFLD, EMENU$)
```
Comprehensive error handling with logging and email notification.
- `EPROG$`: Program name
- `ELINE`: Error line number
- `EERR`: Error code
- `ECOUNT`: Variable count if applicable
- `EVARIABLE$`: Variable name if applicable
- `ECURFLD`: Current field number
- `EMENU$`: Menu to return to on unresolved error

#### Initialization Functions

##### FNINIT - Initialize FNSNAP Library
```business-rules
FNINIT(; SYSDIR$, SYS$)
```
Initializes FNSNAP library variables. Call once at program start.

### Variable Scope and Communication

#### Main Program ↔ Library Communication
Libraries **cannot** access main program global variables. Communication methods:
1. **Passed parameters**
2. **Function return value**
3. **Initialization functions** to set library globals

Example:
```business-rules
! Main program
00100 LIBRARY "CALC": FNINIT, FNCALC
00110 LET FNINIT(TAX_RATE, DISCOUNT_PCT)  ! Initialize library globals
00120 LET RESULT = FNCALC(AMOUNT)

! Library
00100 DIM TAX_RATE, DISCOUNT_PCT  ! Library globals
00200 DEF LIBRARY FNINIT(&RATE, &DISCOUNT)
00210    LET TAX_RATE = RATE
00220    LET DISCOUNT_PCT = DISCOUNT
00230 FNEND
00240 DEF LIBRARY FNCALC(AMT)
00250    LET FNCALC = AMT * (1 + TAX_RATE) * (1 - DISCOUNT_PCT)
00260 FNEND
```

#### Variable Clearing Rules

| Library Type | When Variables Cleared |
|-------------|------------------------|
| Main program functions | When main program ends |
| Resident (default) | When main program ends |
| Resident with OPTION RETAIN | Only when library cleared/reloaded |
| Resident with RELEASE | After each function call |
| As-needed (RELEASE) | After each function call |

### Library Search Order

When using unnamed linkage, BR! searches in this order:
1. Main program (always searched first)
2. Most recently loaded library
3. Previously loaded libraries (reverse load order)
4. As-needed libraries are NOT searched

Example:
```business-rules
01000 EXECUTE "LOAD RESLIB,RESIDENT"
01100 LIBRARY "PRESLIB1":
01200 LIBRARY "PRESLIB2":
01300 LIBRARY RELEASE,"ASNLIB": FNASNLIB1
01400 LIBRARY : FNALIBI
! Search order: Main → PRESLIB2 → PRESLIB1 → RESLIB
! ASNLIB not searched (not loaded)
```

### Linkage Management

#### Reassignment
Change function linkage to different library:
```business-rules
01300 LIBRARY "PRESLIB1": FNASSIGN
01400 LET FNASSIGN  ! Calls from PRESLIB1
01500 LIBRARY "PRESLIB2": FNASSIGN  ! Reassign
01600 LET FNASSIGN  ! Now calls from PRESLIB2
```

#### Detachment
- All linkages detached when main program ends
- No other way to completely detach linkage

### Advanced Features

#### Library Callbacks
Libraries can call functions in main program:
```business-rules
! Main program
00100 DEF LIBRARY FNGETDATA(RECNUM)
00110    READ #1,REC=RECNUM: DATA$
00120    LET FNGETDATA = DATA$
00130 FNEND
00140 LIBRARY "PROCESSOR": FNPROCESS
00150 LET FNPROCESS

! Library
00100 DEF LIBRARY FNPROCESS
00110    LIBRARY : FNGETDATA  ! Unnamed to find in main
00120    FOR I = 1 TO 100
00130       LET DATA$ = FNGETDATA(I)
00140       ! Process data
00150    NEXT I
00160 FNEND
```

#### Converting Programs to Library Functions
Transform entire program into callable function:
```business-rules
! Modified MNTCUST program
00010 LIBRARY "MNTCUST": FNMNTCUST
00020 LET FNMNTCUST
00030 CHAIN "MENU"
00040 DEF LIBRARY FNMNTCUST
   ... ! Original program code here
80000 FNEND

! Calling from another program
50000 LIBRARY RELEASE,NOFILES,"MNTCUST": FNMNTCUST
50010 LET FNMNTCUST  ! Run maintenance program as function
```

### Error Handling

When errors occur in library functions:
- Error reported back to calling program
- System variables set:
  - `LINE`: Line number of function call in main program
  - `ERR`: Error number from library
  - `CNT`: Appropriate value for context

### Performance Considerations

#### Memory Management
- Load resident libraries before application programs to avoid fragmentation
- Use CLEAR command to remove unused resident libraries
- Present libraries auto-removed when all linkages reassigned

#### Parameter Passing
Pass by reference (using &) for better performance:
```business-rules
DEF LIBRARY FNPROCESS(&MAT DATA$, &MAT VALUES)  ! Efficient
DEF LIBRARY FNPROCESS(MAT DATA$, MAT VALUES)     ! Copies data
```

#### Loading Strategies
- **Delayed loading**: Name library and functions together
- **Immediate validation**: Load library first, then establish linkage
```business-rules
! Delayed - library loaded on first use
00100 LIBRARY "MYLIB": FNTEST

! Immediate - validates functions exist
00200 LIBRARY "MYLIB":        ! Load now
00210 LIBRARY "MYLIB": FNTEST  ! Verify function exists
```

### STATUS LIBRARY Command
Display active library linkages:
```business-rules
STATUS LIBRARY
```
Shows:
- Library names and status
- Linked functions
- Variable clearing mode (RUN/END/EXIT/RETAIN)
- Memory usage

### Complete Example: Library Implementation
```business-rules
! === Main Program ===
00010 ! Initialize
00020 DIM MESG$*60, RESPONSE$*120
00030 
00040 ! Establish library linkage
00050 LIBRARY "TOOLS\LIB1": FNSEND, FNRECEIVE
00060 
00070 ! Main loop
00080 PRINT "Specify Message (blank to exit):"
00090 LINPUT MESG$
00100 IF LEN(MESG$) = 0 THEN STOP
00110 
00120 ! Call library functions
00130 LET FNSEND(MESG$)
00140 IF FNRECEIVE(RESPONSE$) THEN 
00150    PRINT "Response: "; RESPONSE$
00160 ELSE 
00170    PRINT "No Response"
00180 END IF
00190 GOTO 80

! === Library: TOOLS\LIB1 ===
00010 ! Communication Library
00020 DIM COMM_OPENED
00030 
00040 DEF LIBRARY FNSEND(MESSAGE$*60)
00050    IF NOT COMM_OPENED THEN 
00060       OPEN #40: "NAME=COM2:,FORMAT=ASYNC,BAUD=2400",DISPLAY,OUTIN
00070       LET COMM_OPENED = 1
00080    END IF
00090    PRINT #40: MESSAGE$
00100 FNEND
00110 
00120 DEF LIBRARY FNRECEIVE(&RESP$)
00130    LINPUT #40: RESP$ IOERR 140
00140    LET FNRECEIVE = LEN(RESP$)
00150 FNEND
```

### FileIO Library
FileIO is a comprehensive library for managing data file operations with automatic file layout management, versioning, and data migration. It revolutionizes BR! file handling by eliminating the need to hard-code file structures in programs.

#### Core Benefits
- **Automatic Field Mapping**: Access fields by name instead of position
- **Version Control**: Automatic data migration when file structure changes
- **File Creation**: Automatically creates data files from layouts
- **Data Independence**: Change file structures without modifying programs
- **Built-in Utilities**: Data crawler, import/export, layout generation

#### Setup Requirements

##### Required Arrays and Variables
```business-rules
01020 DIM form$(1)*255                     ! Form statements array (255 is BR limit)
01030 DIM color$(1)*1000, color(1)         ! File data arrays (string & numeric)
01040 DIM colorcat$(1)*1000, colorcat(1)   ! Additional file arrays

! String array element length must be >= largest field in file
! Recommend 1000 for future-proofing (supports memo fields)
```

##### Library Declaration
```business-rules
02020 LIBRARY "fileio.br": fnopenfile, fnreaddescription$, fnreadnumber, fnbuildkey$
```

##### Required fnOpen Function
```business-rules
99010 OPEN: ! Function to call library and process subscripts
99020    DEF Fnopen(Filename$*255, Mat F$, Mat F, Mat Form$; Inputonly, Keynum, Dont_Sort_Subs, Path$*255, Mat Descr$, Mat Field_Widths, Supress_Prompt, Ignore_Errors, Suppress_Log, ___, Index)
99030       DIM _FileIOSubs$(1)*800, _Loadedsubs$(1)*80
99040       LET Fnopen=Fnopenfile(Filename$, Mat F$, Mat F, Mat Form$, Inputonly, Keynum, Dont_Sort_Subs, Path$, Mat Descr$, Mat Field_Widths, Mat _FileIOSubs$, Supress_Prompt, Ignore_Errors, Program$, Suppress_Log)
99050       IF Srch(_Loadedsubs$, Uprc$(Filename$))<=0 THEN : MAT _Loadedsubs$(Udim(_Loadedsubs$)+1) : LET _Loadedsubs$(Udim(_Loadedsubs$))=Uprc$(Filename$) : FOR Index=1 TO Udim(Mat _Fileiosubs$) : EXECUTE (_Fileiosubs$(Index)) : NEXT Index
99060    FNEND
```

#### File Layout Definition
File layouts are stored in the `filelay/` directory as ASCII text files:

##### Layout Structure
```
filename.dat, PREFIX_, version
keyfile.key, KEY_FIELD
keyfile.ky2, FIELD1/FIELD2
keyfile.ky3, FIELD1/FIELD2-U/FIELD3
recl=127
===================================================
CODE$,          Item Code,              C    6
NAME$,          Item Name,              V   30
CATEGORY$,      Category Code,          C    4
PRICE,          Unit Price,             BH 3.2
COST,           Unit Cost,              BH 3.2
ONHAND,         Quantity On Hand,       N    5
LASTDATE,       Last Update Date,       N    6  DATE(Julian)
NOTES$,         Item Notes,             C  500
! Comments start with exclamation mark
#eof#
```

##### Layout Components

**Header Line**: `filename.dat, PREFIX_, version`
- `filename.dat`: Physical data file name
- `PREFIX_`: Subscript prefix for field names (e.g., PR_ for price file)
- `version`: File version number (increment to trigger migration)

**Key Definitions**: 
- Simple key: `keyfile.key, FIELDNAME`
- Compound key: `keyfile.ky2, FIELD1/FIELD2/FIELD3`
- Case-insensitive: `keyfile.ky3, FIELDNAME-U`
- Mixed: `keyfile.ky4, FIELD1-U/FIELD2/FIELD3-U`

**Optional Parameters**:
- `recl=nnn`: Record length (calculated if omitted)

**Field Definitions**: `NAME, Description, FormSpec [DateFormat]`
- `NAME$`: String field subscript ($ suffix required)
- `NAME`: Numeric field subscript (no suffix)
- `Description`: Human-readable field description
- `FormSpec`: BR! form specification
- `DateFormat`: Optional date storage format

##### Form Specifications
| Type | Spec | Description |
|------|------|-------------|
| Character | `C n` | Fixed-length string |
| Variable | `V n` | Variable-length string |
| Numeric | `N n.d` | Numeric with decimals |
| Binary | `B n` | Binary integer |
| Binary Half | `BH n.d` | Binary with decimals |
| Packed Decimal | `PD n.d` | Packed decimal |
| Zoned Decimal | `ZD n.d` | Zoned decimal |
| Skip | `X n` | Skip n positions |

##### Date Formats
```
DATE(Julian)    ! Days since 1900
DATE(YMD)       ! YYYYMMDD
DATE(MDY)       ! MMDDYYYY
DATE(DMY)       ! DDMMYYYY
DATE(CYMD)      ! CCYYMMDD
```

#### Using FileIO in Programs

##### Opening Files
```business-rules
! Basic open for read/write
04020 LET colorfile = fnopen("color", MAT color$, MAT color, MAT form$)

! Open read-only (faster, doesn't open secondary keys)
04030 LET custfile = fnopen("customer", MAT cust$, MAT cust, MAT form$, 1)

! Open using specific key
04040 LET pricefile = fnopen("price", MAT price$, MAT price, MAT form$, 0, 2)

! Open with all options
04050 LET datafile = fnopen("data", MAT data$, MAT data, MAT form$, _
         0,        ! InputOnly (0=outin, 1=input)
         1,        ! KeyNum (which key to use)
         0,        ! DontSortSubs (always use 0)
         "data/",  ! Path prefix
         MAT desc$,! Field descriptions
         MAT width,! Field display widths
         2,        ! SuppressPrompt (2=auto-create)
         0,        ! IgnoreErrors
         0)        ! SuppressLog
```

##### Reading Records
```business-rules
! Read by key
30120 READ #colorfile, USING form$(colorfile), KEY=searchkey$: MAT color$, MAT color EOF Ignore

! Read by record number
30130 READ #colorfile, USING form$(colorfile), REC=recordnum: MAT color$, MAT color

! Sequential read
30140 READ #colorfile, USING form$(colorfile): MAT color$, MAT color EOF EndOfFile
```

##### Accessing Data
```business-rules
! FileIO creates subscript variables automatically
30180 LET ColorCode$ = color$(co_Code)      ! String field
30190 LET ColorName$ = color$(co_Name)      ! String field
30200 LET Price = color(co_Price)           ! Numeric field
30210 LET OnHand = color(co_OnHand)         ! Numeric field

! Subscripts are prefixed with layout prefix
! For "color.dat, CO_, 1" the subscripts become:
! CO_CODE, CO_NAME, CO_PRICE, CO_ONHAND, etc.
```

##### Writing Records
```business-rules
! Populate arrays
40100 MAT color$ = ("")
40110 MAT color = (0)
40120 LET color$(co_Code) = "RED001"
40130 LET color$(co_Name) = "Bright Red"
40140 LET color(co_Price) = 19.95

! Write new record
40200 WRITE #colorfile, USING form$(colorfile): MAT color$, MAT color

! Update existing record
40300 REWRITE #colorfile, USING form$(colorfile): MAT color$, MAT color
```

#### File Versioning and Migration

##### Version Management
1. Start all layouts at version 0
2. Increment version when changing structure
3. FileIO detects version mismatch
4. Automatically migrates data to new structure
5. Creates backup in `filelay/version/` folder

##### Migration Process
```
Original Layout (version 0):
CODE$,    Item Code,    C 6
NAME$,    Item Name,    C 30
PRICE,    Price,        N 5.2

Updated Layout (version 1):
CODE$,    Item Code,    C 8     ! Lengthened
NAME$,    Item Name,    C 30    ! Unchanged
DESC$,    Description,  C 50    ! New field
PRICE,    Price,        N 7.2   ! Expanded
! OLDFIELD removed
```

FileIO automatically:
- Copies matching fields by name
- Initializes new fields (blank/""/0)
- Drops removed fields
- Handles data type conversions

#### Primary Functions Reference

##### fnOpen
Opens a file and sets up field subscripts.

```business-rules
DEF Fnopen(Filename$*255, Mat F$, Mat F, Mat Form$; Inputonly, Keynum, Dont_Sort_Subs, Path$*255, Mat Descr$, Mat Field_Widths, Supress_Prompt, Ignore_Errors, Suppress_Log)
```

**Parameters**:
- `Filename$`: Layout name (without extension)
- `Mat F$`: String array for data
- `Mat F`: Numeric array for data
- `Mat Form$`: Form statements array
- `Inputonly`: 0=outin, 1=input only
- `Keynum`: Key to use (1-based), -1=relative
- `Dont_Sort_Subs`: Always use 0
- `Path$`: Data file path prefix
- `Mat Descr$`: Returns field descriptions
- `Mat Field_Widths`: Returns display widths
- `Supress_Prompt`: 0=prompt, 1=no create, 2=auto-create
- `Ignore_Errors`: 0=show errors, 1=log only
- `Suppress_Log`: 0=log, 1=no log

##### fnCloseFile
Closes file and all associated key files.

```business-rules
fnCloseFile(FileNumber, FileLayout$; Path$)
```

##### fnBuildKey$
Builds a key value from record data.

```business-rules
LET key$ = fnBuildKey$(Layout$, Mat F$, Mat F; KeyNum)
```

**Example**:
```business-rules
! Build key for customer lookup
MAT customer$ = ("")
MAT customer = (0)
LET customer$(cu_name) = "SMITH"
LET customer$(cu_phone) = "555-1234"
LET searchkey$ = fnBuildKey$("customer", MAT customer$, MAT customer, 2)
READ #custfile, KEY=searchkey$: MAT customer$, MAT customer NOKEY NotFound
```

#### File Reading Functions

##### fnReadDescription$
Reads a description field from a related file.

```business-rules
LET description$ = fnReadDescription$(FileNum, FieldSubscript, Key$, Mat Work$, Mat Work, Mat Form$)
```

**Example**:
```business-rules
! Get category name for product's category code
LET CategoryName$ = fnReadDescription$(CategoryFile, CA_NAME, Product$(PR_CATEGORY), MAT Category$, MAT Category, MAT form$)
```

##### fnReadAllKeys
Reads all records, returning specified fields.

```business-rules
fnReadAllKeys(FileNum, Mat F$, Mat F, Mat Form$, Subscript1, Mat Output1$; Subscript2, Mat Output2$)
```

**Example**:
```business-rules
! Get all customer codes and names
fnReadAllKeys(CustFile, MAT Cust$, MAT Cust, MAT Form$, CU_CODE, MAT CustCodes$, CU_NAME, MAT CustNames$)
```

##### fnReadMatchingKeys
Reads records matching a partial key.

```business-rules
fnReadMatchingKeys(FileNum, Mat F$, Mat F, Mat Form$, Key$, KeySub, OutSub, Mat Output$)
```

#### Utility Functions

##### Data Crawler
View/edit data files interactively.

```business-rules
LIBRARY "fileio.br": fnDataCrawler, fnDataEdit
LET result = fnDataCrawler("customer")  ! View in listview
LET result = fnDataEdit("customer")     ! Edit in grid
```

##### CSV Import/Export
```business-rules
LIBRARY "fileio.br": fnCSVImport, fnCSVExport

! Export to CSV
fnCSVExport("customer", 1, "customers.csv", 1)

! Import from CSV
fnCSVImport("customer", 1, "customers.csv", -1)  ! -1=add all
```

##### Layout Generation
Analyze existing code to create layouts.

```business-rules
LIBRARY "fileio.br": fnGenerateLayout
! Scans BR programs to reverse-engineer file layouts
```

##### File Maintenance
```business-rules
LIBRARY "fileio.br": fnReIndex, fnReIndexAllFiles, fnRemoveDeletes

! Reindex single file
fnReIndex("customer")

! Reindex all files
fnReIndexAllFiles

! Remove deleted records
fnRemoveDeletes("customer")
```

#### Advanced Features

##### Custom Code Templates
Create code generation templates in `filelay/templates/`:
- Generate CRUD operations
- Build maintenance screens
- Create reports

##### Date Field Support
```
BIRTHDATE,  Birth Date,  N 6  DATE(Julian)
```

FileIO handles date conversions for:
- Data Crawler display
- CSV import/export
- Automatic migrations

##### Progress Bar
```business-rules
LIBRARY "fileio.br": fnProgressBar, fnCloseBar

FOR i = 1 TO 1000
    ! Process records
    LET percent = i / 1000
    fnProgressBar(percent, "Green", 0, 0, 0, "Processing...", "Record " & STR$(i))
NEXT i
fnCloseBar
```

#### Best Practices

##### Array Sizing
```business-rules
! Size string elements for largest possible field
DIM customer$(1)*1000  ! Handles up to 1000-char fields
DIM customer(1)        ! Numeric array
```

##### Version Control
1. Never decrement version numbers
2. Test migrations on backup data first
3. Keep version history for rollback
4. Document changes in layout comments

##### Field Naming
- Use consistent prefixes per file
- Never rename fields (add new, drop old)
- Use descriptive names
- Maintain naming conventions

##### Performance
- Open files read-only when possible (faster)
- Use specific key numbers
- Cache frequently accessed lookups
- Close files when done

##### Error Handling
```business-rules
04100 LET custfile = fnopen("customer", MAT cust$, MAT cust, MAT form$, 0, 1, 0, "", MAT desc$, MAT width, 0, 1)
04110 IF custfile = 0 THEN
04120    PRINT "Failed to open customer file"
04130    STOP
04140 END IF
```

#### Configuration (fileio.ini)
```ini
LayoutPath$=filelay/
VersionPath$=filelay/version/
TemplatePath$=filelay/templates/
DateFormatExport$=m/d/cy
DateFormatDisplay$=m/d/cy
LogFile$=fileio.log
Debug=0
```

#### Migration Example
```business-rules
! Original customer layout (version 0)
! customer.dat, CU_, 0
! CODE$,    Customer Code,    C 6
! NAME$,    Customer Name,    C 30

! Updated customer layout (version 1)
! customer.dat, CU_, 1
! CODE$,    Customer Code,    C 10    ! Expanded
! NAME$,    Customer Name,    C 50    ! Expanded
! EMAIL$,   Email Address,    C 60    ! New field
! PHONE$,   Phone Number,     C 20    ! New field

! Programs using FileIO continue working without changes
! FileIO handles the migration automatically
```
- `Mat F`: Numeric data array
- `Mat Form$`: Form statements array
- `InputOnly`: 1=read-only, 0=read/write (default: 0)
- `KeyNum`: Key file to use (default: 1, -1 for relative)
- `DontSortSubs`: 0=sort fields (default: 0)
- `Path$`: Override data file path
- `Mat Descr$`: Return field descriptions
- `Mat FieldWidths`: Return display widths
- `SuppressPrompt`: 0=use default, 1=never create, 2=auto-create
- `IgnoreErrors`: 1=log errors and continue
- `SuppressLog`: 1=don't log this file

##### Reading Files
```business-rules
30120 READ #colorfile, USING form$(colorfile): MAT color$, MAT color EOF Ignore
```

##### Accessing Data
```business-rules
30180 LET ColorCode$ = color$(co_Code)
30190 LET ColorName$ = color$(co_Name)
30200 LET Price = color(co_Price)
```

#### File Versioning
FileIO automatically handles file structure updates:
1. Increment version number in layout file
2. FileIO detects version mismatch
3. Creates backup of old file
4. Creates new file with updated structure
5. Migrates data field by field
6. Preserves data where field names match

#### FileIO Utilities

##### Data Crawler
View and edit data files directly:
```business-rules
! Run FileIO directly to access Data Crawler
! Or call from code:
LIBRARY "fileio.br": fnDataCrawler, fnDataEdit
LET result = fnDataCrawler("customer")  ! View in listview
LET result = fnDataEdit("customer")     ! Edit in grid
```

##### Import/Export
```business-rules
LIBRARY "fileio.br": fnCSVImport, fnCSVExport
LET result = fnCSVExport("customer", "export.csv")
LET result = fnCSVImport("customer", "import.csv")
```

##### Layout Generation
```business-rules
LIBRARY "fileio.br": fnGenerateLayout, fnWriteLayout
! Analyzes existing BR code to generate layouts
```

#### Field Types and Form Specs
FileIO supports all BR! data types:
- **String**: `C n` (character, length n)
- **Variable String**: `V n` (variable length, max n)
- **Numeric**: `N n.d` (numeric, n digits, d decimals)
- **Binary**: `B n`, `BH n.d` (binary numeric)
- **Packed**: `PD n.d` (packed decimal)
- **Zoned**: `ZD n.d` (zoned decimal)
- **Skip**: `X n` (skip n positions)

Date handling:
- Specify date format: `DATE(Julian)`, `DATE(YMD)`, `DATE(MDY)`, etc.
- FileIO handles conversion during import/export
- Programs must still pack/unpack dates

#### Best Practices
1. **Array Sizing**: Dimension string elements to handle largest possible field (e.g., 1000 chars)
2. **Version Control**: Always increment version when changing layouts
3. **Field Naming**: Don't rename fields (data loss), add new fields instead
4. **Key Definition**: Use `/` to separate compound keys, `-U` for case-insensitive
5. **Comments**: Use `!` for comments in layout files
6. **Testing**: Use Data Crawler to verify layouts before production use

## File Operations

### Introduction to File Processing

File processing is a fundamental requirement of data processing in BR!. Programs can work with up to 1,000 open files simultaneously, using OPEN and CLOSE statements to manage file access.

### File Types

BR! supports three main types of data files:

#### Internal Files
- **Purpose**: Binary data files optimized for efficiency
- **Format**: Uses extended character set and system-specific format
- **Visibility**: Cannot be directly viewed or printed in entirety
- **Access Methods**: Sequential, Relative, and Keyed access
- **Operations**: Can be opened for INPUT, OUTPUT, or OUTIN
- **Advantages**: Maximum efficiency and multiple access methods

#### Display Files
- **Purpose**: Human-readable text files
- **Format**: Printable ASCII characters
- **Visibility**: Can be viewed with TYPE command
- **Access Methods**: Sequential access only
- **Operations**: Can be opened for INPUT or OUTPUT (not OUTIN)
- **Usage**: Reports, data export/import, external communication

#### External Files
- **Purpose**: Text or binary files for general I/O
- **Format**: Various formats depending on application
- **Usage**: Interfacing with external systems

### File Usage Modes

When opening a data file, you must specify one of three usage modes:

#### INPUT Mode
- **Purpose**: Get information from the file into the program
- **Direction**: File → Program
- **Operations**: READ, REREAD statements
- **Available for**: Internal and Display files

#### OUTPUT Mode
- **Purpose**: Send new information from program to file
- **Direction**: Program → File
- **Operations**: WRITE statement
- **Available for**: Internal and Display files
- **Behavior**: Creates new file or overwrites existing

#### OUTIN Mode
- **Purpose**: Read and modify existing information
- **Direction**: Bidirectional (File ↔ Program)
- **Operations**: READ, REREAD, WRITE, REWRITE, DELETE
- **Available for**: Internal files only (not Display files)
- **Usage**: Updating records in place

### Data File Structure

#### Records
- **Definition**: A line of related information in a data file
- **Components**: Contains one or more fields
- **Identification**: Each record can be accessed by position or key

#### Fields
- **Definition**: A portion of a record reserved for specific data
- **Characteristics**: 
  - Programmer-defined length and placement
  - Can be numeric or character type
  - No limit to number of fields per record
- **Documentation**: Use record layout sheets to track field definitions

### Access Methods

BR! provides three methods for accessing records in data files:

#### Sequential Access
- **Description**: Access records in the order they were entered
- **File Pointer**: Moves from beginning to end, one record at a time
- **Usage**: Processing all records (e.g., calculating totals)
- **Efficiency**: Best for processing entire file
- **Available for**: Internal and Display files

#### Relative Access
- **Description**: Access records by numeric position
- **File Pointer**: Can jump directly to specific record number
- **Usage**: Accessing known record positions (e.g., records 71-100)
- **Efficiency**: Fast random access to specific records
- **Available for**: Internal files only

#### Keyed Access
- **Description**: Access records by key field value
- **File Pointer**: Locates records by matching key values
- **Usage**: Finding records by specific criteria (e.g., date ranges)
- **Features**: Can find exact match or next higher value
- **Available for**: Internal files only

#### File System Enhancements (3.90+)
- **Long filename support**: Full support for Windows long filenames
- **30-bit file locking**: Enables NFS and NetBui network record and file locks
- **Read-only file access**: Files opened INPUT now open read-only (allows read-only permissions)
- **Wildcard improvements**: More Unix-like wildcard matching:
  - `*` matches zero or more characters
  - `?` matches exactly one character
  - Special handling for files without periods for backward compatibility
- **Communications files**: For serial/network communication
- **Window files**: GUI window operations
- **SQL database connections**: (4.30+) Direct database access

### Display Files vs Internal Files

#### Display Files
**Definition**: Files containing human-readable text that can be printed or displayed without conversion

**Characteristics**:
- Data is stored as printable characters
- Each line corresponds to an output statement
- No special non-printing characters
- Can be sent directly to printer or screen
- Common extensions: .TXT, .DIS, .BRS (for source)

**Capabilities**:
- Sequential access only (no RELATIVE or KEYED)
- Cannot be opened OUTIN (only INPUT or OUTPUT)
- Cannot be used with SORT or INDEX commands
- Individual records cannot be deleted or updated
- Uses PRINT/INPUT/LINPUT statements (not READ/WRITE)

#### Internal Files
**Definition**: Binary data files with fixed-length records and structured data

**Characteristics**:
- Support numeric formats (packed decimal, binary)
- Fixed record length stored in header
- Can contain non-printable characters
- Require format conversion for display
- Common extensions: .INT, .DAT

**Capabilities**:
- Support SEQUENTIAL, RELATIVE, and KEYED access
- Can be opened OUTIN for simultaneous read/write
- Support SORT and INDEX operations
- Records can be deleted and updated in place
- Uses READ/WRITE/REWRITE/DELETE statements

### File Numbers
- **1-127**: User-defined file numbers
- **0**: Screen (default output)
- **255**: Default printer

### File I/O Statements

#### Internal File Statements
- **READ #filenum**: Read next record from file
- **REREAD #filenum**: Re-read current record
- **WRITE #filenum**: Write new record to file
- **REWRITE #filenum**: Update existing record
- **DELETE #filenum**: Delete current record
- **RESTORE #filenum**: Reset file pointer position

#### Display File Statements
- **PRINT #filenum**: Write formatted output
- **INPUT #filenum**: Read formatted input
- **LINPUT #filenum**: Read entire line as string

#### Statement Usage by File Mode
| Statement | INPUT | OUTPUT | OUTIN |
|-----------|-------|--------|-------|
| READ      | ✓     |        | ✓     |
| REREAD    | ✓     |        | ✓     |
| WRITE     |       | ✓      | ✓     |
| REWRITE   |       |        | ✓     |
| DELETE    |       |        | ✓     |
| RESTORE   | ✓     | ✓      | ✓     |

### TYPE Command

Displays the entire contents of a file on screen or printer.

#### Syntax
```business-rules
TYPE <drive:>\<filename>[.<ext>] [PRINT]
```

#### Parameters
- **filename**: Path to file to display
- **PRINT**: Optional; sends output to printer instead of screen

#### Examples
```business-rules
! Display file on screen
TYPE C:\DISFILE

! Send file to printer
TYPE C:\DISFILE PRINT

! Display program source
TYPE MYPROG.BRS
```

#### Usage Notes
- Works with display files and text files
- Cannot display internal files (binary format)
- Useful for viewing reports and logs

### File Processing Examples

#### Example: Mileage Tracking File
```business-rules
! Define record layout for MILES.DAT
! Field 1: Date (YYMMDD) - positions 1-6
! Field 2: Miles traveled - positions 7-12
! Field 3: Gallons used - positions 13-18
! Field 4: MPG - positions 19-24

00100 ! Sequential access - calculate overall fuel efficiency
00110 OPEN #1: "NAME=MILES.DAT,RECL=24", INTERNAL, INPUT, SEQUENTIAL
00120 LET TOTAL_MILES = 0
00130 LET TOTAL_GALLONS = 0
00140 DO
00150    READ #1 USING 160: DATE, MILES, GALLONS, MPG EOF 200
00160    FORM N 6, N 6.2, N 6.2, N 6.3
00170    LET TOTAL_MILES = TOTAL_MILES + MILES
00180    LET TOTAL_GALLONS = TOTAL_GALLONS + GALLONS
00190 LOOP
00200 CLOSE #1
00210 PRINT "Overall MPG:"; TOTAL_MILES / TOTAL_GALLONS

00300 ! Relative access - get records 71-100
00310 OPEN #2: "NAME=MILES.DAT,RECL=24", INTERNAL, INPUT, RELATIVE
00320 FOR I = 71 TO 100
00330    READ #2, USING 340, REC=I: DATE, MILES, GALLONS, MPG
00340    FORM N 6, N 6.2, N 6.2, N 6.3
00350    ! Process record...
00360 NEXT I
00370 CLOSE #2

00400 ! Keyed access - find records for July-August
00410 OPEN #3: "NAME=MILES.DAT,RECL=24,KFNAME=MILES.KEY", INTERNAL, INPUT, KEYED
00420 READ #3, USING 430, KEY>=070196: DATE, MILES, GALLONS, MPG
00430 FORM N 6, N 6.2, N 6.2, N 6.3
00440 DO WHILE DATE < 090196
00450    ! Process July-August records
00460    READ #3, USING 430: DATE, MILES, GALLONS, MPG EOF 480
00470 LOOP
00480 CLOSE #3
```

### OPEN Statement
Opens a file for processing. Syntax varies by file type and purpose.

#### Opening Display Files

Display files are text files containing ASCII characters. They can be opened for either INPUT or OUTPUT (but not both simultaneously) and are restricted to sequential processing. Display files are commonly used for reports, data export/import, and communication with external devices.

##### Complete Syntax
```bnf
OPEN #<file-number> : {"NAME=<file-ref>[, {NEW|USE|REPLACE}] [, RECL=<integer>] 
     [, PAGEOFLOW=<integer>] [, <share-spec>] [, RESERVE] [, WAIT=<integer>] 
     [, TRANSLATE=<file-ref>] [, EOL=<spec>] [, CONV=<char>] [, PRINTER=<name>]
     [, NOCLOSE] [, COPIES=<nn>] [, RETRY=<integer>] ,HTTP=CLIENT"|<string-expression>}, 
     DISPLAY, {INPUT|OUTPUT} 
     [<error-condition> <line-ref>][,...]
```

##### File ID String Parameters

###### Required Parameters
- `NAME=<file-ref>`: File or device to open
  - Can use `NAME=save` for save dialog
  - Can use `NAME=open` for open dialog
  - Can use `NAME=STD_OUT:` for standard output
  - Can use `NAME=COM1:` for serial port
  - Can use `NAME=//10` for PRN:/LPT1:
  - Can use `NAME=//11` for AUX:/COM1:

###### File Creation Mode
- `NEW`: Create new file (error 4150 if exists)
- `USE`: Open existing or create if not found
- `REPLACE`: Replace existing file without warning
- (default): Use existing file

###### Record Specification
- `RECL=<integer>`: Maximum record length (default 132 bytes)
  - Must be specified each time file is opened (unlike internal files)
  - During output, if characters exceed RECL, EOL characters are inserted

###### Page Control
- `PAGEOFLOW=<integer>`: Line number triggering PAGEOFLOW condition
  - Used primarily for printer page breaks
  - Default: 60 lines

###### End-of-Line Control
- `EOL=CRLF`: Carriage return + line feed (DOS default)
- `EOL=LF`: Line feed only (Unix/Linux default)
- `EOL=NONE`: No end-of-line characters
  - With LINPUT and EOL=NONE, can process one character at a time

###### Share Specifications
- `NOSHR`: Exclusive access (default)
- `SHR`: Others can read/write
- `SHRI`: Others can read only
- `SHRU`: Same as SHR (System/23 compatibility)

###### Special Options
- `RESERVE`: Lock file until explicitly released
- `WAIT=<integer>`: Seconds to wait for locked file
- `TRANSLATE=<file-ref>`: Character translation table (256 or 512 bytes)
- `CONV=<char>`: Fill character for numeric conversion errors
- `PRINTER=<name>`: Printer translation table from BRConfig.sys
- `NOCLOSE`: Keep file open when program ends
- `COPIES=<nn>`: Number of copies for print spooling
- `RETRY=<integer>`: Output retry attempts (default 5)

##### Access Mode
- `INPUT`: Read from file
- `OUTPUT`: Write to file
- Cannot use OUTIN with display files

##### Basic Examples
```business-rules
! Open existing file for input
00500 OPEN #2: "NAME=STATES", DISPLAY, INPUT

! Create new file for output
00510 OPEN #3: "NAME=zipcodes,NEW", DISPLAY, OUTPUT

! Replace existing file
00520 OPEN #4: "NAME=report.txt,REPLACE,RECL=80", DISPLAY, OUTPUT

! Open with page control for printer
00530 OPEN #5: "NAME=PRN:,PAGEOFLOW=55", DISPLAY, OUTPUT
```

##### Dynamic File Names
```business-rules
01005 PRINT "Enter FILE NAME for balances"
01010 INPUT F$
01015 LET F$ = "NAME=" & F$ & ".DAT"
01020 OPEN #2: F$, DISPLAY, INPUT

! Using month number
01030 OPEN #3: "NAME=SALES" & STR$(MONTH) & ".DAT", DISPLAY, INPUT
```

##### Special Devices and Streams
```business-rules
! Open serial port for modem communication
00200 OPEN #77: "NAME=COM1:", DISPLAY, OUTPUT

! Resize BR main window (#0)
00410 OPEN #0: "Srow=20, Scol=80, Caption=MY APPLICATION", DISPLAY, OUTPUT

! With button rows
00420 OPEN #0: "Srow=25, Scol=100, Caption=APP, Buttonrows=2", DISPLAY, OUTPUT
```

##### Character-by-Character Input
```business-rules
00010 DIM X$*1
00020 OPEN #1: "NAME=datafile,EOL=NONE", DISPLAY, INPUT
00030 LINPUT #1: X$ EOF DONE
00040 IF POS("AEIOU",X$)>0 THEN PRINT X$;" is a vowel"
00050 GOTO 30
00060 DONE: CLOSE #1
```

##### HTTP Client Operations (BR 4.2+)
```business-rules
! Open HTTP connection
00100 OPEN #1: "NAME=http://example.com/api,HTTP=CLIENT", DISPLAY, OUTPUT
! PRINT accumulates POST data
00200 PRINT #1: "data=value"
! First LINPUT triggers POST and returns response
00300 LINPUT #1: RESPONSE$ EOF DONE
```

##### Statements Used with Display Files
- `PRINT`: Output formatted data
- `INPUT`: Get formatted input
- `LINPUT`: Get line input
- `RINPUT`: Screen input only
- `RESTORE`: Reset file pointer

##### Special Pre-Opened Display Files
```business-rules
! File #0 - BR Main Window (no OPEN needed)
PRINT #0: "Hello"    ! Same as PRINT "Hello"
INPUT #0: NAME$      ! Same as INPUT NAME$

! File #255 - Printer (no OPEN needed, implicit OPEN on first use)
PRINT #255: "Report" ! Sends to printer
```

##### Important Notes

###### File Pointer Positioning
- **INPUT mode**: Pointer starts at beginning of file
- **OUTPUT mode**: Pointer starts at end of file (append)
- **REPLACE with OUTPUT**: Drops all existing records

###### Record Length Behavior
- During output: If characters exceed RECL, EOL characters are inserted
- During input: RECL has no effect; can input strings longer than RECL if variables are dimensioned large enough

###### EOL Processing
- **CRLF**: Adds CHR$(26) EOF marker when file is closed
- **INPUT processing**: Both CRLF and LF accepted as valid delimiters
- **LINPUT with EOL=NONE**: Reads until variable is full, buffer empty, or timeout

###### Error Conditions
- ERROR, EXIT, IOERR, LOCKED
- Error 4150: Duplicate file name (with NEW)
- Error 4146: File locked by another workstation
- Error 6298: Printer not ready (DOS/NetWork without SPOOLCMD)
- Error 0608: Cannot open for OUTIN after INPUT
- Error 0609: Printer translation table not found

#### OPEN Internal Statement

The OPEN Internal statement activates a Business Rules! internal file for input/output processing.

##### Complete Syntax
```bnf
OPEN #<file-number> : {"NAME=<file-ref>[, {NEW|USE|REPLACE}] [, RECL=<integer>] 
     [, KFNAME=<file-ref>] [, <key-spec>] [, <share-spec>] [, RESERVE] 
     [, VERSION=<integer>] [, WAIT=<integer>] [, TRANSLATE=<file-ref>]
     [, NOCLOSE] [, LINKED] [, {BTREE|ISAM}] [, TMPIDX]"|<string-expression>}, 
     INTERNAL, {INPUT|OUTPUT|OUTIN} 
     [, {SEQUENTIAL|RELATIVE|KEYED}] 
     [<error-condition> <line-ref>][,...]
```

##### Basic Examples
```business-rules
00500 OPEN #2: "NAME=STATES", INTERNAL, INPUT, SEQUENTIAL
00510 OPEN #3: "NAME=zipcodes,NEW,RECL=31", INTERNAL, OUTPUT, RELATIVE
00150 OPEN #1: "Name=test.int,RECL=128,USE", INTERNAL, OUTIN
```

##### File ID String Parameters

###### Required Parameters
- `NAME=<file-ref>`: File name to open (required)
  - Can use `NAME=save` for save dialog
  - Can use `NAME=open` for open dialog

###### File Creation Mode
- `NEW`: Create new file (error 4150 if exists)
- `USE`: Open existing or create if not found
- `REPLACE`: Replace existing file without warning
- (default): Use existing file

###### Record Specification
- `RECL=<integer>`: Record length in bytes (required for new files)
  - System adds 1 byte for deleted record flag
  - Efficient values: 2^N-1 (7, 15, 31, 63, 127, 255, 511, 1023)

###### Keyed File Parameters
- `KFNAME=<file-ref>`: Index file name (required for KEYED processing)
- `KPS=<pos>[/<pos>...]`: Key starting positions (up to 6 sections)
- `KLN=<len>[/<len>...]`: Key lengths for each section
  - Combined key length cannot exceed 128 bytes
  - Example: `KPS=1/10/20,KLN=4/2/2`

###### Share Specifications
- `NOSHR`: Exclusive access (default)
- `SHR`: Others can read/write/update
- `SHRI`: Others can read only
- `SHRU`: Same as SHR (System/23 compatibility)

###### Special Options
- `RESERVE`: Lock file until explicitly released
- `NOCLOSE`: Keep file open when program ends
- `VERSION=<integer>`: Version checking (0-32000)
- `WAIT=<integer>`: Seconds to wait for locked file/record
- `TRANSLATE=<file-ref>`: Character translation table
- `LINKED`: File uses linked records
- `BTREE`: Use B-tree indexing (default)
- `ISAM`: Use ISAM indexing
- `TMPIDX`: Create temporary index (removed on close)

##### Access Mode Keywords
- `INPUT`: Read-only access
- `OUTPUT`: Write-only access (appends for sequential)
- `OUTIN`: Read and write access

##### Access Method Keywords
- `SEQUENTIAL`: Records accessed in order (default)
- `RELATIVE`: Direct access by record number
- `KEYED`: Access by key field value

##### Creating Indexed Files
```business-rules
! Create master file with index
00100 OPEN #9: "NAME=history,REPLACE,RECL=80,KFNAME=hist.key,KPS=1/10/20,KLN=4/2/2", 
           INTERNAL, OUTPUT, KEYED
```

##### Linked Files
```business-rules
! Create linked file with key verification
00010 OPEN #1: "NAME=LINKFILE,NEW,RECL=63,LINKED,KPS=9/23,KLN=4/6", 
           INTERNAL, OUTIN, RELATIVE
```

##### Dynamic File Names
```business-rules
01005 PRINT "Enter FILE for balances"
01010 INPUT F$
01015 LET F$ = "NAME=" & F$ & ".DAT"
01020 OPEN #2: F$, INTERNAL, INPUT, SEQUENTIAL

! Or using month number
01030 OPEN #3: "NAME=SALES"&STR$(MONTH)&".DAT", INTERNAL, INPUT, RELATIVE
```

##### Error Handling
```business-rules
00100 OPEN #1: "NAME=data.int", INTERNAL, INPUT ERROR 1000
01000 ! Handle file not found or other errors
```

##### Important Notes

###### File Pointer Positioning
- **INPUT/OUTIN**: Pointer starts at beginning of file
- **OUTPUT**: Pointer starts at end of file (append mode)
- **REPLACE with OUTPUT**: All existing records dropped

###### Version Control
- Files can have version numbers (0-32000)
- Error 4125 if version mismatch
- Version 0 = no checking (default)

###### Record Locking
- Individual records locked during SHR access
- Use RESERVE to maintain lock
- Use RELEASE to unlock

###### Performance Considerations
- B-tree indexing is default (faster for most operations)
- ISAM available for compatibility
- Temporary indexes (TMPIDX) useful for one-time sorts

###### Special File Numbers
- #0: Reserved for screen (no OPEN needed)
- #255: Reserved for printer (no OPEN needed)
- #1-999: Available for user files

#### Opening Existing Internal Files
```bnf
OPEN #<file-num>: "NAME=<filename> [,<share-spec>] [,WAIT=<seconds>] [,RESERVE]", 
     INTERNAL, {INPUT|OUTPUT|OUTIN}, {SEQUENTIAL|RELATIVE|KEYED}
```

**Note**: Never include RECL= when opening existing files - stored in file header

### I/O Statements for Internal Files

#### READ Statement
Reads data from an open file into variables.

```bnf
READ #<file-num> [, USING <line-ref>] : <variable-list> 
     [EOF <line-ref>] [ERROR <line-ref>]
```

##### READ with Options
```bnf
READ #<file-num>, REC=<numeric-expr> : <variable-list>   ! Relative access
READ #<file-num>, KEY=<string-expr> : <variable-list>    ! Keyed access
```

##### Positional Parameters
```bnf
READ {FIRST|LAST|PRIOR|NEXT|SAME}
```

#### REREAD Statement
Re-reads the last record read (from memory buffer).

```bnf
REREAD #<file-num> [, USING <line-ref>] : <variable-list>
```

**Notes**:
- Must follow successful READ or REREAD
- Cannot have EOF clause (impossible to reach EOF)
- Improves performance when selectively processing fields

#### WRITE Statement
Adds new records to a file.

```bnf
WRITE #<file-num> [, USING <line-ref>] : <expression-list>
```

##### WRITE with Form Statement
```bnf
WRITE #<file-num>, USING <form-line> : <data-items>
FORM <format-spec> [, <format-spec>]...
```

#### REWRITE Statement
Updates the last record read.

```bnf
REWRITE #<file-num> [, USING <line-ref>] : <expression-list>
```

**Notes**:
- Must follow successful READ or REREAD
- Only changes specified fields (others remain unchanged)
- File must be opened OUTIN

#### DELETE Statement
Removes a record from a file.

```bnf
DELETE #<file-num> [, REC=<numeric-expr>] [, RESERVE|RELEASE] : 
       [<error-condition> <line-ref>]
DELETE #<file-num> [, KEY=<string-expr>] [, RESERVE|RELEASE] : 
       [<error-condition> <line-ref>]
```

##### DELETE Options
- Without REC=/KEY=: Deletes last record read
- `RESERVE`: Lock record (multi-user systems)
- `RELEASE`: Unlock record (multi-user systems)
- Space not automatically reclaimed (use COPY -D to reclaim)

#### RESTORE Statement
Repositions file pointer to beginning of file.

```bnf
RESTORE #<file-num> : [<error-condition> <line-ref>]
```

**Warning**: RESTORE on OUTPUT file erases all records!

#### CLOSE Statement
Closes an open file.

```bnf
CLOSE #<file-num> : [{DROP|FREE}]
```

##### CLOSE Options
- `DROP`: Delete the file after closing
- `FREE`: Release file but keep on disk
- Files automatically close at program end

### File Pointer Behavior

#### Sequential Processing
- **INPUT**: Pointer starts at first record
- **OUTPUT**: Pointer starts after last record (append mode)
- **OUTIN**: Pointer starts at first record

#### Record Locking (Multi-user)
- Default: Records locked on READ, released on WRITE
- `RESERVE`: Maintain lock after operation
- `RELEASE`: Remove all locks

### FORM Statement for File I/O
Defines format for READ/WRITE operations.

```bnf
FORM <format-spec> [, <format-spec>]...
```

#### Common Format Specifications
- `N n[.d]`: Numeric field, n digits, d decimals
- `C n`: Character field, n bytes
- `V n`: Variable-length string, max n bytes
- `X n`: Skip n positions
- `POS n`: Position to byte n
- `B n`: Binary integer
- `BH n.d`: Binary with decimals
- `PD n.d`: Packed decimal
- `ZD n.d`: Zoned decimal
- `DT 3` or `DT 4`: Date type using binary storage (Y2K compliant)
- `DL 3` or `DL 4`: Date long using binary storage (Y2K compliant)
- `DH 3` or `DH 4`: Date high using binary storage (Y2K compliant)

### I/O Statements for Display Files

Display files use different I/O statements than internal files:

#### PRINT Statement (Display File Output)
Writes data to display files, screen, or printer.

```bnf
PRINT #<file-num> [, USING <line-ref>] : <expression-list>
```

##### PRINT Formatting Options
- **Zone printing**: Items separated by commas (default tab positions)
- **Compact printing**: Items separated by semicolons (no spacing)
- **Format control**: Use USING with FORM statement

```business-rules
! Zone printing (with tabs)
500 PRINT #10: NAME$, ADDRESS$, PHONE$

! Compact printing (no spacing)
510 PRINT #10: NAME$;",";ADDRESS$;",";PHONE$

! Format control
520 PRINT #10, USING 530: NAME$, AMOUNT
530 FORM C 20, N 10.2
```

#### INPUT Statement (Display File Input)
Reads data from display files or keyboard.

```bnf
INPUT #<file-num> : <variable-list> [EOF <line-ref>]
```

**Important**: Data in file must be comma-separated (like keyboard input)

```business-rules
! Read comma-separated values
400 INPUT #20: NAME$, AGE, SALARY EOF 600

! Common problem - PRINT doesn't add commas
250 PRINT #10: 15, 19        ! Outputs: "15    19" (won't INPUT correctly)
250 PRINT #10: 15;",";19     ! Outputs: "15,19" (will INPUT correctly)
```

#### LINPUT Statement (Display File Line Input)
Reads entire line into single string variable.

```bnf
LINPUT #<file-num> : <string-variable> [EOF <line-ref>]
```

**Advantages over INPUT**:
- Accepts entire line including commas
- Preserves all punctuation
- No comma-separation needed
- Leading/trailing blanks preserved

```business-rules
! Read whole line including commas
500 LINPUT #10: FULLLINE$ EOF 900
```

#### RESTORE with Display Files

##### For OUTPUT Files
```bnf
RESTORE #<file-num>
```
**Warning**: Positions pointer at beginning and ERASES all existing data!

##### For INPUT Files
```bnf
RESTORE #<file-num>
```
Positions pointer at beginning without data loss.

### Display File Examples

#### Creating and Writing a Display File
```business-rules
00100 ! Create report file
00110 OPEN #1: "NAME=REPORT.TXT,REPLACE", DISPLAY, OUTPUT
00120 PRINT #1: "Sales Report for " & DATE$
00130 PRINT #1: "=" * 40
00140 PRINT #1: "Item", "Quantity", "Total"
00150 FOR I = 1 TO 10
00160   PRINT #1, USING 170: ITEM$(I), QTY(I), PRICE(I)*QTY(I)
00170   FORM C 20, N 5, N 10.2
00180 NEXT I
00190 CLOSE #1
```

#### Reading a Display File
```business-rules
00200 ! Read comma-separated data file
00210 OPEN #2: "NAME=DATA.CSV", DISPLAY, INPUT
00220 DO
00230   INPUT #2: NAME$, ADDRESS$, PHONE$ EOF 300
00240   PRINT NAME$; " - "; PHONE$
00250 LOOP
00300 CLOSE #2
```

#### Using LINPUT for Text Files
```business-rules
00400 ! Read text file line by line
00410 OPEN #3: "NAME=README.TXT", DISPLAY, INPUT
00420 DO
00430   LINPUT #3: LINE$ EOF 500
00440   PRINT LINE$
00450 LOOP
00500 CLOSE #3
```

### Record Layout Design

#### Planning Record Structure
Before creating an internal file, determine the record layout:
1. Identify all fields needed
2. Determine field types (numeric/string)
3. Estimate field lengths (consider future growth)
4. Calculate total record length
5. Document field positions

#### Example Record Layout (CHECKBOOK.INT)
| Field | Description | Form | Positions |
|-------|-------------|------|-----------|
| 1 | CHECK NUMBER | N 5 | 1-5 |
| 2 | AMOUNT | N 10.2 | 6-15 |
| 3 | DEPOSIT/WITHDRAWAL FLAG | C 1 | 16-16 |
| 4 | DATE WRITTEN (YYMMDD) | N 6 | 17-22 |
| 5 | DATE CLEARED (YYMMDD) | N 6 | 23-28 |
| 6 | PAYEE | C 25 | 29-53 |

### Relative File Access

#### Overview
The relative access method allows direct access to any record in an internal file by specifying its position with a relative record number. This is also known as random access processing.

#### Key Concepts
- **Relative Record Number**: The sequential position of a record within the file
  - First record = 1
  - Second record = 2
  - Tenth record = 10, etc.
- Records can be accessed in any order, not just sequentially
- Significantly faster than sequential when accessing specific records

#### OPEN for Relative Access
```bnf
OPEN #<file-num>: "NAME=<filename>", INTERNAL, 
     {INPUT|OUTPUT|OUTIN}, RELATIVE
```

**Example**:
```business-rules
00500 OPEN #5: "NAME=ACCOUNTS.INT", INTERNAL, INPUT, RELATIVE
```

#### The REC= Clause
Specifies which record to access by its relative position.

```bnf
<rec-clause> ::= REC=<numeric-expression>
```

**Characteristics**:
- Must be the last clause before the colon in I/O statements
- Can use any numeric expression (constants, variables, arithmetic, functions)
- Non-integer values are truncated (decimal portion dropped)
- Available on all I/O statements except REREAD

**Examples**:
```business-rules
00500 READ #1, USING 60, REC=12: A$          ! Read record 12
00510 READ #1, USING 60, REC=N: A$           ! Read record N
00520 READ #1, USING 60, REC=N-10: A$        ! Read record (N-10)
00530 READ #1, USING 60, REC=SQR(144): A$    ! Read record 12
```

#### I/O Statement Behavior with RELATIVE

##### READ with REC=
```bnf
READ #<file-num>, USING <line-ref>, REC=<numeric-expr>: <variable-list>
     [NOREC <line-ref>]
```

**Behavior**:
- Directly reads the specified record
- Without REC=: Reads next sequential record
- NOREC error if record doesn't exist or was deleted

##### WRITE with REC=
```bnf
WRITE #<file-num>, USING <line-ref>, REC=<numeric-expr>: <expression-list>
      [DUPREC <line-ref>]
```

**Behavior**:
- Without REC=: Adds record to end of file
- With REC=: Writes to specific position (only if deleted or new)
- DUPREC error if record already exists at that position

##### REWRITE with REC=
```bnf
REWRITE #<file-num>, USING <line-ref>, REC=<numeric-expr>: <expression-list>
```

**Behavior**:
- Without REC=: Updates last record read (more efficient)
- With REC=: Performs implied READ then updates
- File must be opened OUTIN

##### DELETE with REC=
```bnf
DELETE #<file-num>, REC=<numeric-expr>:
```

**Behavior**:
- Without REC=: Deletes last record read
- With REC=: Performs implied READ then deletes
- Never has USING clause

##### RESTORE with REC=
```bnf
RESTORE #<file-num>, REC=<numeric-expr>: [NOREC <line-ref>]
```

**Behavior**:
- Without REC=: Positions pointer at beginning
- With REC=: Positions pointer at specified record
- Cannot be used with OUTPUT files

#### Access Mode vs. I/O Statement Compatibility

| Statement | INPUT | OUTPUT | OUTIN |
|-----------|-------|--------|-------|
| READ      | YES   | NO     | YES   |
| REREAD    | YES   | NO     | YES   |
| WRITE     | NO    | YES    | YES   |
| REWRITE   | NO    | NO     | YES   |
| DELETE    | NO    | YES    | YES   |
| RESTORE   | YES   | NO*    | YES   |

*RESTORE with OUTPUT,RELATIVE causes error 0711

#### Error Conditions for Relative Access
- **NOREC (0057)**: Record not found or deleted
- **DUPREC (4115)**: Duplicate record on WRITE
- **IOERR (0721)**: I/O conflicts with OPEN mode

#### Mixed Access Patterns
Relative and sequential processing can be combined:
1. Use RESTORE with REC= to position pointer
2. Use READ without REC= for sequential access from that point

**Example**:
```business-rules
01000 OPEN #1: "NAME=DATA.INT", INTERNAL, INPUT, RELATIVE
02000 RESTORE #1, REC=50:          ! Position at record 50
03000 LOOP: READ #1, USING 100:... ! Read sequentially from 50
04000 GOTO LOOP
```

#### File Space Initialization Pattern
To prepare a file for random writes:
```business-rules
00700 OPEN #1: "NAME=FILE.INT,RECL=50,USE", INTERNAL, OUTIN, RELATIVE
00800 FOR I = 1 TO 99
00900   WRITE #1, USING 1000: ""    ! Write empty records
01000 NEXT I
01100 FOR I = 1 TO 99
01200   DELETE #1, REC=I:           ! Delete all records
01300 NEXT I
! Now any record 1-99 can be written randomly
```

#### System Functions for Relative Files
- `LREC(filenum)`: Returns last record number in file
- `REC(filenum)`: Returns current relative record number
- `KSTAT$(fkey-value)`: Returns keyboard status for function key

**Example - Using LREC to Display File Size**:
```business-rules
00080 PRINT "Last record:", LREC(1)
00090 READ #1, REC=10: DATA$
00100 PRINT "Current position:", REC(1)   ! Prints 10

! Display total records in file
00655 PRINT FIELDS "21,30,N 4": LREC(1)
```

**Example - Using KSTAT$ to Display Menu Options**:
```business-rules
00001 DIM WORDS$(5)*40, FORM$(5)*25
00003 DATA "5,5,C 30","6,5,C 30","7,5,C 30","8,5,C 30","9,5,C 30"
00004 READ MAT FORM$
00005 DATA "1. Edit transactions","2. Print receipt copies","3. Print invoices","4. Print balances","5. Return to main menu"
00006 READ MAT WORDS$
00007 PRINT FIELDS MAT FORM$: MAT WORDS$
00008 PRINT FIELDS "12,5,C 40": "Enter menu number"
00009 PRINT KSTAT$(1)  ! Display status of F1 key
```
| 7 | ACCOUNT NUMBER | N 8 | 54-62 |

**Total Record Length**: 62 bytes

#### Date Storage Best Practices
- Store dates as YYMMDD (or YYYYMMDD) for proper sorting
- Convert user input from MMDDYY format if needed
- Use DATE$ system variable (returns YYYYMMDD format)

### File Processing Examples

#### Creating and Writing to File
```business-rules
00500 OPEN #5: "NAME=CHECKBOOK.INT,RECL=63,NEW",INTERNAL,OUTPUT,SEQUENTIAL
00600 WRITE #5,USING 700: 1044,106.45,"W",871104,871112,"SAXO MUSIC",10225340
00700 FORM N 5,N 10.2,C 1,N 6,N 6,C 25,N 8
```

#### Reading from File
```business-rules
00120 OPEN #7: "NAME=CHECKBOOK.INT",INTERNAL,INPUT,SEQUENTIAL
00130 DO WHILE 1
00135   READ #7, USING 140: AMOUNT, NAME$ EOF 200
00140   FORM X 5, N 10.2, X 13, C 25
00150   PRINT NAME$, AMOUNT
00190 LOOP
00200 CLOSE #7:
```

#### Updating Records
```business-rules
03900 OPEN #5: "NAME=CHECKBOOK.INT",INTERNAL,OUTIN,SEQUENTIAL
04100 READ #5,USING FORM5: DATE_CLEARED EOF DONE
04300 REREAD #5,USING FORM5B: CHECKNUM,AMOUNT,DW$,CHECKDATE,PAYEE$
05000 REWRITE #5,USING FORM5: BANKDATE
```

#### Selective Record Processing with REREAD
```business-rules
! Read minimal data to check record type
02000 MAINLOOP: READ #5,USING FORM5: DW$ EOF DONE
02100 IF DW$<>OPT$ THEN GOTO MAINLOOP  ! Skip non-matching records
! Now read full record data
02200 REREAD #5,USING FORM5B: AMOUNT,DWDATE,PAYEE$
! Process the selected record...
```

#### Deleting Records
```business-rules
! Delete last record read
04100 READ #5,USING FORM5: CHECKNUM,AMOUNT EOF DONE
04200 IF AMOUNT=0 THEN DELETE #5:

! Delete by record number (relative access)
04300 DELETE #5, REC=100

! Delete by key (keyed access)  
04400 DELETE #5, KEY="12345"
```

### File Processing Best Practices

#### Error Handling
```business-rules
! Always include EOF handling for reads
00100 READ #5,USING 110: DATA$ EOF 900
00110 FORM C 30
00900 PRINT "End of file reached"

! Handle duplicate file errors
00200 OPEN #5: "NAME=DATA.INT,RECL=100,NEW",INTERNAL,OUTPUT,SEQUENTIAL ERROR 4150
04150 IF ERR=4150 THEN 
04160   PRINT "File already exists!"
04170   OPEN #5: "NAME=DATA.INT,RECL=100,REPLACE",INTERNAL,OUTPUT,SEQUENTIAL
04180 END IF
```

#### Performance Optimization
1. **Use REREAD for selective processing**: Read only needed fields first
2. **Batch operations**: Process multiple records before screen updates
3. **Choose appropriate access method**:
   - SEQUENTIAL: When processing all/most records in order
   - RELATIVE: When accessing specific record numbers
   - KEYED: When searching by key values

#### Data Integrity
1. **Always validate field lengths**: Prevent truncation with SOFLOW error handling
2. **Use OUTIN carefully**: Only when updates are needed
3. **Make programs "forgiving"**: Allow error correction
4. **Backup before major updates**: Use EXECUTE "COPY file.int file.bak"

### File Options
- `REC=<n>` - Record number (relative access)
- `KEY=<string>` - Key value (keyed access)
- `SEARCH=<string>` - Search key pattern
- `RESERVE` - Lock record (multi-user)
- `RELEASE` - Unlock record (multi-user)

### Keyed File Processing (Index Facility)

#### Overview
The BR! Index Facility (also called key file processing or ISAM - Indexed Sequential Access Method) is a powerful collection of features for building key files based on particular fields in a master file. This allows selective access to records by knowing only the key field value, similar to how a telephone directory contains names and addresses.

#### Why Use Indexing?
BR! indexing helps accomplish these tasks quickly and efficiently:
1. On-line maintenance
2. Sequential reports by key field
3. On-line queries  
4. File organization

#### Core Terminology
- **Master File**: The data file containing unordered records requiring fast access
- **Index/Key File**: Contains key fields and relative record numbers for accessing master records
- **Key Field**: The field(s) identifying each record (max 128 bytes total, up to 6 sections)
- **Relative Record Number**: Numeric position of a record in the master file (1-based)
- **Split Key**: Key field composed of up to 6 non-contiguous sections
- **Primary Area**: Sorted portion of index file (all records after INDEX/REORG)
- **Overflow Area**: Unsorted portion containing recently added/modified entries
- **Duplicate Keys**: Multiple records with identical key values (differentiated by record number)
- **BADKEYS**: Keys with invalid Y2K data in baseyear-dependent fields

#### Index File Structure
An index file record consists of:
- The master record's key field value
- The relative record number in binary (B4) format

Example of reading an index file directly:
```business-rules
00080 READ #1, USING "FORM C 10,B 4": KEY$, RECNBR
```

#### How Index Access Works
When accessing a record by key:
1. BR! searches the index file for the key value (binary search in primary area)
2. Retrieves the corresponding relative record number
3. Goes directly to that position in the master file
4. No sequential searching of the master file is required

#### Index Types
- **ISAM**: Traditional indexed sequential access (requires periodic maintenance)
- **Btree**: Default in BR!, faster and self-maintaining
- **Btree2**: Enhanced version with diagnostic capabilities (25-35% faster in shared file processing)

Configuration options:
- `OPTION 5`: Set to 4 for ISAM, 7 for Btree (default)
- `OPTION 22`: Enable Btree2 facility (version 3.90+)
- `OPTION 24`: Suppress X attribute during INPUT SELECT operations (3.90+)

##### BTREE_VERIFY Statement
Audits Btree2 index structure after each operation for diagnostic purposes.

```bnf
BTREE_VERIFY <master-filename> [OFF]
```

This diagnostic mode helps pinpoint failing update operations at the cost of performance. The system automatically tracks which files use Btree2 indexes and prevents mixing Btree types within related files.

**Important**: BR! does not permit mixing Btree index types within related files (multiple opens of the same master file with different indexes).

#### INDEX Command
Creates or rebuilds a key file from a master file. The Index command can be executed from READY mode, a procedure file, or with the EXECUTE statement. Creation can be interrupted with Ctrl-A and resumed with GO.

**BTREE2 INDEX Keywords** (3.90+):
- `VERIFY`: Audits BTREE2 index structure instead of rebuilding
- `REORG`: For BTREE2 files, means "audit and if needed rebuild"
- `REPLACE`: Creates new index (automatically uses BTREE2 format when OPTION 22 is set)

```bnf
INDEX <master-file> <key-file> <key-positions> <key-lengths> 
      [<work-path>] [REPLACE] [REORG] [VERIFY]
      [DUPKEYS] [LISTDUPKEYS] [BADKEYS] [LISTBADKEYS] [><output-file>] [NATIVE]
```

##### INDEX Parameters
- `<master-file>`: Path to the master file
- `<key-file>`: Path to the key file to create
- `<key-positions>`: Starting position(s) of key field(s) in record (up to 6 sections separated by /)
  - Append `Y` to apply BASEYEAR to first 2 digits (e.g., `23Y` for position 23 with Y2K year)
  - For numeric fields (BH/PD), append `B` or `P` with `Y` (e.g., `2BY` for 2-byte binary with BASEYEAR)
- `<key-lengths>`: Length(s) of key field(s) (max 128 total, up to 6 sections separated by /)
  - Append `Y` to apply BASEYEAR processing
- `<work-path>`: Optional path for temporary work files (defaults to current directory)
- `REPLACE`: Delete and replace existing key file
- `REORG`: Reorganize existing index (sorts overflow area; Btree2: audit and rebuild if needed)
- `VERIFY`: Audit Btree2 index without rebuilding (replaces REPLACE/REORG for Btree2)
- `DUPKEYS`: Allow duplicate keys without warning message
- `LISTDUPKEYS`: Display all duplicate keys found
- `BADKEYS`: Process keys with invalid Y2K data
- `LISTBADKEYS`: List keys with invalid Y2K data (listed before dupkeys)
- `><output-file>`: Redirect duplicate/bad keys list to file or printer
- `NATIVE`: Override alternate collating sequence

##### Y2K BASEYEAR Processing in INDEX
When Y is appended to position or length specifications, BASEYEAR processing is applied:

**For Character Fields:**
- First two characters are treated as BASEYEAR-dependent year

**For Numeric Fields (BH or PD with B or P specification):**
Field format assumed based on length:
- `PD 1`: Not significant
- `PD 2` or `BH 1`: YY format
- `PD 3` or `BH 2`: YYMM format
- `PD 4`, `BH 3` or `BH 4`: YYMMDD format

**Special Rules:**
- Year zero interpreted as zero (not 2000) if month and day are zero
- Blank year given BASEYEAR year value (as of 3.83k)

##### Split Key Specification
Up to 6 non-contiguous sections can form a composite key:
```business-rules
! Index on last name (1-20) and zip code (50-54)
INDEX CUSTOMER.DAT CUSTZIP.KEY 1/50 20/5 REPLACE

! Y2K example: Index with BASEYEAR on date field at position 23
INDEX masterfile keyfile 10/23Y/55 8/6/30 REPLACE DUPKEYS

! Y2K example: Binary date field with BASEYEAR
INDEX masterfile keyfile 10/31 2BY/10 REPLACE
```

##### Baseyear Dependent Indexes
Append 'Y' to position or length for baseyear-dependent date fields:
```business-rules
! Position 23 has 2-digit year, position 55 has regular field
INDEX masterfile keyfile 10/23Y/55 8/6/30 REPLACE DUPKEYS

! Binary date field with baseyear
INDEX masterfile keyfile 10/31 2BY/10 REPLACE
```

Baseyear format assumptions:
- PD 2 or BH 1: YY
- PD 3 or BH 2: YYMM  
- PD 4, BH 3-4, DT 3-4, DL 4, DH 4: YYMMDD

##### Examples
```business-rules
! Create index on customer number (positions 1-5)
INDEX CUSTOMER.INT CUSTOMER.KEY 1 5 REPLACE

! Index with duplicate key handling
INDEX ACCT.INT ACCT.KEY 10 5 REPLACE LISTDUPKEYS >PRN:

! Split key: name (1-20) and date (30-35)
INDEX MASTER.DAT NAME_DATE.KEY 1/30 20/6 REPLACE

! Reorganize for performance (sorts overflow area)
INDEX CHECKBOOK.INT CHECKBOOK.KEY 1 5 REORG

! Verify Btree2 index integrity
INDEX CUSTOMER.INT CUSTOMER.KEY 1 5 VERIFY

! Baseyear dependent date field
INDEX TRANS.DAT TRANS.KEY 1/10Y 5/6 REPLACE

! List bad keys and duplicate keys
INDEX MASTER.DAT MASTER.KEY 1 10 REPLACE LISTBADKEYS LISTDUPKEYS >ERRORS.TXT
```

#### Opening Files for Keyed Access

##### Opening Existing Keyed File
```bnf
OPEN #<file-num>: "NAME=<master-file>,KFNAME=<key-file>", 
     INTERNAL, {INPUT|OUTPUT|OUTIN}, KEYED
```

Example:
```business-rules
00500 OPEN #5: "NAME=ACCT.INT,KFNAME=ACCT.KEY", INTERNAL, INPUT, KEYED
```

##### Creating New Keyed File
```bnf
OPEN #<file-num>: "NAME=<master-file>,RECL=<length>,
                   KFNAME=<key-file>,KPS=<start>,KLN=<length>", 
     INTERNAL, OUTIN, KEYED
```

Example:
```business-rules
00100 OPEN #1: "NAME=ACCT.INT,RECL=31,KFNAME=ACCT.KEY,KPS=1,KLN=4", 
              INTERNAL, OUTIN, KEYED
```

**Important**: When creating new files:
- Include RECL, KPS, and KLN for new files
- Omit these parameters for existing files
- Both master and key files must be either new or existing (not mixed)

#### KEY Clause Variations

##### KEY Clause Forms
```bnf
KEY=<string-expr>      ! Exact match required
KEY>=<string-expr>     ! Match or next higher key
SEARCH=<string-expr>   ! Partial key match allowed
SEARCH>=<string-expr>  ! Partial match or next higher
```

##### KEY vs SEARCH
- **KEY**: String length must equal key field length (KLN)
- **SEARCH**: String can be shorter than key field length
- **=**: Requires exact match (NOKEY error if not found)
- **>=**: Uses next record if exact match not found

##### Examples
```business-rules
! Exact match on full key
00400 RESTORE #1, KEY="860101": NOKEY 920

! Next key if no exact match
00410 RESTORE #1, KEY>="860101": NOKEY 920

! Partial key search (first 2 chars)
00420 RESTORE #1, SEARCH="86": NOKEY 920

! Partial with next if no match
00430 RESTORE #1, SEARCH>="86": NOKEY 920
```

#### Keyed I/O Statements

##### READ with KEY
```bnf
READ #<file-num> [,USING <line-ref>], KEY=<string-expr>: <variable-list>
     [NOKEY <line-ref>] [ERROR <line-ref>]
```

Example:
```business-rules
00125 READ #3, USING F3, KEY="NY": TOTAL, COUNT
00580 READ #2, USING FORM1, KEY=LPAD$(STR$(CHECKNUM),5): 
           AMT, DW$, CHECKDATE, CLRDATE, PAYEE$, ACCT NOKEY ERRMSG1
```

##### RESTORE with KEY
Positions file pointer at specified key value.

```bnf
RESTORE #<file-num>, {KEY|KEY>=|SEARCH|SEARCH>=}=<string-expr>:
        [NOKEY <line-ref>]
```

Examples:
```business-rules
00250 RESTORE #1, KEY="121212":
00260 RESTORE #1, KEY=NAME$:
00270 RESTORE #1, KEY=X$(4):
00280 RESTORE #1, KEY="12"&NAME$(3:6):
00300 RESTORE #1, KEY=LPAD$(STR$(ACCT),6):
00310 RESTORE #1, KEY=CNVRT$("PIC(ZZZZZ#)",ACCT):
00320 RESTORE #1, KEY=CNVRT$("PD 6.3",ACCT):
```

##### REWRITE with KEY
```bnf
REWRITE #<file-num> [,USING <line-ref>] [,KEY=<string-expr>]: <expression-list>
```

**Important**: 
- Without KEY= clause: Rewrites last record read (faster)
- With KEY= clause: Searches index then rewrites (slower)
- Cannot change the key field value (error 0059)

##### DELETE with KEY
```bnf
DELETE #<file-num> [,KEY=<string-expr>]: [<error-condition>]
```

**Note**: Only KEY= is allowed (not KEY>=, SEARCH, or SEARCH>=)

#### Read Sequential by Key
Reading a keyed file without KEY= clause reads records in key field order (sorted).

```business-rules
! Open for keyed access
01100 OPEN #1: "NAME=CHEKBOOK.INT,KFNAME=CHEKBOOK.KEY", INTERNAL, INPUT, KEYED

! Read sequentially in key order
01700 MAINLOOP: !
01800   READ #1, USING CHECKFORM: CHECK, AMOUNT, DW$, DATE, PAYEE$, ACCT EOF ALLDONE
01900   IF CHECK=0 OR DW$="D" THEN GOTO MAINLOOP
02000   ! Process record...
02500 GOTO MAINLOOP
```

This technique produces output sorted by the key field without explicitly sorting.

#### Keyed File Functions

##### KPS Function
Returns key starting position for an open keyed file.

```bnf
KPS(<file-num>)
```

##### KLN Function  
Returns key field length for an open keyed file.

```bnf
KLN(<file-num>)
```

##### KREC Function
Returns the master file record number of the last record processed in a keyed file.

```bnf
KREC(<file-num>)
```

Examples:
```business-rules
00050 PRINT KPS(63)   ! Prints key starting position
00060 PRINT KLN(63)   ! Prints key field length  
00070 PRINT KREC(63)  ! Prints record number of last record accessed
```

All functions return -1 if file is not open or not opened for keyed access.

#### Working with Duplicate Keys

When duplicate keys exist:
- All KEY= forms return the first matching record (lowest record number)
- Programmer must handle navigation to other duplicates
- Consider using unique composite keys when possible

##### Handling Duplicates
```business-rules
! Read first matching record
00100 READ #1, KEY="JONES": NAME$, ADDR$, AMOUNT
! Continue reading sequentially for other matches
00110 DO
00120   READ #1: NAME2$, ADDR2$, AMOUNT2$ EOF DONE
00130   IF NAME2$<>"JONES" THEN EXIT DO
00140   ! Process duplicate record
00150 LOOP
```

#### Best Practices for Keyed Files

##### Performance Optimization
1. **Rebuild indexes periodically** after many additions
2. **Use REWRITE/DELETE without KEY=** when processing last record read
3. **Choose appropriate key fields** that minimize duplicates
4. **Keep master and key files** in same directory with consistent naming

##### Key Field Selection
- Choose unique identifiers when possible (customer ID, check number)
- Consider composite keys for uniqueness
- Maximum key length: 128 characters
- Keys can be adjacent or split fields
- Can combine multiple fields as key

##### Maintenance
```business-rules
! Rebuild index after batch updates
99000 EXECUTE "INDEX ACCT.INT ACCT.KEY 1 4 REPLACE"

! Audit Btree2 index
99100 EXECUTE "INDEX CUSTOMER.INT CUSTOMER.KEY 1 5 VERIFY"
```

##### Error Handling
- **NOKEY (4272)**: Key not found
- **0718**: Key string length mismatch
- **0059**: Attempt to change key field value
- **7603**: Duplicate keys found (warning)
- **7611**: Key file already exists (without REPLACE)
- **0608**: Conflicting secondary OPEN statement
- **4148**: Incompatible share parameters in multiple OPEN statements

#### Multiple Index Files

A master file can have multiple index files, each with a different key field, allowing access by different criteria (customer number, last name, zip code, date, etc.).

##### Setting Up Multiple Index Files

Rules for multiple index files:
1. **Same master file name** for all OPEN statements
2. **Different file numbers** (consecutive recommended but not required)
3. **Consistent share parameters** (omit after first OPEN to inherit)
4. **First OPEN must be OUTIN/OUTPUT** if any subsequent OPEN uses OUTIN/OUTPUT
5. **New index files** require all OPENs to have NEW/USE/REPLACE, RECL=, KPS=, and KLN=

##### Multiple Index File Examples

```business-rules
! Open four index files for same master file
02100 OPEN #1: "NAME=FILE,KFNAME=KEY1,SHR", INTERNAL, OUTIN, KEYED
02200 OPEN #2: "NAME=FILE,KFNAME=KEY2", INTERNAL, OUTIN, KEYED
02300 OPEN #3: "NAME=FILE,KFNAME=KEY3", INTERNAL, OUTIN, KEYED
02400 OPEN #4: "NAME=FILE,KFNAME=KEY4", INTERNAL, OUTIN, KEYED

! Mixed access modes (KEY3 and KEY4 won't be updated)
01100 OPEN #1: "NAME=FILE,KFNAME=KEY1,SHR", INTERNAL, OUTIN, KEYED
01200 OPEN #2: "NAME=FILE,KFNAME=KEY2", INTERNAL, OUTIN, KEYED
01300 OPEN #3: "NAME=FILE,KFNAME=KEY3", INTERNAL, INPUT, KEYED
01400 OPEN #4: "NAME=FILE,KFNAME=KEY4", INTERNAL, INPUT, KEYED

! Creating new master file with multiple index files
05100 OPEN #1: "NAME=MASTER,NEW,RECL=31,KFNAME=KEY1,KPS=1,KLN=4,SHR", 
              INTERNAL, OUTIN, KEYED
05200 OPEN #2: "NAME=MASTER,NEW,RECL=31,KFNAME=KEY2,KPS=9,KLN=5,SHR", 
              INTERNAL, OUTIN, KEYED
```

##### Automatic Index Maintenance

When multiple index files are opened:
- **WRITE** to any file number updates ALL index files opened OUTIN/OUTPUT
- **DELETE** from any file number updates ALL index files
- **REWRITE** updates ALL indexes if key field values change
- BR! compares changed records to memory-resident originals to optimize updates

##### Using Multiple Index Files

```business-rules
! Read by customer number from KEY1
00100 READ #1, KEY="12345": CUSTNO$, NAME$, BALANCE

! Read same master by name from KEY2  
00200 READ #2, KEY="SMITH": CUSTNO$, NAME$, BALANCE

! Sequential read maintains separate file pointers
00300 READ #1: REC1$  ! Reads next by KEY1 order
00400 READ #2: REC2$  ! Reads next by KEY2 order
00500 READ #1: REC3$  ! Continues from KEY1 position
```

##### Split Keys with Multiple Indexes

Combine split keys with multiple indexes for powerful flexibility:

```business-rules
! Index 1: Customer number (simple key)
INDEX CUST.DAT CUSTNO.KEY 1 5 REPLACE

! Index 2: Last name + first name (split key)
INDEX CUST.DAT NAME.KEY 10/30 20/15 REPLACE

! Index 3: State + zip + last name (3-part split key)
INDEX CUST.DAT LOC.KEY 50/55/10 2/5/20 REPLACE
```

Maximum limits:
- Up to 6 sections per split key
- Maximum 128 bytes total per key
- Number of index files limited only by OS open file limit

##### Performance Considerations for Multiple Indexes

- Each unique file counts once against OS open file limit
- Opening same file under multiple file numbers counts as one file
- Window files don't count against OS limit
- Consider using INPUT mode for indexes not being updated
- Rebuild non-updated indexes periodically with INDEX command

### SQL Database Operations

BR! supports two methods for SQL database connectivity:

#### Native SQL Support (4.30+)

##### Database Configuration
```bnf
CONFIG DATABASE <db-ref> DSN=<dsn-ref> [, USER=<user>] [, PASSWORD=<password>]
CONFIG DATABASE <db-ref> CONNECTSTRING="<connection-string>"
CONFIG DATABASE ODBC-MANAGER
```

##### Opening SQL Connections
```bnf
OPEN #<file-num>: "DATABASE=<db-ref>", SQL "<sql-statement>", OUTIN
OPEN #<file-num>: "DATABASE=<db-ref>, NAME=<filename>", SQL, OUTIN
```

##### SQL Operations
- Use WRITE with IO list to populate parameterized queries (? placeholders)
- READ operations process result sets like BR files
- Sequential access is fastest for result sets

##### SQL Date Functions
- `SQL_DATE$(BR-date, "format")` - Format BR date for SQL storage
- `BR_DATE$(SQL-date, "format")` - Convert SQL date to BR format

##### Database Interrogation
Use ENV$ to query database structure:
```br
ENV$("STATUS.DATABASE.LIST", MAT databases$)
ENV$("STATUS.DATABASE.<db>.TABLES.LIST", MAT tables$)
ENV$("STATUS.DATABASE.<db>.TABLES.<table>.COLUMNS.LIST", MAT columns$)
```

#### SQL Module (BR_VB Module for 4.03+)

The SQL Module is a BR_VB module that adds comprehensive SQL capabilities to BR 4.03 and higher using familiar OPEN/PRINT FIELDS/RINPUT FIELDS syntax.

##### SQL Mod Connection Syntax
```bnf
OPEN #<file-num>: "Project=SQL, Form=<connection-params>", display, outin
<connection-params> ::= Database:<db-name>;Server:<server>;UserID:<user>;Password:<pwd>[;Driver:<driver>][;SystemDB:<path>]
```

**Note**: Use `!` instead of `:` when specifying hard-coded paths (e.g., `C!\DATA\DATABASE.FDB`)

##### Supported Databases
- **Microsoft SQL Server** (default): `Driver:MsSqlSrv`
- **Firebird**: `Driver:FireBird`
- **MySQL**: `Driver:MySQL`
- **Microsoft Access**: `Driver:Access`

##### SQL Mod Operations via PRINT/RINPUT FIELDS

###### Field Specifications
Required special fields:
- **Command**: Operation to perform (always required)
- **Table**: Target table name (required except for QUERY/SQL)
- **Criteria**: WHERE clause (required for DELETE, SELECT, UPDATE)
- **Query**: Raw SQL command (required for QUERY/SQL commands)
- **GetError**: Retrieve last SQL error description (INPUT only)

###### Output Commands (PRINT FIELDS)

**INSERT** - Add new row to table:
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="INSERT"
02920 SPEC$(2)="Table"    : DATA$(2)="Names"
02930 SPEC$(3)="FirstName": DATA$(3)="'Thomas'"
02940 SPEC$(4)="LastName" : DATA$(4)="'Hamilton'"
03000 PRINT #10, FIELDS MAT SPEC$ : MAT DATA$
```

**UPDATE** - Modify existing rows:
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="UPDATE"
02920 SPEC$(2)="Table"    : DATA$(2)="Names"
02930 SPEC$(3)="Criteria" : DATA$(3)="FirstName='Tomas'"
02940 SPEC$(4)="FirstName": DATA$(4)="'Thomas'"
03000 PRINT #10, FIELDS MAT SPEC$ : MAT DATA$
```

**DEL/DELETE** - Remove rows:
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="DELETE"
02920 SPEC$(2)="Table"    : DATA$(2)="Names"
02930 SPEC$(3)="Criteria" : DATA$(3)="FirstName='Thomas'"
03000 PRINT #10, FIELDS MAT SPEC$ : MAT DATA$
```

**SQL** - Execute raw SQL command (no result set):
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="SQL"
02920 SPEC$(2)="Query"    : DATA$(2)="INSERT INTO Names (FirstName, LastName) SELECT 'Jimmi','Hendrix'"
03000 PRINT #10, FIELDS MAT SPEC$ : MAT DATA$
```

###### Input Commands (RINPUT FIELDS)

**SELECT/SELECT DISTINCT** - Read data from table:
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="SELECT"
02920 SPEC$(2)="Table"    : DATA$(2)="Names"
02930 SPEC$(3)="Criteria" : DATA$(3)="FirstName='Thomas'"
02940 SPEC$(4)="FirstName"
02950 SPEC$(5)="LastName"
03000 RINPUT #10, FIELDS MAT SPEC$ : MAT DATA$
```

**RecordSet Navigation Commands**:
- **MOVEFIRST/FIRST** - Move to first record
- **MOVELAST/LAST** - Move to last record
- **MOVENEXT/NEXT** - Move to next record
- **MOVEPREV/PREVIOUS** - Move to previous record

```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="MOVENEXT"
02940 SPEC$(2)="FirstName"
02950 SPEC$(3)="LastName"
03000 RINPUT #10, FIELDS MAT SPEC$ : MAT DATA$
```

**QUERY** - Execute SQL returning result set:
```business-rules
02910 SPEC$(1)="Command"  : DATA$(1)="QUERY"
02920 SPEC$(2)="Query"    : DATA$(2)="EXEC GetUnreadMessages '"&UserName$&"'"
02930 SPEC$(3)="Message"
03000 RINPUT #10, FIELDS MAT SPEC$ : MAT DATA$
```

##### SQL Mod Error Handling

**BR-SQL Interface Errors**:
- **343** - SQL error occurred (use GETERROR)
- **344** - Not enough fields sent
- **345** - Fields sent with DELETE or QUERY
- **346** - Table sent with QUERY
- **347** - Invalid command
- **348** - RecordSet not opened (SELECT required before MOVE)
- **349** - RecordSet empty
- **350** - RecordSet at beginning (BOF)
- **351** - RecordSet at end (EOF)
- **354** - Invalid connection reference
- **355** - File number already open
- **357** - Server not found
- **358** - Login failed
- **359** - Database not found
- **362** - Field doesn't exist in table
- **364** - QUERY missing for SQL command
- **365** - Table not specified
- **366** - Command not specified
- **367** - Criteria sent when not allowed
- **368** - Criteria missing when required

**Getting SQL Error Details**:
```business-rules
08000 INPUT #10, FIELDS "GETERROR" : error$
```

**Error Handling Example**:
```business-rules
02000 ON ERROR GOTO errcheck
10000 errcheck: ! ***** Catch errors
10010    if err=343 then !:
            input #10, fields "GETERROR" : Description$ !:
            print "SQL ERROR: "&Description$&" on line: "&str$(line) !:
         else !:
            print "BR-SQL Error: "&str$(err)&" on line: "&str$(line)
10090 continue
```

##### Important SQL Mod Notes
- All string values must be enclosed in single quotes (')
- Use included sqllib.wb library for helper functions like FNADDQUOTES()
- For BR 4.03k, use FNTESTOPEN() function after OPEN to verify connection
- Stored procedures can be called using QUERY/SQL commands
- Installation requires registering sql.exe and dcomkey.exe DLLs

## SORT Facility

### Overview
The BR! SORT facility provides powerful record sorting capabilities for internal files, allowing you to:
- Produce sorted output files from randomly ordered records
- Rearrange records based on multiple sort fields
- Filter records using selection criteria
- Create address-out files (containing only record numbers in sorted order)
- Generate record-out files (containing complete sorted records)

### SORT Command

#### Syntax
```bnf
SORT [<control-file>]
```

#### Execution Methods
1. **From READY mode**: Execute with control file name
2. **From procedure file**: Execute with control file or inline specifications
3. **With EXECUTE statement**: Include control file name

#### Examples
```business-rules
! From READY mode
SORT ALPHABET.FIL

! From procedure file
PROC SAMPLESORT

! Using EXECUTE
EXECUTE "SORT CUSTOMER.SRT"
```

### Sort Control Files

Sort control files contain sort specifications and can be created as:
- **Procedure files** (PROC): Easier to view and edit
- **Internal files**: Created programmatically

#### Example Procedure File SORT
```business-rules
Sort
! Creating a sort file for Texas and Louisiana customers
FILE orders.int,,,samplesort2,,,,,R,,REPLACE,SHR
ALTS RO 1,"VERYQUICKFOX"
RECORD I,106,2,C,"TX","TX",OR
RECORD I,106,2,C,"LA","LA",OR
RECORD I,106,2,C,"tx","tx",OR
RECORD I,106,2,C,"la","la",OR
SUM
MASK 31,30,C,A,1,30,C,A
```

### Sort Specifications

Six types of specifications control the sorting procedure:

| Specification | Required | Purpose | Position |
|--------------|----------|---------|----------|
| ! (Comment) | No | Display message to operator | Anywhere before MASK |
| FILE | Yes | Define input/output files | First required spec |
| ALTS | No | Reorder collating sequence | After FILE |
| RECORD | No | Include/exclude records | After ALTS |
| SUM | No | Display record counts | After RECORD |
| MASK | Yes | Define sort fields | Must be last |

### FILE Specification (Required)

Identifies input/output files, workspace, and sort parameters.

#### Syntax
```bnf
FILE <input-file>,<input-path>,<input-drive>,
     <output-file>,<output-path>,<output-drive>,
     <work-path>,<work-drive>,
     <file-spec>,<collating-sequence>,
     [REPLACE],[<share-spec>]
```

#### Parameters
- **Input file**: Source file to be sorted
- **Output file**: Destination for sorted records
- **Work path/drive**: Temporary workspace location
- **File spec**:
  - `R`: Record-out sort (complete records)
  - `A`: Address-out sort in PD3 format (limit: 99,999 records)
  - `B`: Address-out sort in B4 format (limit: 2.147 billion records)
- **Collating sequence**:
  - `N`: Native sequence
  - `A`: Alternate sequence
- **REPLACE**: Replace existing output file
- **Share spec**: NOSHR, SHRI, SHR, or SHRU

#### Examples
```business-rules
! Basic record-out sort with native collating
FILE MASTER,VOL,C,SORTOUT,VOL,C,WORK,D,R,N

! Address-out sort with replacement
FILE SORT.IN,,,SORT[WSID].OUT,,,,,A,A,REPLACE,SHR
```

### ALTS Specification (Optional)

Reorders collating sequence or sets characters to equal values.

#### Syntax
```bnf
ALTS {RO,<starting-value>|EQ,<value>},"<character-sequence>"
```

#### Parameters
- **RO**: Reorder characters starting from specified value
- **EQ**: Set all specified characters to same value
- **Starting value/Value**: 0-255
- **Character sequence**: Up to 28 characters in quotes

#### Examples
```business-rules
! Make uppercase match lowercase
ALTS RO,97,"ABCDEFGHIJKLMNOPQRSTUVWXYZ"

! Sort vowels before consonants
ALTS RO,97,"aeioubcdfghjklmnpqrstvwxyz"

! Set digits 1-9 to same collating value
ALTS EQ,48,"123456789"
```

### RECORD Specification (Optional)

Filters records for inclusion or exclusion from sort.

#### Syntax
```bnf
RECORD {I|O},<start-pos>,<field-length>,<form-spec>,
       {<lower-limit>,<upper-limit>|<lower-pos>,<upper-pos>}
       [,{AND|OR}]
```

#### Parameters
- **I/O**: Include (within limits) or Omit (outside limits)
- **Start pos**: Starting position of select field
- **Field length**: Length of select field
- **Form spec**: Field format (C, N, PD, etc.)
- **Limits**: Either constants in quotes or field positions
- **AND/OR**: Combine multiple RECORD specifications

#### Examples
```business-rules
! Include records with field 1-4 between 100-999
RECORD I,1,4,PD,"100","999"

! Complex selection with OR/AND logic
RECORD I,40,5,C,"55024","55036",OR
RECORD I,49,15,C,"DAKOTA","DAKOTA",AND
RECORD I,20,15,C,"OUST RD","OUST RD",AND
RECORD I,15,5,C,"47315","47722",OR
RECORD I,49,15,C,"DAKOTA","DAKOTA",AND
RECORD I,20,15,C,"RIDGE RD","RIDGE RD"

! Use comparison fields from record
RECORD O,28,6,N,52,59
```

#### Record Selection Logic
- **AND**: Record must meet all connected specifications
- **OR**: Starts new requirement set; record needs only one set
- Maximum 20 RECORD specifications per sort group

### SUM Specification (Optional)

Displays summary after sort completion.

#### Syntax
```bnf
SUM [<title1>],[<title2>],[<title3>],[<title4>],[<title5>]
```

#### Displays
1. Total records read from input
2. Records selected for sorting
3. Records written to output

#### Example
```business-rules
! Custom titles for summary
SUM Sort of HIST.FIL completed,,, ,Press <CR> to continue
```

### MASK Specification (Required)

Defines sort fields and sort order. Must be the last specification.

#### Syntax
```bnf
MASK <start-pos>,<field-length>,<form-spec>,{A|D}
     [,<start-pos>,<field-length>,<form-spec>,{A|D}]...
```

#### Parameters
- **Start position**: Field starting position in record
- **Field length**: Field size in bytes
- **Form spec**: Field format:
  - `B`: Binary
  - `BL`: Binary low
  - `BH`: Binary high
  - `C`: Character
  - `D`: Double-precision (8 bytes)
  - `L`: Long (9 bytes)
  - `N`: Numeric
  - `PD`: Packed decimal
  - `S`: Single-precision (4 bytes)
  - `ZD`: Zoned decimal
- **A/D**: Ascending or Descending order

#### Examples
```business-rules
! Sort by two fields
MASK 1,4,PD,A,10,3,C,A

! Complex multi-field sort
MASK 31,30,C,A,1,30,C,A,54,8,N,D
```

#### Limitations
- Maximum 10 sort fields
- Maximum total sort key length: 32,767 bytes

### Y2K Date Sorting

Append `Y` to A/D indicator for BASEYEAR processing.

```business-rules
! Sort by date field with Y2K handling
MASK 17,6,N,AY    ! YYMMDD format, ascending with BASEYEAR
```

#### Date Format Recognition
- Display format: First 2 characters are year
- Packed format: YYMMDD, YYMM, or YY based on length
- Leading blanks replaced with zeros for numeric fields
- Year zero interpreted as zero if month/day are zero

### Space Requirements

#### Workspace Calculation
```
Number of records selected × 2 × (Sort key length + 4)
[Round up to multiple of 1024]
```

#### Address-Out File Size (PD3 Format)
```
Number of records selected × 4 + 15
[Round up to multiple of 512]
```

#### Address-Out File Size (B4 Format)
```
Number of records selected × 5 + 16
[Round up to multiple of 512]
```

#### Record-Out File Size
```
Number of records selected × (Record length + 1)
[Round up to multiple of 512]
```

### Creating Sort Control Files Programmatically

```business-rules
00080 ! Get customer range from user
00090 PRINT FIELDS "20,1,c": "Enter beginning and ending customer"
00100 INPUT FIELDS "21,5,c 5,u;21,15,c 5,u": BC$,EC$
00110 OPEN #1:"name=CUST[WSID].SRT,recl=128,replace",INTERNAL,OUTPUT
00120 FORM C 128
00130 WRITE #1,USING 120: "! Sorting Customer File . . ."
00140 WRITE #1,USING 120: "FILE CUSTOMER.DAT,,,TEMP[WSID],,,,,A,N,SHR,REPLACE"
00150 WRITE #1,USING 120: "RECORD I,1,5,C,'" & BC$ & "','" &EC$ & "'"
00160 WRITE #1,USING 120: "MASK 1,5,C,A"
00170 CLOSE #1:
00180 !
00190 EXECUTE "SORT CUST[WSID].SRT"
```

### Performance Optimization

#### Factors Affecting Speed
1. **Record count**: Fewer records = faster sort
2. **Sort type**: Address-out faster than record-out; B faster than A
3. **RECORD filters**: Omitting records improves speed
4. **Sort field length**: Shorter fields = faster sort
5. **Input order**: Pre-sorted data sorts faster
6. **Record size**: Smaller records = faster sort
7. **System memory**: More memory reduces disk I/O

#### Best Practices
1. Use address-out sorts when only order matters
2. Apply RECORD specifications to reduce data volume
3. Keep sort fields as short as possible
4. Use B format for large address-out sorts
5. Pre-sort data when possible
6. Ensure adequate workspace on fast drives

### Sort Groups and Control Flow

- Multiple sort groups can exist in one control file
- MASK specification marks end of each sort group
- All groups execute sequentially
- Controls cleared between groups
- Errors stop remaining sorts

### Technical Considerations

1. **Collating Sequences**:
   - Native vs. Alternate controlled by FILE spec and BRConfig.sys
   - ALTS specifications apply only to C (character) format fields
   - Implied ALTS for ALTERNATE: `ALTS RO,176,"0123456789"`

2. **Multi-User Considerations**:
   - Use appropriate share specifications
   - SHR may produce incorrect order if records modified during sort
   - Consider SHRI for read-only access

3. **Error Recovery**:
   - Completed sorts remain valid if later sorts fail
   - Use REPLACE carefully to avoid data loss
   - Keep backups before major sort operations

4. **Record Limits**:
   - PD3 format (A): 99,999 records maximum
   - B4 format (B): 2.147 billion records maximum
   - No limit for record-out sorts (R)

## Printing Operations

### Overview
BR! provides comprehensive printing capabilities for both screen and printer output, supporting unformatted and formatted printing with extensive layout control options.

### Screen and Printer Layout

#### Screen Design
- **Default screen**: 24 rows × 80 columns
- **Rows**: Horizontal lines of text (1-24)
- **Columns**: Vertical character positions (1-80)
- **Status line**: Shows cursor position as row:column
- **Configurable**: Can be changed with OPEN statement

### Basic Printing

#### PRINT Statement Syntax
```bnf
PRINT [#<file-num> ':'] [<print-options>] [<print-list>]
<print-options> ::= BELL | NEWPAGE | TAB(<column>)
<print-list> ::= <expression> [<separator> <expression>]*
<separator> ::= ';' | ','
```

#### Output Destinations
```business-rules
00010 PRINT "Hello World"           ! Default to screen (#0)
00020 PRINT #0: "To screen"         ! Explicit screen output
00030 PRINT #255: "To printer"      ! Printer output
```

### PRINT Options

#### BELL Option
```business-rules
00100 PRINT BELL;                   ! Sound system bell
00110 PRINT #255: BELL;             ! Sound printer bell
02310 PRINT BELL; "ERROR: Invalid input"  ! Alert with message
```
- **Purpose**: Alert operator to important events
- **Usage**: Error handling, warnings, attention needed
- **Note**: Always follow BELL with semicolon

#### NEWPAGE Option
```business-rules
00010 PRINT NEWPAGE;                ! Clear screen
00020 PRINT #255: NEWPAGE;          ! Printer form feed
00100 PRINT NEWPAGE; "Welcome"      ! Clear then display
```
- **Purpose**: Clear screen or advance printer page
- **Best practice**: Use as first executable statement in programs
- **Note**: Always follow NEWPAGE with semicolon
- **Warning**: Different from CLEAR (which erases memory)

#### TAB Option
```business-rules
00010 PRINT TAB(20); "Column 20"
00020 PRINT ITEM1; TAB(30); ITEM2; TAB(50); ITEM3
00030 PRINT "Name"; TAB(15); "Age"; TAB(30); "City"
```
- **Syntax**: `TAB(x)` where x is target column
- **Behavior**: Moves cursor to specified column
- **Exceptions**:
  - If current position > x: prints on next line at column x
  - If x is negative: uses TAB(1)
  - If x > line length: prints at column 1 of next line
  - Non-integer x is rounded

### Unformatted Printing

#### Zone Printing (Comma Separator)
```business-rules
00100 PRINT NAME$, AGE, CITY$       ! Print in zones
```
- **Screen zones**: Columns 1, 24, 48 (3 zones on 80-col screen)
- **Printer zones**: Columns 1, 24, 48, 72, 96 (5 zones on 132-col printer)
- **Zone width**: 24 characters each
- **Overflow**: Continues to next line if zones filled

#### Concatenated Printing (Semicolon Separator)
```business-rules
00100 PRINT NAME$; " is "; AGE; " years old"
00200 PRINT PRICE; TAB(20); QUANTITY; TAB(40); TOTAL
```
- **Semicolon**: No spacing between items
- **Comma**: Tab to next zone
- **Can mix**: Combine separators in same statement

#### Leading and Trailing Spaces
- **Numeric values**: Automatic leading and trailing space
- **String values**: No automatic spaces
```business-rules
00010 LET NUM1=12: LET NUM2=6
00020 PRINT NUM1; NUM2              ! Output: " 12  6 "
00030 PRINT "Total:"; NUM1          ! Output: "Total: 12 "
```

### Formatted Printing

#### PRINT USING Statement
```bnf
PRINT [#<file-num> ':'] USING <line-ref> ':' <expression-list>
PRINT [#<file-num> ':'] USING <string-expr> ':' <expression-list>
```

#### FORM Statement
```bnf
FORM <format-spec> [',' <format-spec>]*
<format-spec> ::= <cursor-spec> | <conversion-spec>
<cursor-spec> ::= POS <column> | X <spaces> | SKIP <lines>
<conversion-spec> ::= C <length> | N <length>[.<decimals>] | PIC(<picture>)
```

### Format Specifications

#### C (Character) Specification
```business-rules
00100 FORM C 10, C 20, C 15
00110 PRINT USING 100: "John", "Smith", "Chicago"
```
- **Purpose**: Format character strings
- **Alignment**: Left-aligned in field
- **Field length**: Number after C

#### N (Numeric) Specification
```business-rules
00200 FORM N 5, N 7.2, N 10.4
00210 PRINT USING 200: 123, 456.789, 1234.56789
```
- **Purpose**: Format numeric values
- **Alignment**: Right-aligned in field
- **Decimals**: Optional decimal places after period
- **Rounding**: Automatic to specified decimals

#### PIC (Picture) Specification
```business-rules
00300 FORM PIC($$$,$$$.##), PIC(***,***.##)
00310 PRINT USING 300: 1234.56, 9876.54
```

#### PIC Format Symbols
| Symbol | Function | Example |
|--------|----------|---------|
| $ | Dollar sign and digit identifier | $$$.## |
| * | Asterisk fill and digit identifier | ***,***.## |
| # | Required digit (shows zero) | ###.## |
| , | Comma insertion | #,###.## |
| . | Decimal point | ###.## |
| - | Minus sign and digit identifier | ----.## |
| + | Plus/minus sign | +###.## |
| B | Blank space insertion | ###B### |
| Z | Zero suppression digit | ZZZ.ZZ |
| CR | Credit (negative only) | ###.##CR |
| DR | Debit (negative only) | ###.##DR |
| DB | Debit (negative only) | ###.##DB |

### Cursor Positioning

#### POS Specification
```business-rules
00400 FORM POS 10, N 5, POS 30, C 20
00410 PRINT USING 400: 123, "Test"
```
- **Purpose**: Position cursor at exact column
- **Syntax**: `POS <column>`

#### X Specification
```business-rules
00500 FORM C 10, X 5, N 8.2, X 10, C 15
00510 PRINT USING 500: "Item", 123.45, "Description"
```
- **Purpose**: Skip specified number of spaces
- **Syntax**: `X <spaces>`

#### SKIP Specification
```business-rules
00600 FORM N 10.2, SKIP 1, C 20, SKIP 2, N 8
00610 PRINT USING 600: 100.50, "Subtotal", 95
```
- **Purpose**: Move to column 1 of next line(s)
- **Syntax**: `SKIP <lines>`
- **Effect**: Like pressing ENTER

### Multiple Data Items and Format Reuse
```business-rules
00700 FORM N 8.2
00710 PRINT USING 700: 10.5, 20.3, 30.8, 40.2
! Form repeats for each data item
```
- **Behavior**: FORM statement repeats if more data than specs
- **Useful for**: Tables, lists with consistent formatting

### Comprehensive Examples

#### Unformatted vs Formatted Printing
```business-rules
! Unformatted - default rounding and spacing
00010 LET VALUE1 = 12345678901
00020 LET VALUE2 = 0.123456789
00030 PRINT VALUE1, VALUE2
! Output: 1.2345678901e+10      0.123457

! Formatted - controlled presentation
00040 FORM N 15, X 5, N 10.6
00050 PRINT USING 40: VALUE1, VALUE2
! Output: 12345678901      0.123457
```

#### Report Generation Example
```business-rules
! Header
00100 PRINT NEWPAGE;
00110 FORM C 15, X 5, C 10, X 5, C 12, X 5, C 10
00120 PRINT USING 110: "Product", "Price", "Quantity", "Total"
00130 PRINT USING 110: "="*15, "="*10, "="*12, "="*10

! Data lines
00200 FORM C 15, X 5, PIC($$,$$$.##), X 5, N 12, X 5, PIC($$,$$$.##)
00210 PRINT USING 200: "Widget A", 25.50, 100, 2550.00
00220 PRINT USING 200: "Gadget B", 150.75, 50, 7537.50
00230 PRINT USING 200: "Tool C", 99.99, 75, 7499.25

! Total line
00300 FORM SKIP 1, C 15, X 5, X 10, X 5, C 12, X 5, PIC($$$,$$$.##)
00310 PRINT USING 300: "TOTAL:", "", "Grand Total:", 17586.75
```

#### Mixed Format Printing
```business-rules
! Combine literal text in FORM with data
00400 FORM "Customer: ", C 30, SKIP 1, "Address: ", C 40
00410 PRINT USING 400: "John Smith", "123 Main St, Chicago IL"

! Multiple PRINT USING with same FORM
00500 FORM C 20, X 2, N 5, X 2, PIC($$$,$$$.##)
00510 PRINT USING 500: "January Sales", 150, 12500.50
00520 PRINT USING 500: "February Sales", 175, 14750.25
00530 PRINT USING 500: "March Sales", 200, 16800.00
```

#### Field and Value Relationship
```business-rules
! Field length vs value length demonstration
00600 FORM C 15, X 2, C 15, X 2, C 15
00610 PRINT USING 600: "Short", "Medium Length", "Very Long String That Exceeds Field"
! Fields are fixed width, values are truncated or padded
```

### Advanced Formatting Tips

#### Numeric Formatting Rules
- **Exponentiation**: Numbers > 10 digits shown in exponential form (unformatted)
- **Rounding**: Decimal digits > 6 are rounded (unformatted)
- **Field overflow**: If number too large for N spec, displays asterisks
- **Decimal alignment**: Decimal points align within numeric fields

#### Character Formatting Rules
- **Left alignment**: Strings are left-aligned in C fields
- **Truncation**: Strings longer than field are truncated
- **Padding**: Short strings are padded with spaces on right
- **No automatic spaces**: Unlike numbers, no leading/trailing spaces added

#### Best Practices
1. **Clear screen first**: Start programs with PRINT NEWPAGE
2. **Use BELL sparingly**: Only for important alerts
3. **Plan field widths**: Account for largest expected values
4. **Test alignment**: Preview output before printing
5. **Reuse FORM statements**: Define once, use multiple times
6. **Mix formats carefully**: Combine specs for complex layouts

### Opening Print Files
```bnf
OPEN #255: "NAME=<printer-spec>,RECL=<length>[,EOL=<type>]", DISPLAY, OUTPUT
```

#### Printer Specifications
- `PRN:/10` - Default BR printer (legacy)
- `PRN:/DEFAULT` - Current Windows default printer
- `PRN:/SELECT` - User printer selection dialog
- `PRN:/<printer-name>` - Specific Windows printer
- `WIN:/<printer-name>` - Native Windows Printing (NWP) - BR! 4.0+ (suppresses SPOOLCMD for that file only - 3.83k+)
- `PREVIEW:/<printer-name>` - Print preview before printing
- `DIRECT:/<printer-name>` - Direct port printing (bypasses driver)

**Copies Feature (3.83n+):**
Native spooling supports multiple copies on Windows, Novell, and Unix:
```business-rules
00010 OPEN #25: "Name=PRN:/10, Copies=3", DISPLAY, OUTPUT
00020 PRINT #25: "Document text..."
00030 CLOSE #25:
! Prints 3 copies of the document
```

**Note**: WIN: overrides SPOOLCMD and enables NWP. Use `CONFIG OPTION 31` to suppress NWP, `CONFIG OPTION 31 OFF` to resume.

#### Examples
```br
00010 OPEN #255: "NAME=PREVIEW:/DEFAULT,RECL=32000", DISPLAY, OUTPUT
00020 PRINT #255: "Hello World!"
00030 PRINT #255: "[BLUE]This text is blue"
00040 PRINT #255: "[TAHOMA]This uses Tahoma font"
00050 CLOSE #255:
```

### Native Windows Printing (NWP)

#### Requirements
- BR! 4.0+ (4.16+ for advanced features, 4.18+ for centering)
- Specify WIN:/ as device type (can use SUBSTITUTE statements)
- Error 6245 indicates invalid/unsupported escape sequence (suppress with OPTION 32)

#### Print Preview
```br
SUBSTITUTE WIN:/ PREVIEW:/  ! Enable preview for all WIN: printers
! Or open directly with:
00100 OPEN #255: "NAME=PREVIEW:/SELECT", DISPLAY, OUTPUT
```

#### PrintScreen GUI
```br
CONFIG PRINTSCREEN GUI  ! Graphical printscreen with Windows printers
```

### Print Formatting

#### NWP Font Control
```br
! Font selection
00100 PRINT #255: "\Efont='Arial'"  ! Direct font specification
00110 PRINT #255: "[FONT_ARIAL]"     ! Using PRINTER.SYS shortcut
00120 PRINT #255: "[FONT]'Tahoma'"    ! Parameterized substitution

! Font sizes
00200 PRINT #255: "[TINY]"    ! 6 pt
00210 PRINT #255: "[SMALL]"   ! 8 pt
00220 PRINT #255: "[LITTLE]"  ! 10 pt
00230 PRINT #255: "[MEDIUM]"  ! 12 pt
00240 PRINT #255: "[ESSAY]"   ! 14 pt
00250 PRINT #255: "[LARGE]"   ! 18 pt

! Font attributes
00300 PRINT #255: "[BOLD]Text[/BOLD]"
00310 PRINT #255: "[ITALICS]Text[/ITALICS]"
00320 PRINT #255: "[UNDERLINE]Text[/UNDERLINE]"
00330 PRINT #255: "\E_1Text\E_0"  ! Overline on/off
```

#### NWP Color Support
```br
! Named colors
00100 PRINT #255: "[RED]Red text"
00110 PRINT #255: "[BLUE]Blue text"
00120 PRINT #255: "[GREEN]Green text"

! HTML color codes
00200 PRINT #255: "\Ecolor=#FF0000"  ! Red
00210 PRINT #255: "[COLOR]'#0000FF'"  ! Blue using substitution

! Color shading (BR! 4.2+)
00300 PRINT #255: "\Eshade_color='#FFCCCC'"  ! Light red shade
```

#### NWP Positioning
```br
! Position in inches from page edge
00100 PRINT #255: "\Eposition='3,2'"  ! 3 inches from left, 2 from top

! Relative positioning
00200 PRINT #255: "\Eposition='+1,0'"  ! Move 1 inch right

! Using substitutions
00300 PRINT #255: "[POSITION]'6,0'"   ! Top right
00310 PRINT #255: "[TOPLEFT]"          ! Reset to origin

! Decipoint positioning (1/720 inch)
00400 PRINT #255: "\E&a720h1440V"  ! 1" from left, 2" from top

! Push/Pop position stack
00500 PRINT #255: "[PUSH]"  ! Save current position
00510 PRINT #255: "[POSITION]'6,0'Logo Here"
00520 PRINT #255: "[POP]"   ! Restore position
```

#### NWP Picture Printing
```br
! Print images directly
00100 PRINT #255: "\Epicture='2,2,logo.jpg'"  ! 2x2 inch image

! Image options
00200 PRINT #255: "\Epicture='3,3,photo.jpg:ISOTROPIC'"  ! Keep aspect ratio
00210 PRINT #255: "\Epicture='1,1,pattern.gif:TILE'"     ! Tile image

! Using substitution
00300 PRINT #255: "[PICTURE]'2,2,logo.jpg'"
```

#### NWP Boxing and Shading
```br
! Box drawing modes
00100 PRINT #255: "\Ebegin_box"        ! Full box (top, bottom, sides)
00110 PRINT #255: "Column 1|Column 2|Column 3"  ! | becomes vertical lines
00120 PRINT #255: "\Eend_box"

! Partial boxes
00200 PRINT #255: "\Ebegin_boxtop"     ! Top and sides only
00210 PRINT #255: "Header Row|Col 2|Col 3"
00220 PRINT #255: "\Ebegin_verticals"  ! Sides only
00230 PRINT #255: "Data 1|Data 2|Data 3"
00240 PRINT #255: "\Ebegin_boxbottom"  ! Bottom and sides
00250 PRINT #255: "Footer|Total|Sum"
00260 PRINT #255: "\Eend_box"

! Shading
00300 PRINT #255: "\E*c20G\Ebegin_shade"  ! 20% gray shade
00310 PRINT #255: "Shaded text"
00320 PRINT #255: "\Eend_shade"

! Field extension with CHR$(5)
00400 PRINT #255: "Extended field" & CHR$(5)  ! Fill to column width
```

#### NWP Justification
```br
! Text alignment
00100 PRINT #255: "\Eleft_justify"    ! Default
00110 PRINT #255: "\Eright_justify"   ! Right align
00120 PRINT #255: "\Ecenter"          ! Center text

! Right justify previous field
00200 PRINT #255: "Total:" & CHR$(6) & "1,234.56"

! Stop cursor mode for proportional fonts
00300 PRINT #255: "\Estop_cursor"     ! Cursor doesn't move horizontally
00310 PRINT #255: "\Ecenter"          ! Use current position as center
00320 PRINT #255: "Centered Text"
00330 PRINT #255: "\Emove_cursor"     ! Resume normal cursor movement
```

### Page Control

#### Page Setup
```br
! Orientation (must be first)
00100 PRINT #255: "\E&l1O"  ! Landscape
00110 PRINT #255: "\E&l0O"  ! Portrait

! Paper size
00200 PRINT #255: "\E&l2A"  ! Letter (8.5x11)
00210 PRINT #255: "\E&l3A"  ! Legal (8.5x14)
00220 PRINT #255: "\E&l26A" ! A4

! Envelopes
00300 PRINT #255: "\E&l81A" ! Com-10 Business envelope

! Paper source
00400 PRINT #255: "\E&l4H"  ! Lower tray
00410 PRINT #255: "\E&l2H"  ! Manual feed

! NWP tray selection
00500 LET TRAY$ = ENV$("LAST_TRAY_SELECTED")
00510 PRINT #255: "\Etray='" & TRAY$ & "'"
```

#### Lines and Spacing
```br
! Lines per inch (VMI)
00100 PRINT #255: "\E&l6D"   ! 6 LPI
00110 PRINT #255: "\E&l8D"   ! 8 LPI

! Characters per inch (HMI)
00200 PRINT #255: "\E(s10H"  ! 10 CPI
00210 PRINT #255: "\E(s12H"  ! 12 CPI
00220 PRINT #255: "\E(s17H"  ! 17 CPI (compressed)

! Margins
00300 PRINT #255: "\E&l3E"   ! Top margin 3 lines
00310 PRINT #255: "\E&l60P"  ! Page length 60 lines

! Duplex printing
00400 PRINT #255: "\E&l1S"   ! Duplex long edge
00410 PRINT #255: "\E&l2S"   ! Duplex short edge
```

### PCL Escape Sequences

#### Epson Compatible Codes
```br
! Basic control
00100 PRINT #255: CHR$(12)        ! Form feed (new page)
00110 PRINT #255: CHR$(15)        ! Compressed print on
00120 PRINT #255: CHR$(18)        ! Compressed print off
00130 PRINT #255: CHR$(27) & "E"   ! Emphasized on
00140 PRINT #255: CHR$(27) & "F"   ! Emphasized off

! Typeface selection
00200 PRINT #255: CHR$(27) & "k1"  ! Roman
00210 PRINT #255: CHR$(27) & "k2"  ! Swiss
00220 PRINT #255: CHR$(27) & "k3"  ! Modern (fixed)
```

#### HP PCL Codes
```br
! Font selection by number
00100 PRINT #255: "\E(s4099T"      ! Courier New
00110 PRINT #255: "\E(s16602T"     ! Arial
00120 PRINT #255: "\E(s16901T"     ! Times New Roman

! Stroke weight
00200 PRINT #255: "\E(s3B"         ! Bold
00210 PRINT #255: "\E(s-3B"        ! Light

! Font height
00300 PRINT #255: "\E(s12V"        ! 12 point

! Combined formatting
00400 PRINT #255: "\E(s17h4102t2B" ! 17cpi, Letter Gothic, bold
```

### Parameterized Substitutions
```br
! Define in BRConfig.sys
PRINTER NWP [CPI(XXX)], "\E(sXXXH"
PRINTER NWP [SETPOSITION(XX,YY)], "\Eposition='XX,YY'"
PRINTER NWP [SET_SHADE(Percent)], "\E*cPercentG"

! Use in program
00100 PRINT #255: "[CPI(12)]"             ! Set to 12 CPI
00110 PRINT #255: "[SETPOSITION(3,2)]"    ! Position at 3,2
00120 PRINT #255: "[SET_SHADE(25)]"       ! 25% shading
```

### Special Characters
```br
! Page number placeholder
00100 PRINT #255: "Page \Epage_number"  ! Replaced with actual page number

! Field extension
00200 PRINT #255: "Field" & CHR$(5)     ! Extend field in box mode

! Right justify previous
00300 PRINT #255: "Amount" & CHR$(6)    ! Right justify "Amount"
```

### PRINTER_LIST Function
Retrieve available Windows printers:
```bnf
PRINTER_LIST(<array$>)
```

Returns number of printers and fills array with printer names:
```br
00100 DIM PRINTERS$(1)*100
00110 LET PRINTER_COUNT = PRINTER_LIST(PRINTERS$)
00120 FOR I = 1 TO PRINTER_COUNT
00130   PRINT PRINTERS$(I)
00140 NEXT I
```

### Printer Types
Three printing methods are supported:

1. **Device Names**: Direct to LPT1, COM1, or network queue
   ```br
   OPEN #255: "NAME=PRN:/LPT1", DISPLAY, OUTPUT
   OPEN #255: "NAME=PRN:/\\server\queue", DISPLAY, OUTPUT
   ```

2. **SPOOLCMD**: Controlled by SPOOLCMD in BRConfig.sys
   ```
   SPOOLCMD COPY [SPOOLFILE] "\\server\printer"
   ```

3. **Windows Printers**: Through Windows Print Manager
   ```br
   OPEN #255: "NAME=PRN:/HP LaserJet", DISPLAY, OUTPUT
   ```

### Native Windows Printing (NWP)

#### Requirements
- BR! 4.0 or later
- Specify WIN:/ or PREVIEW:/ as device type
- Supports subset of PCL commands

#### Print Preview
```br
00100 OPEN #255: "NAME=PREVIEW:/SELECT", DISPLAY, OUTPUT
```
Or in BRConfig.sys:
```
SUBSTITUTE WIN:/ PREVIEW:/
```

#### NWP Box Drawing
```br
00100 PRINT #255: "[BOX]"         ! Start box
00110 PRINT #255: "Box content"
00120 PRINT #255: "[NOBOX]"       ! End box
```

#### NWP Shading
```br
00100 PRINT #255: "[SHADE]"       ! Start 20% shade
00110 PRINT #255: "Shaded text"
00120 PRINT #255: "[NOSHADE]"     ! End shading
00130 PRINT #255: "[SET_SHADE(50)]" ! 50% shade
```

### Direct Printing
Direct port printing bypasses Windows drivers for full PCL control:
```br
00100 OPEN #255: "NAME=DIRECT:/HP LaserJet", DISPLAY, OUTPUT
00110 PRINT #255: CHR$(27)&"E"     ! Reset printer
00120 ! Full PCL commands available
```

### Printer Configuration (BRConfig.sys)

#### PRINTER TYPE Statement
```
PRINTER TYPE <type-name> SELECT <printer-substring>
```

Example:
```
PRINTER TYPE HPLASER SELECT "HP Laser"
PRINTER TYPE EPSONDOT SELECT "Epson"
```

#### PRINTER INIT Statement
```
PRINTER [<type>] INIT [LPP <n>], "<escape-sequence>"
```

Examples:
```
PRINTER HPLASER INIT LPP 66, "\E&k2G\E(s10H\E&l6D\E&l0O"
PRINTER EPSONDOT INIT LPP 66, "\E@"
```

#### PRINTER Mode Settings
```
PRINTER <type> [<mode>], "<escape-sequence>"
```

Modes include:
- `[COLS=n]` - Columns per line
- `[LPP n]` - Lines per page
- `[CPI=n]` - Characters per inch
- `[LPI=n]` - Lines per inch
- `[BOLD+]/[BOLD-]` - Bold on/off
- `[ITALICS+]/[ITALICS-]` - Italics on/off
- `[LANDSCAPE]/[PORTRAIT]` - Page orientation
- `[LEGAL]/[LETTER]` - Paper size

Example configurations:
```
PRINTER HPLASER LPP 66 [COLS=80], "\E(s10H"        ! 10 CPI
PRINTER HPLASER LPP 66 [COLS=132], "\E(s16.66H"    ! Compressed
PRINTER HPLASER [BOLD+], "\E(s3B"                  ! Bold on
PRINTER HPLASER [BOLD-], "\E(s0B"                  ! Bold off
PRINTER HPLASER [LANDSCAPE], "\E&l1O"              ! Landscape
```

#### PRINTER RESET Statement
```
PRINTER [<type>] RESET, "<initialization-string>"
```

Appended to each report for specified printer type.

**3.83 Enhancements:**
- Fully implemented across all platforms (3.83j+)
- Windows model support added (3.83f+)
- RESET strings now applied to Ctrl-P images (3.83e+)
- Initialization string appended to each report formatted for the specified printer
- If no type specified, applies to all printers

### Spooling Configuration

#### SPOOLCMD
```
SPOOLCMD [@] [-w] <command> [SPOOLFILE] [COPIES] [PRINTQUEUE]
```

Parameters:
- `@` - Execute on client (client-server)
- `-w` - Direct Windows application call
- `[SPOOLFILE]` - Replaced with temp file path
- `[COPIES]` - Number of copies
- `[PRINTQUEUE]` - Queue name from OPEN statement

#### SPOOLPATH
```
SPOOLPATH <directory>
SPOOLPATH @ <client-directory>  ! Client-side path
```

### Print File Properties

#### Record Length
Default 128, maximum 32,000:
```br
OPEN #255: "NAME=PRN:/DEFAULT,RECL=32000", DISPLAY, OUTPUT
```

#### End-of-Line Control
```br
OPEN #255: "NAME=PRN:/DEFAULT,EOL=NONE", DISPLAY, OUTPUT  ! No EOL
OPEN #255: "NAME=PRN:/DEFAULT,EOL=CRLF", DISPLAY, OUTPUT  ! CR+LF
```

### PrintScreen Configuration
```
PRINTSCREEN GUI     ! Graphical printscreen
PRINTSCREEN PRN:/SELECT
```

### Printer.sys - Standardized Printer Substitutions

#### Overview
Printer.sys is a shared BRConfig.sys file providing standardized printer substitution statements for both PCL and NWP printing. It simplifies printer control by defining named shortcuts for common printer operations.

**Note**: Printer.sys can be customized - include your changes after including Printer.sys, as BR! uses the last occurrence of each matching substitution.

#### PCL Printer Control

##### Initial Configuration (PCL)
These must be done before printing:

**Orientation:**
```br
00100 PRINT #255: "[PORTRAIT]"   ! Portrait mode
00110 PRINT #255: "[LANDSCAPE]"  ! Landscape mode
```

**Paper Size - Standard:**
```br
00100 PRINT #255: "[EXECUTIVE]"  ! 7.25 x 10.5
00110 PRINT #255: "[LETTER]"     ! 8.5 x 11
00120 PRINT #255: "[LEGAL]"      ! 8.5 x 14
00130 PRINT #255: "[LEDGER]"     ! 11 x 17
00140 PRINT #255: "[A4PAPER]"    ! 210mm x 297mm
00150 PRINT #255: "[A7PAPER]"    ! 297mm x 420mm
```

**Paper Size - Envelopes:**
```br
00100 PRINT #255: "[MONARCH]"         ! 3 7/8 x 7.5
00110 PRINT #255: "[COM-10]"          ! 4 1/8 x 9.5
00120 PRINT #255: "[INTERNATIONAL DL]" ! 110mm x 220mm
00130 PRINT #255: "[INTERNATIONAL C5]" ! 162mm x 229mm
00140 PRINT #255: "[INTERNATIONAL B5]" ! 176mm x 250mm
```

**Paper Source (PCL Only):**
```br
00100 PRINT #255: "[PAPERSOURCE AUTO]"           ! Printer default
00110 PRINT #255: "[PAPERSOURCE MANUAL]"         ! Manual feeder
00120 PRINT #255: "[PAPERSOURCE MANUALENVELOPE]" ! Manual envelope
00130 PRINT #255: "[PAPERSOURCE TRAY2]"          ! Lower tray
00140 PRINT #255: "[PAPERSOURCE OPTIONAL]"       ! Optional input
00150 PRINT #255: "[PAPERSOURCE(7)]"             ! Custom source code
```

**Copies (PCL Only):**
```br
00100 PRINT #255: "[COPIES(14)]"  ! Print 14 copies
```

**Duplex Mode (PCL Only):**
```br
00100 PRINT #255: "[SIMPLEX]"          ! One-sided
00110 PRINT #255: "[DUPLEX]"           ! Long edge binding
00120 PRINT #255: "[DUPLEX SHORTEDGE]"  ! Short edge binding
```

**Top Margin:**
```br
00100 PRINT #255: "[TOP0]"    ! No top margin
00110 PRINT #255: "[TOP3]"    ! Skip 3 lines
00120 PRINT #255: "[TOP(17)]"  ! Skip 17 lines
```

##### Real-Time PCL Commands

**Lines Per Inch (LPI):**
```br
00100 PRINT #255: "[4LPI]"
00110 PRINT #255: "[6LPI]"
00120 PRINT #255: "[8LPI]"
00130 PRINT #255: "[10LPI]"
00140 PRINT #255: "[LPI(12)]"  ! Custom LPI
```

**Characters Per Inch (CPI):**
```br
00100 PRINT #255: "[4CPI]"
00110 PRINT #255: "[6CPI]"
00120 PRINT #255: "[8CPI]"
00130 PRINT #255: "[10CPI]"
00140 PRINT #255: "[12CPI]"
00150 PRINT #255: "[14CPI]"
00160 PRINT #255: "[16CPI]"
00170 PRINT #255: "[20CPI]"
00180 PRINT #255: "[CPI(15)]"  ! Custom CPI
```

**PCL Font Control:**
```br
00100 PRINT #255: "[FONT TIMES]"       ! Times New Roman
00110 PRINT #255: "[FONT ARIAL]"       ! Arial
00120 PRINT #255: "[FONT LINEPRINTER]" ! Line Printer font
00130 PRINT #255: "[SETFONT(4099)]"    ! Font by number
```

**PCL Font Sizes:**
```br
00100 PRINT #255: "[TINY]"         ! 6 pt
00110 PRINT #255: "[SMALL]"        ! 8 pt
00120 PRINT #255: "[LITTLE]"       ! 10 pt
00130 PRINT #255: "[MEDIUM]"       ! 12 pt
00140 PRINT #255: "[ESSAY]"        ! 14 pt
00150 PRINT #255: "[LARGE]"        ! 18 pt
00160 PRINT #255: "[JUMBO]"        ! 36 pt
00170 PRINT #255: "[GARGANTUAN]"   ! 96 pt
00180 PRINT #255: "[155POINT]"     ! 15.5 pt
00190 PRINT #255: "[SETSIZE(24)]"  ! Custom size
```

**Font Attributes:**
```br
00100 PRINT #255: "[BOLD]Text[/BOLD]"
00110 PRINT #255: "[ITALICS]Text[/ITALICS]"
00120 PRINT #255: "[UNDERLINE]Text[/UNDERLINE]"
00130 PRINT #255: "[UL]Text[/UL]"  ! Short form
```

**Rotation (PCL Only):**
```br
00100 PRINT #255: "[ROTATE0]"    ! Normal
00110 PRINT #255: "[ROTATE90]"   ! 90 degrees
00120 PRINT #255: "[ROTATE180]"  ! 180 degrees
00130 PRINT #255: "[ROTATE270]"  ! 270 degrees
```

**PCL Positioning:**
```br
00100 PRINT #255: "[TOPLEFT]"           ! Top left of page
00110 PRINT #255: "[DECIPOS(720,1440)]" ! Position in decipoints
00120 PRINT #255: "[ROWCOL(10,20)]"     ! Row 10, column 20
00130 PRINT #255: "[POS(10,20)]"        ! Same as ROWCOL
00140 PRINT #255: "[PCLPOS(300,600)]"   ! PCL units (pixels)
! Use +/- prefix for relative positioning
00150 PRINT #255: "[ROWCOL(+5,-10)]"   ! Relative movement
```

**Position Stack:**
```br
00100 PRINT #255: "[PUSH]"        ! Save current position
00110 PRINT #255: "[POS(1,1)]Logo Here"
00120 PRINT #255: "[POP]"         ! Restore position
```

**Proportional Spacing (PCL Only):**
```br
00100 PRINT #255: "[PS]"          ! Enable proportional
00110 PRINT #255: "[/PS]"         ! Disable proportional
```

**Escape Key:**
```br
00100 PRINT #255: "[E]"           ! ESC character for custom PCL
```

#### NWP (Native Windows Printing) Control

##### Initial Configuration (NWP)
Same orientation and paper size commands as PCL, plus:

**Dot Matrix Compatibility (NWP Only):**
```br
00100 PRINT #255: "[LETTER QUALITY]"  ! LQ mode
00110 PRINT #255: "[LQ]"              ! LQ mode (short)
00120 PRINT #255: "[DRAFT]"           ! Draft mode
00130 PRINT #255: "[EMPHASIZED]"      ! Emphasized mode
00140 PRINT #255: "[/EMPHASIZED]"     ! Exit emphasized
00150 PRINT #255: "[ENHANCED]"        ! Enhanced mode
00160 PRINT #255: "[/ENHANCED]"       ! Exit enhanced
```

##### Real-Time NWP Commands

**NWP Font Selection:**
```br
00100 PRINT #255: CHR$(27)&"font='Arial'Text"  ! Direct
00110 PRINT #255: "[FONT MICR]"                 ! MICR font
00120 PRINT #255: "[FONT TIMES]"                ! Times New Roman
00130 PRINT #255: "[FONT ARIAL]"                ! Arial
00140 PRINT #255: "[FONT LINEPRINTER]"          ! Line Printer
00150 PRINT #255: "[George Tisdale]"            ! Blue 12pt Arial
00160 PRINT #255: "[FONT]'Tahoma'"              ! Any font
00170 PRINT #255: "[SETFONT(Verdana)]"          ! Parameterized
```

**NWP Colors (NWP Only):**
```br
! Named colors
00100 PRINT #255: "[RED]Red text"
00110 PRINT #255: "[GREEN]Green text"
00120 PRINT #255: "[BLUE]Blue text"
00130 PRINT #255: "[MAGENTA]Magenta text"
00140 PRINT #255: "[CYAN]Cyan text"
00150 PRINT #255: "[YELLOW]Yellow text"
00160 PRINT #255: "[ORANGE]Orange text"
00170 PRINT #255: "[PURPLE]Purple text"
00180 PRINT #255: "[BLACK]Black text"
00190 PRINT #255: "[WHITE]White text"

! HTML color codes
00200 PRINT #255: CHR$(27)&"color='#FF0000'Red"
00210 PRINT #255: "[COLOR]'#0000FF'"  ! Blue
00220 PRINT #255: "[SETCOLOR(#00FF00)]"  ! Green
```

**NWP Underline/Overline:**
```br
00100 PRINT #255: "[UNDERLINE]Text[/UNDERLINE]"
00110 PRINT #255: "[UL]Text[/UL]"     ! Short form
00120 PRINT #255: "[OVERLINE]Text[/OVERLINE]"  ! NWP only
00130 PRINT #255: CHR$(27)&"-1Text"&CHR$(27)&"-0"  ! Direct underline
00140 PRINT #255: CHR$(27)&"_1Text"&CHR$(27)&"_0"  ! Direct overline
```

**NWP Boxing and Shading (NWP Only):**
```br
! Full box with top, bottom, and sides
00100 PRINT #255: "[BOX]"
00110 PRINT #255: "Column 1|Column 2|Column 3"  ! | creates vertical lines
00120 PRINT #255: "[/BOX]"

! Partial boxes
00200 PRINT #255: "[BOXTOP]"      ! Top and sides
00210 PRINT #255: "Header 1|Header 2|Header 3"
00220 PRINT #255: "[BOXVERTICALS]"  ! Sides only
00230 PRINT #255: "Data 1|Data 2|Data 3"
00240 PRINT #255: "[BOXBOTTOM]"   ! Bottom and sides
00250 PRINT #255: "Footer 1|Footer 2|Footer 3"
00260 PRINT #255: "[/BOX]"

! Alternative names
00300 PRINT #255: "[BOXOVER]"     ! Same as BOXTOP
00310 PRINT #255: "[BOXSIDES]"    ! Same as BOXVERTICALS
00320 PRINT #255: "[BOXUNDER]"    ! Same as BOXBOTTOM

! Invisible column separators
00400 PRINT #255: "[SEPARATOR]"   ! HEX 05 character
00410 PRINT #255: "[|]"           ! Also HEX 05
00420 PRINT #255: "Col1"&CHR$(5)&"Col2"  ! Direct HEX 05

! Shading
00500 PRINT #255: "[SHADE]"        ! Start shading
00510 PRINT #255: "Shaded text"
00520 PRINT #255: "[/SHADE]"       ! End shading

! Shade density
00600 PRINT #255: "[SHADE0]"       ! White (0%)
00610 PRINT #255: "[SHADE20]"      ! Light (20%)
00620 PRINT #255: "[SHADE40]"      ! Medium-light (40%)
00630 PRINT #255: "[SHADE60]"      ! Medium-dark (60%)
00640 PRINT #255: "[SHADE80]"      ! Dark (80%)
00650 PRINT #255: "[SHADE100]"     ! Black (100%)
00660 PRINT #255: "[SHADE(35)]"    ! Custom 35%
```

**NWP Positioning:**
```br
! Position in inches from page edge
00100 PRINT #255: CHR$(27)&"position='3,2'"     ! Direct
00110 PRINT #255: "[POSITION(3,2)]"             ! 3" right, 2" down
00120 PRINT #255: "[POSITION]'3,2'"              ! Alternative

! Relative positioning
00200 PRINT #255: CHR$(27)&"position='+1,0'"    ! Move 1" right
00210 PRINT #255: "[POSITION(+1,-0.5)]"         ! Relative

! Note: NWP position is from page edge (outside printable area)
! [TOPLEFT] uses PCL to position at printable area edge
```

**NWP Pictures (NWP Only):**
```br
! Print images (jpg, gif, bmp, ico, etc.)
00100 PRINT #255: CHR$(27)&"picture='2,2,logo.jpg'"  ! Direct
00110 PRINT #255: "[PICTURE]'2,2,logo.jpg'"          ! 2x2 inch
00120 PRINT #255: "[PIC(2,2,logo.jpg)]"              ! Parameterized

! Image modes
00200 PRINT #255: "[ISO PIC(3,3,photo.jpg)]"        ! Keep aspect ratio
00210 PRINT #255: "[TILE PIC(1,1,pattern.gif)]"     ! Tile pattern

! Example with positioning
00300 PRINT #255: "[PUSH]"                          ! Save position
00310 PRINT #255: "[POSITION]'1,1'"                 ! Top left
00320 PRINT #255: "[PICTURE]'2,2,logo.jpg'"         ! Print logo
00330 PRINT #255: "[POP]"                           ! Restore
```

#### Parameterized Substitution Statements

BR! 4.17+ supports parameterized substitutions where values can be passed to substitution statements:

**Syntax in BRConfig.sys:**
```
PRINTER PCL [COPIES(YYY)], "\E&lYYYX"
PRINTER NWP [SHADE(Percent)], "\E*cPercentG"
PRINTER NWP [SETPOSITION(XX,YY)], "\Eposition='XX,YY'"
```

**Usage in programs:**
```br
00100 PRINT #255: "[COPIES(57)]"           ! Print 57 copies
00110 PRINT #255: "[SHADE(35)]"            ! 35% shading
00120 PRINT #255: "[SETPOSITION(3.5,2.0)]" ! Position at 3.5,2
00130 PRINT #255: "[CPI(12)]"               ! 12 characters per inch
00140 PRINT #255: "[LPI(8)]"                ! 8 lines per inch
```

#### Including Printer.sys

Add to your BRConfig.sys:
```
INCLUDE printer.sys
```

Then customize with your own substitutions after the include:
```
! Override or add custom substitutions
PRINTER NWP [MYLOGO], "[POSITION]'1,1'[PICTURE]'2,2,mylogo.jpg'"
PRINTER PCL [RESET], "\E&k2G"
```

### Common Printing Tasks

#### Print to File
```br
00100 OPEN #1: "NAME=report.txt,RECL=132", DISPLAY, OUTPUT
00110 PRINT #1: "Report content"
00120 CLOSE #1:
```

#### User Printer Selection
```br
00100 DIM PRINTERS$(1)*100, SELECTION$*60
00110 LET COUNT = PRINTER_LIST(PRINTERS$)
00120 ! Display printer list for user selection
00130 INPUT "Select printer (1-"&STR$(COUNT)&"): ", CHOICE
00140 OPEN #255: "NAME=PRN:/"&PRINTERS$(CHOICE), DISPLAY, OUTPUT
```

#### Formatted Report
```br
00100 OPEN #255: "NAME=PREVIEW:/DEFAULT,RECL=132", DISPLAY, OUTPUT
00110 PRINT #255: "[BOLD]SALES REPORT[BOLD-]"
00120 PRINT #255: "[CPI=12]"  ! 12 characters per inch
00130 PRINT #255: USING "10A,5X,10N 2.2": "Product", SALES
00140 CLOSE #255:
```

## Multi-User Programming

### Overview
BR! provides comprehensive multi-user capabilities for both centralized and distributed processing systems. All BR! versions support multi-user features, allowing programs to be written for both single and multi-user environments.

### File Sharing Specifications

#### Share-Spec Parameters
The share-spec parameter in OPEN statements determines file access permissions for other users:

```bnf
OPEN #<file-num>: "NAME=<filename> [,{NOSHR|SHRI|SHR|SHRU}] [,WAIT=<seconds>] [,RESERVE]",
     <file-type>, <access-mode>, <access-method>
```

##### NOSHR (No Share)
- **Default behavior** when share-spec not specified
- Exclusive access - no other opens permitted
- Use for batch updates, purging, temporary files
- Affects other workstations AND same workstation (except multiple indexes)

##### SHRI (Share Input)
- Others can open file for INPUT only
- Useful during batch updates or multi-record updates
- Default for SORT control and input files
- Prevents data changes during sort/report operations

##### SHR/SHRU (Share)
- Full sharing - others can read and write
- Individual records locked during updates (with OUTIN)
- SHRU maintains System/23 compatibility (same as SHR)
- Maximizes multi-user capabilities but increases overhead

#### File Sharing Rules Matrix
```
First OPEN     Second OPEN    Result
-----------    -----------    ------
NOSHR          Any            Error 4148
SHRI,INPUT     INPUT          OK
SHRI,OUTPUT    Any            Error 4148
SHR            SHR            OK
```

### Record Locking

#### Automatic Record Locking
Records are automatically locked when:
- File opened with SHR,OUTIN
- READ statement executed (default behavior)
- Record remains locked until:
  - Another record is read
  - Record is rewritten
  - RELEASE/RESTORE used
  - File is closed

#### Lock Control Parameters
```bnf
READ #<file-num> [,RESERVE|RELEASE]: <variables>
REREAD #<file-num> [,RESERVE|RELEASE]: <variables>
WRITE #<file-num> [,RESERVE|RELEASE]: <variables>
REWRITE #<file-num> [,RESERVE|RELEASE]: <variables>
DELETE #<file-num> [,RESERVE|RELEASE]:
RESTORE #<file-num> [,RESERVE|RELEASE]:
```

##### RESERVE Parameter
- Maintains existing locks when accessing new records
- Allows multiple records locked simultaneously
- Must be specified on each I/O operation to maintain locks
- Use for multi-record updates (e.g., inventory transactions)

##### RELEASE Parameter
- Reads record without locking (READ #1,RELEASE:)
- Releases locked records (RESTORE #1,RELEASE:)
- Reduces system overhead for read-only operations
- Default behavior for most operations

#### Wait Time for Locked Records
```bnf
OPEN #<file-num>: "NAME=<filename>,WAIT=<seconds>"
```
- Default: 15 seconds
- Returns error 0061 if timeout exceeded
- Can be customized per file

### File Name Locking

#### PROTECT Command
Reserves or protects file names at system level:

```bnf
PROTECT <filename>, {RESERVE|READ|WRITE|RELEASE}
```

##### PROTECT Parameters
- `RESERVE`: Exclusive file name reservation (even when closed)
- `READ`: Write-protect file for all users
- `WRITE`: Remove write protection
- `RELEASE`: Remove RESERVE restrictions

Example - Exclusive file maintenance:
```business-rules
00100 PROCERR RETURN
00110 PROTECT CUSTMAST,RESERVE
00120 PROCERR STOP
00130 SKIP DONE IF ERR <> 0
00140 COPY CUSTMAST WORK[WSID] -D
00150 FREE CUSTMAST
00160 RENAME WORK[WSID] CUSTMAST
00170 INDEX CUSTMAST,CUSTMAST.KEY,1,4,REPLACE
00180 PROTECT CUSTMAST,RELEASE
00190 :DONE
00200 CHAIN "MENU"
```

#### OPEN RESERVE Parameter
```bnf
OPEN #<file-num>: "NAME=<filename>,RESERVE"
```
- Reserves file name for exclusive use
- Similar to PROTECT RESERVE
- Released with CLOSE #n,RELEASE or PROTECT file,RELEASE

### Workstation ID Support

#### [WSID] Substitution
Creates unique file names per workstation:

```bnf
<filename>[WSID]
```

BR! automatically replaces [WSID] with workstation's unique ID number.

Examples:
```business-rules
00100 FREE WORK[WSID]
00200 INDEX CUSTMR,CUSTKEY.[WSID],1,5,REPLACE
00300 OPEN #1:"NAME=CUSTMR,KFNAME=CUSTKEY.[WSID]",INTERNAL,INPUT,KEYED
```

#### WSID$ Function
Returns current workstation ID as string:
```business-rules
00100 LET TEMPFILE$ = "WORK" & WSID$ & ".TMP"
```

### Multi-User I/O Patterns

#### Single Record Update
Standard pattern with automatic locking:
```business-rules
00100 OPEN #1:"NAME=CUSTFILE,SHR",INTERNAL,OUTIN,RELATIVE
00200 READ #1,USING 210,REC=CUSTNO: NAME$,BALANCE
00210 FORM C 30,PD 5.2
00220 LET BALANCE = BALANCE + AMOUNT
00230 REWRITE #1,USING 210: NAME$,BALANCE
```

#### Multiple Record Locking
For transactions affecting multiple records:
```business-rules
00200 FOR X=1 TO ITEMS
00210   READ #3,USING 220,KEY=ITEM$(X),RESERVE: QTY,ALLOC
00220   FORM POS 60,2*B 4
00230   IF QTY(X)>QTY-ALLOC THEN RESTORE #3: : GOTO 100
00240   ALLOC(X)=ALLOC+QTY(X) : R(X)=REC(3)
00250 NEXT X
00260 FOR X=1 TO ITEMS
00270   REWRITE #3,USING 280,REC=R(X),RESERVE: ALLOC(X)
00280   FORM POS 64,B 4
00290 NEXT X
00300 RESTORE #3: ! Release all locks
```

#### Lock Error Recovery
Handling locked record errors:
```business-rules
00100 OPEN #1:"NAME=DATAFILE,SHR",INTERNAL,OUTIN,KEYED,IOERR CONFLICT
00500 CONFLICT: IF ERR=4148 THEN 600
00510 PRINT "Error ";ERR;" at line ";LINE
00520 LINPUT X$ : RETRY
00600 PRINT "File in use. Press <CR> to retry, F10 to end."
00610 LINPUT X$
00620 IF CMDKEY=10 THEN GOTO ENDPGM ELSE RETRY
```

### Multi-User Printer Support

#### Printer Classes
Use PRN:/xx where xx is a two-digit class number:

```bnf
OPEN #<file-num>: "NAME=PRN:/<class>", DISPLAY, OUTPUT
```

Standard printer classes:
- 10-19: Primary high-speed printers (default: 10)
- 20-29: Letter-quality printers
- 30-39: Laser printers

Examples:
```business-rules
00100 OPEN #255:"NAME=PRN:/10",DISPLAY,OUTPUT  ! Default printer
00120 OPEN #120:"NAME=PRN:/20",DISPLAY,OUTPUT  ! Letter quality
```

#### Printer Redirection
Using SUBSTITUTE for printer management:
```business-rules
CONFIG SUBSTITUTE PRN:/20,PRN:/10    ! Route class 20 to class 10
CONFIG SUBSTITUTE PRN:/10,LPT2:      ! Route to local printer
CONFIG SUBSTITUTE PRN:/11,COM2:      ! Route to serial printer
```

### Multi-User Error Codes

Common multi-user related errors:
- **0061**: Record locked by another user
- **4148**: File sharing rules violated
- **4205**: Access denied (Novell spooler)

### Best Practices

1. **Always specify share-spec** even for single-user programs
2. **Use SHR for maximum accessibility** when appropriate
3. **Release records promptly** to minimize lock time
4. **Use [WSID] for temporary files** to ensure uniqueness
5. **Implement error handling** for lock conflicts
6. **Consider lock timeout values** based on application needs
7. **Document multi-user requirements** in program comments

## Error Handling

### Overview
BR! provides comprehensive error handling capabilities to help programs recover from execution errors without beeping or halting. When errors occur, BR! sets system variables and provides multiple levels of error trapping and recovery mechanisms.

### What Happens When an Error Occurs

#### External (Visible) Events
1. Computer beeps
2. "ERROR" appears in far left corner of status line
3. Four-digit error code appears in middle of status line
4. Line number of error-causing statement displayed in status line
5. Program temporarily suspended, awaits operator command

#### Internal Events
1. Error code assigned to system variable **ERR**
2. System variable **LINE** set to line number containing error
3. Statement position tracked for multi-statement lines
4. System variable **CNT** set to number of successfully processed I/O items (I/O errors only)
5. System variable **FILENUM** set to file number (I/O errors only)

### System Variables for Error Handling

#### ERR
- Contains the most recent 4-digit error code
- Updated whenever an error occurs
- Reset by successful operations

#### LINE
- Contains line number where error occurred
- Used in error handling routines to identify error location

#### CNT
- Number of items successfully processed in I/O list
- Only set for I/O errors
- Add 1 to get first unsuccessful field: `CNT+1`
- Reset by any I/O operation (including PRINT in error handler)

#### FILENUM
- File number from statement causing most recent error
- Only meaningful for I/O errors
- Use with FILE$() function to get file name/path

### Error Handling Levels

BR! provides four levels of error trapping, processed in order:

#### Level 1: Statement-Level Error Conditions
Error conditions coded directly on statements:
```bnf
<statement> [<error-condition> <line-ref>]*
<error-condition> ::= CONV | DUPREC | EOF | EXIT | IOERR | NOKEY | 
                      NONE | NOREC | OFLOW | PAGEOFLOW | SOFLOW | HELP | ZDIV
```

Example:
```business-rules
00020 INPUT MI CONV 80           ! Handle conversion error
00040 READ #5: DATA$ EOF 900      ! Handle end of file
00050 PRINT USING 60: X SOFLOW 100, CONV 110  ! Multiple conditions
```

#### Level 2: EXIT Statement Groups
Centralized error condition groups:
```bnf
EXIT <error-condition> <line-ref> [, <error-condition> <line-ref>]*
```

Example:
```business-rules
00050 EXIT CONV CONV_HANDLER, SOFLOW OVERFLOW, ZDIV DIV_ZERO
00110 PRINT USING 130: "1",2 EXIT 50  ! Use EXIT group
```

#### Level 3: ON Error Statements
Program-wide error handling:
```bnf
ON <error-condition> {GOTO <line-ref> | IGNORE | SYSTEM}
```

Example:
```business-rules
00002 ON ZDIV IGNORE              ! Ignore division by zero
00003 ON IOERR GOTO 90000         ! Jump to I/O error handler
00004 ON CONV SYSTEM              ! Use system default handling
```

#### Level 4: ON ERROR Statement
Catch-all for untrapped errors:
```bnf
ON ERROR {GOTO <line-ref> | IGNORE | SYSTEM}
```

Example:
```business-rules
00001 ON ERROR GOTO GENERAL_ERROR ! Trap all otherwise untrapped errors
```

### Error Conditions Reference

#### CONV
Conversion errors:
- Numeric input field contains non-numeric characters
- Number too big for field
- Type mismatch (numeric/string)
- Negative value without sign in PIC format

#### DUPREC
Attempt to WRITE to existing record (must use REWRITE)

#### EOF
- No more records in file (READ/INPUT)
- Insufficient file space (PRINT/WRITE)

#### EXIT
Special condition that references an EXIT statement elsewhere

#### IOERR
Covers all I/O errors not previously trapped

#### NOKEY
File does not contain specified key

#### NONE
No matching line-ref in ON GOSUB/ON GOTO

#### NOREC
- Specified record deleted
- Record number too high for WRITE (≥ last+2)
- Record number > last record for READ

#### OFLOW
Numeric overflow (System/23 compatibility)

#### PAGEOFLOW
Lines printed ≥ page length (default 60)

#### SOFLOW
String overflow:
- Input exceeds string variable length
- Output string exceeds field width

#### HELP
Trap Help key press

#### ZDIV
Division by zero attempted

### Error Recovery Statements

#### RETRY
Re-executes the statement that caused the error:
```bnf
RETRY
```
- Returns control to error-causing statement
- Useful after user corrects input
- Maintains all program state

#### CONTINUE
Skips error-causing statement and continues:
```bnf
CONTINUE
```
- Transfers control to next statement after error
- Used for non-critical errors
- Common with PAGEOFLOW

Example:
```business-rules
00080 CONV_ERROR: !
00090   PRINT "Please enter numbers, not letters."
00100   RETRY      ! Try the INPUT again
00110 !
00120 PAGEOFLOW: !
00130   PRINT #255: NEWPAGE
00140   CONTINUE   ! Continue printing
```

### ON Statement Options

#### GOTO
Transfers control to specified line:
```business-rules
ON CONV GOTO 80000
```

#### IGNORE
Skips error-causing statement without beeping:
```business-rules
ON ZDIV IGNORE    ! Skip division by zero
```
- Error-causing statement skipped (except SOFLOW)
- ERR and LINE not set
- Program continues with next statement
- SOFLOW truncates string instead of skipping

#### SYSTEM
Reinstates normal error processing:
```business-rules
ON CONV SYSTEM    ! Use default handling
```
- Computer beeps
- Program suspended
- ERROR displayed in status line

### Function Key Handling

Function keys can be trapped during RUN mode:
```bnf
ON FKEY <number> {GOTO <line-ref> | IGNORE | SYSTEM}
```

Examples:
```business-rules
00001 ON FKEY 2 GOTO 90000        ! F2 jumps to line 90000
00002 ON FKEY 10 IGNORE           ! F10 ignored
00003 ON FKEY 7 GOTO EXIT_REPORT  ! F7 exits report gracefully
```

Notes:
- F1-F10 default to IGNORE
- F11-F20 may require SHIFT+F1 to SHIFT+F10
- During INPUT, function keys set CMDKEY instead

### Comprehensive Error Handler Example

```business-rules
00001 ON ERROR GOTO GENERAL_ERROR ! Catch-all handler
00002 ON FKEY 9 GOTO HELP_SCREEN  ! F9 for help
!
! ... main program ...
!
99000 GENERAL_ERROR: ! General purpose error handling
99010   LET SAVECNT=CNT             ! Save CNT before PRINT changes it
99020   PRINT BELL;BELL;            ! Alert user
99030   PRINT "Error";ERR;"at line";LINE
99040   PRINT "Current value of CNT =";SAVECNT
99050   IF FILENUM>0 THEN
99060     PRINT "File #";FILENUM;"--";FILE$(FILENUM)
99070     IF FILE(FILENUM)>0 THEN
99080       PRINT "Last record processed:";REC(FILENUM);"of";LREC(FILENUM)
99090     END IF
99100   END IF
99110   PAUSE
99120   STOP
```

### Best Practices

1. **Always save CNT immediately** in error handlers before any I/O operations
2. **Use specific error conditions** on critical statements
3. **Create EXIT groups** for common error combinations
4. **Use ON ERROR GOTO** as final safety net
5. **Provide meaningful error messages** to users
6. **Use RETRY for correctable errors**, CONTINUE for recoverable ones
7. **Test error paths** during development
8. **Document error recovery** strategies in comments
9. **Consider function keys** for graceful interruption
10. **Log errors** for debugging and maintenance

### Common Error Codes Reference

#### File and I/O Errors
- **0057 (NOREC)**: Record not found or deleted
- **0059**: Attempt to change key field value
- **0611**: Bad baud or async initialization error (3.90)
- **0718**: KEYONLY read without master record buffer allocation (3.90)
- **0721 (IOERR)**: I/O conflicts with OPEN mode
- **1006**: Invalid command or syntax error
- **1038**: Illegal date or time (3.90)
- **1070**: Undefined variable (3.90)

#### File System Errors (4xxx)
- **4115 (DUPREC)**: Duplicate record on WRITE
- **4126**: File abnormally truncated (3.90)
- **4127**: Btree/ISAM conflict (3.90)
- **4129**: File name is too long (3.90)
- **4139**: Could not re-reserve file after rename (3.90)
- **4152**: No more files available (replaces 4218)
- **4180**: Bad drive statement (3.90)
- **4184**: Drive is already mapped (3.90)
- **4194-4196**: Null record encountered (3.90)
- **4205**: Cannot change file creation time (Unix)
- **4218**: No more files available (deprecated, use 4152)
- **4272 (NOKEY)**: Key not found
- **4399**: Windows file not shareable (3.90)

#### Index and Btree Errors (7xxx)
- **7603**: Duplicate keys found (warning)
- **7611**: Key file already exists (without REPLACE)

#### Internal Errors (9xxx)
- **9201**: Internal - not a valid access for opening a file (3.90)
- **9203**: Internal - not a valid create for opening a file (3.90)

#### Notes on Error Handling (3.90+)
- Debug commands generate errors 1006 and 1070 instead of ignoring invalid commands
- PROC commands with missing files now properly generate errors
- Better error reporting for program loading I/O errors
- Enhanced error messages for file operations on network drives

### Program Execution Modes

**READY Mode**: Default mode for entering commands and editing

**RUN Mode**: Program execution mode
- Entered with RUN command
- Exits on STOP or END statement

**ERROR Mode**: Entered when runtime error occurs
- Status line shows "ERROR" and error code
- Commands available except SAVE, RUN, REPLACE, SYSTEM
- Exit with GO (resume) or STOP (terminate)

**ATTN Mode**: Attention/interrupt mode
- Enter with Ctrl+A during execution
- Allows command execution and variable inspection
- Exit with GO to resume
- All ATTN mode changes erased on GO

**INPUT Mode**: Waiting for user input
- Status line shows "INPUT"
- Program paused until data entered

### Common Error Codes

#### Syntax and Input Errors (1xxx)
- **1003** - Missing quote (unclosed string delimiter)
- **1006** - Invalid line number
- **1007** - Statement too long
- **1008** - Invalid variable name

#### Conversion and Type Errors (0xxx)
- **0** - No error (successful completion)
- **0059** - Attempt to change key field value
- **0718** - Key string length mismatch
- **0726** - Conversion error (non-numeric input)
- **0745** - Division by zero

#### File and I/O Errors (4xxx)
- **11** - File not found (system level)
- **4150** - File already exists (duplicate file name)
- **4152** - File not found
- **4225** - Record not found
- **4270** - End of file
- **4271** - Incomplete record
- **4272** - Key not found (NOKEY)
- **4300** - Shell call return value

#### Index File Errors (7xxx)
- **7603** - Duplicate keys found (warning)
- **7611** - Key file already exists

### New Error Codes (4.17+)
**Format and Specification Errors:**
- **0108** - String function result exceeds maximum (32767 bytes)
- **0861** - Invalid format specification (use OPTION 45 for old format)
- **0879** - Mixed strings and numbers in G, FMT, PIC column
- **0885** - Advanced controls inside grids/lists not allowed
- **0886** - Input attempted from unpopulated 2D control

**Printer Errors:**
- **6242** - Bad format for parameterized printer substitutions
- **6243** - Parameter counts mismatch for substitutions
- **6244** - Substitution result too long
- **6247** - Malformed color spec in printing
- **6248** - Bad picture spec in printing

### New Error Codes (4.30+)
**Data Validation:**
- **0940** - Value does not match boolean format
- **0941** - NULL boolean value where allow null is false
- **0945** - Date format is excessively long

**SQL Errors:**
- 4002-4014 - SQL operation failures
- 4115 - Database not opened
- 4120 - Invalid Y2K data in index field

**Encryption Errors:**
- 2022 - Encryption method does not exist
- 2024 - Encryption method is only valid one way
- 2026 - Missing encryption key
- 2030 - Failed processing encryption

**File Operation Errors:**
- 0050 - Writing to BTREE2 file failed
- 0717 - Error deleting record from BTREE2 file
- 4123 - Corrupted BTREE index
- 4147 - File opened too many times at share level
- 4160 - Out of internal file handles

**Input/Output Errors:**
- 0887 - Sort column is not valid
- 0930 - INPUT FIELDS RANGE bad range variables
- 0931 - Invalid insert/delete change with range
- 8002 - Window too small for input

**System Errors:**
- 4145 - Timeout waiting for input/ASYNC file I/O
- 4175 - Multiple wbserver files detected
- 4239 - Disk is full
- 4618 - Connection abort (no reconnect)
- 4620 - Client server connection failure

Use BRERR$(error-code) to get descriptions of any error code.

## Help Facility

### Overview
The BR! Help Facility provides context-sensitive documentation access from both READY mode (for programmers) and during program execution (for operators). It requires three files: wbcmd.wbh, wbcmd2.wbh, and wbcmd3.wbh.

### Accessing Help

#### From READY Mode
- **F1 or Ctrl-Y** - Access help based on context:
  - With command/statement on line 24: Shows syntax for that command
  - After an error (arrow down to blank line): Shows error description
  - Blank command line: Shows main help menu

#### From Running Applications
- **Ctrl-Y (<HELP> key)** - Access help during program execution
- Precedence order:
  1. Error code help if in ERROR mode
  2. HELP error condition handler if coded
  3. HELPDFLT topic from BRConfig.sys

### Help$ Function
```bnf
HELP$([*]<keyword>[,<filename>][,<mark>])
```
- Enters HELP mode and displays specific topic
- `*` prefix prevents screen restoration on exit
- `<keyword>` - Topic name to display
- `<filename>` - Help file containing topic (defaults to HELPDFLT)
- `<mark>` - Numeric position in help text (for context-sensitive help)

#### Examples
```business-rules
00100 ! Basic help call
00200 LET X$ = HELP$("PRINT")
00300 ! Context-sensitive help using CURFLD
00400 INPUT FIELDS MAT FLD$: HRS, OT, DT HELP 900
00900 LET X$ = HELP$("HOURS.ENTRY", CURFLD): RETRY
01000 ! Return keyboard scancode from help
01100 LET KEY$ = HELP$("ERROR")
01200 IF KEY$ = HEX$("0900") THEN GOTO MENU ! F9 pressed
```

### HELP Error Condition
Trap the <HELP> key press during input:
```business-rules
00100 INPUT FIELDS "10,10,C 20": NAME$ HELP 1000
01000 ! Help handler
01010 LET X$ = HELP$("NAME_HELP")
01020 RETRY
```

### ON HELP Statement
```bnf
ON HELP {GOTO <line-ref> | SYSTEM | IGNORE}
```
- **SYSTEM** (default) - Uses HELPDFLT specification
- **IGNORE** - Disables help key
- **GOTO** - Branches to specific line

### Help Text File Structure

#### Topic Definition Format
```
:<topic-name> <menu-description>
::<related-topic-1>
::<related-topic-2>
<help text content>
:<topic-name>
```

#### Example Help Text
```
:PRINT PRINT statement/syntax
::PRINT FIELDS
::PRINT USING
::MAT PRINT

The PRINT statement displays data on the screen or sends it to a printer.

Syntax: PRINT [#<file-num>,] [<print-list>]
:PRINT
```

### Display Attributes in Help
Use vertical bar (|) with attribute codes:
- **H** - Highlight
- **B** - Blink
- **U** - Underline
- **R** - Reverse
- **N** - Normal
- **I** - Invisible

Example: `|U This text is underlined|`

### Passing Values from Help

#### Return Keyboard Scancode
In help text file:
```
:ERROR File sharing error
Press F9 for menu or any key to retry
:ERROR RETURN
```

In program:
```business-rules
00100 LET X$ = HELP$("ERROR")
00200 IF X$ = HEX$("0900") THEN GOTO MENU ELSE RETRY
```

#### Return Menu Selection
In help text file:
```
:MENU
::*ORDERENT.BR Order Entry
::*ORDERPRT.BR Order Print
:MENU
```

In program:
```business-rules
00100 LET PROG$ = HELP$("*MENU,filename")
00200 IF PROG$ <> "" THEN CHAIN PROG$
```

### BRConfig.sys Help Specifications

#### HELPDFLT
```
HELPDFLT <keyword>[,<filename>]
```
Specifies default help topic when <HELP> key pressed.

### WBHelp Compiler
Compiles text files into help facility format:
```bash
wbhelp [-o output.wbh] input1.txt [input2.txt ...]
```
- **-c** option: Create .WBH even if errors found
- **-e** option: List external file references

### Help Navigation Keys
- **F1** - Show related topics menu
- **F2** - Return to previous screen (up to 15 levels)
- **F9** - Toggle between menu descriptions and topic keywords
- **ESC** - Exit help and return to program
- **PgUp/PgDn** - Navigate through multi-page help text
- **Arrow keys** - Move selection bar in menus
- **Enter** - Select menu item

### Context-Sensitive Help Implementation
Using CURFLD for field-specific help:
```business-rules
00100 DIM FLD$(4)*20
00200 DATA "10,10,C 10","11,10,C 20","12,10,N 5","13,10,N 5"
00300 MAT READ FLD$
00400 INPUT FIELDS MAT FLD$: CODE$, NAME$, QTY, PRICE HELP 900
00900 ! Help based on current field position
00910 LET TOPIC$ = "FIELD" & STR$(CURFLD)
00920 LET X$ = HELP$(TOPIC$, CURFLD)
00930 RETRY
```

## Program Structure

### Program Size Limits
- **Maximum lines**: 32,000 lines (expanded from 4,100 in earlier versions)
- **Line number range**: 1 to 99999
- **Dictionary size**: 2MB maximum (expanded from 64KB)

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

### Menu-Driven Programs

**Purpose**: Provide user with list of options and branch to appropriate routines

#### Basic Menu Structure
```business-rules
00010 ! **********************MAIN MENU**********************
00020 MENU: PRINT "Select an option:"
00030 PRINT "1 - Add Record"
00040 PRINT "2 - Edit Record"
00050 PRINT "3 - Delete Record"
00060 PRINT "4 - View Reports"
00070 PRINT "Q - Quit"
00080 INPUT CHOICE$
00090 IF CHOICE$ = "1" THEN GOTO ADD_RECORD
00100 IF CHOICE$ = "2" THEN GOTO EDIT_RECORD
00110 IF CHOICE$ = "3" THEN GOTO DELETE_RECORD
00120 IF CHOICE$ = "4" THEN GOTO VIEW_REPORTS
00130 IF UPRC$(CHOICE$) = "Q" THEN GOTO END_PROGRAM
00140 PRINT "Invalid choice, please try again"
00150 GOTO MENU
```

#### Menu with Subroutines
```business-rules
00010 ! Main menu loop
00020 DO
00030    GOSUB DISPLAY_MENU
00040    GOSUB GET_CHOICE
00050    GOSUB PROCESS_CHOICE
00060 LOOP UNTIL QUIT$ = "Y"
00070 END

01000 DISPLAY_MENU: ! Show menu options
01010    PRINT NEWPAGE
01020    PRINT "===== COMPANY VEHICLES ====="
01030    PRINT "1 - Sales Vehicles"
01040    PRINT "2 - Grounds Use"
01050    PRINT "3 - Delivery"
01060    PRINT "4 - Executive Use"
01070    PRINT "Q - Quit"
01080 RETURN

02000 GET_CHOICE: ! Get user selection
02010    PRINT "Enter choice: ";
02020    INPUT CHOICE$
02030 RETURN

03000 PROCESS_CHOICE: ! Branch based on choice
03010    IF CHOICE$ = "1" THEN GOSUB SALES
03020    IF CHOICE$ = "2" THEN GOSUB GROUNDS
03030    IF CHOICE$ = "3" THEN GOSUB DELIVERY
03040    IF CHOICE$ = "4" THEN GOSUB EXECUTIVE
03050    IF UPRC$(CHOICE$) = "Q" THEN LET QUIT$ = "Y"
03060 RETURN

04000 SALES: ! Process sales vehicles
04010    ! [Sales processing code]
04990 RETURN

05000 GROUNDS: ! Process grounds vehicles
05010    ! [Grounds processing code]
05990 RETURN
```

### Program Flow Control Best Practices

#### Subroutine Organization
- Place subroutines at end of program (high line numbers)
- Use line numbers like 10000, 20000, 30000 for major sections
- Maximum program size: 99999 lines
- Maximum nested GOSUBs: 50 levels

#### Flow Control Guidelines
1. **Avoid excessive GOTOs** - Use structured constructs when possible
2. **Use meaningful labels** - MENU: instead of line 100
3. **Comment section dividers** - Use rows of asterisks or equals signs
4. **Group related code** - Keep subroutines near related functionality
5. **Consistent error handling** - Use ON ERROR for all error conditions

#### Loop Termination Patterns
```business-rules
! Pattern 1: Counter-based
00100 LET COUNT = 0
00110 LOOP_START: 
00120    LET COUNT = COUNT + 1
00130    PRINT COUNT
00140 IF COUNT < 10 THEN GOTO LOOP_START

! Pattern 2: Sentinel value
00200 INPUT_LOOP:
00210    PRINT "Enter value (negative to quit): ";
00220    INPUT VALUE
00230 IF VALUE >= 0 THEN GOTO INPUT_LOOP

! Pattern 3: User confirmation
00300 PROCESS_LOOP:
00310    GOSUB DO_PROCESSING
00320    PRINT "Continue? (Y/N): ";
00330    INPUT CONTINUE$
00340 IF UPRC$(CONTINUE$) = "Y" THEN GOTO PROCESS_LOOP
```

## Array Programming Examples

### Basic Array Operations

#### Working with One-Dimensional Arrays
```business-rules
00100 ! Declare and initialize arrays
00110 DIM STUDENTS$(30)*25, GRADES(30)
00120 MAT STUDENTS$ = ("")     ! Initialize all to empty
00130 MAT GRADES = (0)         ! Initialize all to zero

00200 ! Populate arrays with data
00210 FOR I = 1 TO 5
00220    INPUT "Enter student name: ": STUDENTS$(I)
00230    INPUT "Enter grade: ": GRADES(I)
00240 NEXT I

00300 ! Find average grade
00310 LET TOTAL = SUM(GRADES)
00320 LET COUNT = UDIM(STUDENTS$)
00330 LET AVERAGE = TOTAL / COUNT
00340 PRINT "Average grade:"; AVERAGE
```

#### Sorting Arrays
```business-rules
01000 ! Sort students by name
01010 DIM INDEX(30)
01020 MAT INDEX(5) = AIDX(STUDENTS$(1:5))
01030 PRINT "Students in alphabetical order:"
01040 FOR I = 1 TO 5
01050    PRINT STUDENTS$(INDEX(I)), GRADES(INDEX(I))
01060 NEXT I

01100 ! Sort by grades (descending)
01110 MAT INDEX(5) = DIDX(GRADES(1:5))
01120 PRINT "Students by grade (highest first):"
01130 FOR I = 1 TO 5
01140    PRINT STUDENTS$(INDEX(I)), GRADES(INDEX(I))
01150 NEXT I
```

#### Searching Arrays
```business-rules
02000 ! Search for a specific student
02010 INPUT "Enter name to search: ": SEARCH$
02020 LET POSITION = SRCH(MAT STUDENTS$, SEARCH$)
02030 IF POSITION > 0 THEN
02040    PRINT "Found:"; STUDENTS$(POSITION); "Grade:"; GRADES(POSITION)
02050 ELSE
02060    PRINT "Student not found"
02070 END IF

02100 ! Case-insensitive substring search
02110 LET POSITION = SRCH(MAT STUDENTS$, "^" & SEARCH$)
02120 IF POSITION > 0 THEN PRINT "Found (partial match):"; STUDENTS$(POSITION)
```

### Multi-Dimensional Arrays

#### Working with 2D Arrays (Matrices)
```business-rules
03000 ! Sales data: 12 months x 5 regions
03010 DIM SALES(12,5)
03020 MAT SALES = (0)

03100 ! Populate with sample data
03110 FOR MONTH = 1 TO 12
03120    FOR REGION = 1 TO 5
03130       LET SALES(MONTH,REGION) = INT(RND * 10000) + 5000
03140    NEXT REGION
03150 NEXT MONTH

03200 ! Calculate regional totals
03210 DIM REGIONAL_TOTAL(5)
03220 FOR REGION = 1 TO 5
03230    LET TOTAL = 0
03240    FOR MONTH = 1 TO 12
03250       LET TOTAL = TOTAL + SALES(MONTH,REGION)
03260    NEXT MONTH
03270    LET REGIONAL_TOTAL(REGION) = TOTAL
03280 NEXT REGION

03300 ! Find best performing region
03310 MAT INDEX = DIDX(REGIONAL_TOTAL)
03320 PRINT "Best region is #"; INDEX(1); "with sales of"; REGIONAL_TOTAL(INDEX(1))
```

#### Sorting Multi-Dimensional Arrays
```business-rules
04000 ! Sort 2D array by first column
04010 DIM DATA$(5,3)*20, WORK$(5)*20, INDEX(5)
04020 ! ... populate DATA$ ...

04100 ! Extract key column for sorting
04110 FOR I = 1 TO 5
04120    LET WORK$(I) = DATA$(I,1)  ! Use first column as key
04130 NEXT I

04200 ! Get sort index
04210 MAT INDEX = AIDX(WORK$)

04300 ! Create sorted array
04310 DIM SORTED$(5,3)*20
04320 FOR I = 1 TO 5
04330    FOR J = 1 TO 3
04340       LET SORTED$(I,J) = DATA$(INDEX(I),J)
04350    NEXT J
04360 NEXT I
```

### CSV File Processing

#### Reading CSV Files
```business-rules
05000 ! Read and parse CSV file
05010 DIM CSV_LINE$*1000, FIELDS$(1)*100
05020 OPEN #1: "NAME=data.csv,RECL=1000", DISPLAY, INPUT

05100 ! Read header line
05110 LINPUT #1: CSV_LINE$
05120 LET NUM_FIELDS = STR2MAT(CSV_LINE$, MAT FIELDS$, ",", "Q:TRIM")
05130 PRINT "Found"; NUM_FIELDS; "columns"

05200 ! Process data lines
05210 DO
05220    LINPUT #1: CSV_LINE$ EOF EXIT_READ
05230    LET STR2MAT(CSV_LINE$, MAT FIELDS$, ",", "Q:TRIM")
05240    ! Process fields...
05250    FOR I = 1 TO NUM_FIELDS
05260       PRINT "Field"; I; ":"; FIELDS$(I)
05270    NEXT I
05280 LOOP
05290 EXIT_READ: !
05300 CLOSE #1
```

#### Writing CSV Files
```business-rules
06000 ! Create CSV output
06010 DIM OUTPUT$*5000, DATA$(10)*50
06020 ! ... populate DATA$ ...

06100 ! Convert array to CSV string
06110 MAT2STR(MAT DATA$, OUTPUT$, ",", "Q")
06120 OPEN #2: "NAME=output.csv,RECL=5000,REPLACE", DISPLAY, OUTPUT
06130 PRINT #2: OUTPUT$
06140 CLOSE #2
```

### Dynamic Array Management

#### Resizing Arrays Dynamically
```business-rules
07000 ! Dynamic array growth
07010 DIM ITEMS$(1)*50, COUNT
07020 LET COUNT = 0

07100 ! Add items dynamically
07110 DO
07120    INPUT "Enter item (blank to stop): ": NEW_ITEM$
07130    IF NEW_ITEM$ = "" THEN EXIT DO
07140    LET COUNT = COUNT + 1
07150    MAT ITEMS$(COUNT)        ! Resize array
07160    LET ITEMS$(COUNT) = NEW_ITEM$
07170 LOOP

07200 ! Display all items
07210 PRINT "You entered"; COUNT; "items:"
07220 FOR I = 1 TO COUNT
07230    PRINT I; ":"; ITEMS$(I)
07240 NEXT I
```

### Array Best Practices

#### Efficient Array Processing
```business-rules
08000 ! Use MAT operations instead of loops when possible
08010 ! GOOD: Fast array initialization
08020 MAT VALUES = (0)

08030 ! AVOID: Slow loop initialization
08040 ! FOR I = 1 TO UDIM(VALUES)
08050 !    LET VALUES(I) = 0
08060 ! NEXT I

08100 ! Use subarray operations for partial processing
08110 MAT SUBSET(1:10) = FULL_ARRAY(51:60)

08200 ! Use SRCH for finding elements instead of loops
08210 LET FOUND = SRCH(MAT NAMES$, SEARCH_NAME$)

08300 ! Pre-size arrays when size is known
08310 DIM LARGE_ARRAY(10000)  ! Better than growing incrementally
```

#### Error Handling with Arrays
```business-rules
09000 ! Safe array searching
09010 LET POSITION = SRCH(MAT DATA$, TARGET$)
09020 IF NOT POSITION > 0 THEN  ! Works for both 0 and -1 return values
09030    PRINT "Not found"
09040 ELSE
09050    PRINT "Found at position"; POSITION
09060 END IF

09100 ! Bounds checking
09110 IF INDEX >= 1 AND INDEX <= UDIM(ARRAY$) THEN
09120    PRINT ARRAY$(INDEX)
09130 ELSE
09140    PRINT "Index out of bounds"
09150 END IF
```

## Practical Program Examples

### MILEAGE Program - Complete Example
This program demonstrates fundamental BR! concepts including INPUT, LET, variables, error handling, line labels, and comments.

```business-rules
00001 ! ========================================
00002 ! Program: MILEAGE
00003 ! Purpose: Calculate miles per gallon
00004 ! Date: Created in Chapter 3
00005 ! ========================================
00010 PRINT "Total number of miles?"
00020 INPUT MI CONV CONVRSN      ! MI = Number of miles
00030 PRINT "Number of gallons?"
00040 INPUT GAL CONV CONVRSN     ! GAL = Number of gallons  
00050 FORMULA: LET MPG = MI/GAL ! Calculate miles per gallon
00060 PRINT "Miles Per Gallon="; MPG
00070 STOP
00080 CONVRSN: PRINT "Please enter numbers, not letters."
00090 RETRY
```

**Key Concepts Demonstrated**:
- Line numbers (required for every statement)
- Comments using ! character
- PRINT statements for output
- INPUT statements with variables
- CONV error condition for handling conversion errors
- Line labels (CONVRSN:, FORMULA:) for meaningful references
- LET statement for calculations
- RETRY statement for error recovery

### Simple User Information Program
```business-rules
00010 PRINT "What is your first name?"
00020 INPUT NAME$
00030 PRINT "How old are you, ";NAME$;"?"
00040 INPUT AGE CONV 100
00050 PRINT NAME$;" is ";AGE;" years old."
00060 PRINT "Your age multiplied by three is";AGE*3
00070 STOP
00100 PRINT "Please enter a number for age"
00110 RETRY
```

### Area Calculation with Error Handling
```business-rules
00010 ! Calculate area of a circle
00020 PRINT "Enter radius of circle:"
00030 INPUT RADIUS CONV ERROR_HANDLER
00040 LET PI = 3.14159
00050 LET AREA = PI * RADIUS * RADIUS
00060 PRINT "Area of circle ="; AREA
00070 STOP
00080 ERROR_HANDLER: PRINT "Invalid input - please enter a number"
00090 RETRY
```

## Version 3.90 Enhancements Summary

### Major Features
- **Expanded Arrays**: Arrays can now use up to 512KB of memory (previously 64KB limit)
- **Expanded Program Size**: Maximum 32,000 lines (previously 4,100 lines)
- **Dictionary Size**: Increased to 2MB maximum (previously 64KB)
- **Extended Memory Use**: Sort and index operations utilize significantly more memory for better performance

### BTREE2 Index Facility
- 25-35% faster performance in shared file processing
- Built-in diagnostic capabilities with BTREE_VERIFY
- Enable with OPTION 22 in BRConfig.sys
- INDEX command keywords: VERIFY (audit structure), REORG (audit and rebuild if needed)

### User Interface Enhancements
- **Combo Box Graphic**: PRINT FIELDS with Q attribute adds dropdown arrow graphic
- **Hot Text**: Any FIELDS text can generate scancodes when double-clicked
- **Field Windowing**: Enter more text than displayed (e.g., 12 chars in 8-char field)
- **STATUS FONTS**: Lists installed fonts suitable for BR!

### File System Improvements
- **Long Filename Support**: Full Windows long filename support
- **30-bit File Locking**: Enables NFS and NetBui network locks
- **Read-Only Access**: Files opened INPUT now open read-only
- **FILENAMES Statement**: Controls case of newly created files
- **Enhanced Wildcards**: More Unix-like pattern matching

### Debugging Extensions
- **DISPLAY Command**: Shows variable values with line numbers (up to 240 chars)
- **BREAK Command**: Sets breakpoints on variables or lines
- **Extended Function Keys**: Ctrl-F1 to Ctrl-F4 for various step modes
- **RUN STEP NORESTORE/RESTORE**: Control screen refresh during debugging

### Date Handling
- **DAYS Function**: Can handle dates from year 1700 (using negative numbers)
- **Y2K Improvements**: Better handling of century determination

### Other Enhancements
- **DIR Command**: New flags -C (columnar), -W (wide), -L (long names), -B (bare)
- **COPY Command**: Creates .BAK before replacing programs
- **LOGGING Statement**: Enhanced with security levels and screen/file separation
- **RND Function**: Now accepts zero as seed value (fixed)
- **Multiple Sessions**: Maximum users increased to 999 (from 127)
- **Drive Statements**: Now require all four parameters for clarity

### Platform Support
- **WINDOS Model**: Native Windows 32-bit with DOS console
- **Unix Improvements**: Better color support, Ctrl-A honored, shell fixes
- **Installshield**: Option to retain existing BRConfig.sys during installation

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
3. **Use ! for comments** - More common than REM
4. **Abbreviations are common** - PR for PRINT, etc.
5. **Case doesn't matter** - Keywords can be any case
6. **Default string length is 18** - Use DIM to specify longer
7. **Arrays are 1-based** - First element is (1), not (0)
8. **Multiple statements per line** - Separate with :
9. **GOTO is acceptable** - Common in BR! programs
10. **Subroutines use GOSUB/RETURN** - Not CALL

## ScreenIO Library

### Overview
The ScreenIO Library is a Rapid Application Development (RAD) tool for BR! that enables creation of complex GUI interfaces and complete programs in a fraction of traditional development time. It provides an event-driven, modular system for building screen-based applications.

### Core Concepts

#### Screen Functions
A Screen Function is a self-contained program that can be:
- Chained to or PROCed to
- Run as a regular program
- Called as a library function from existing programs

Three main types of Screen Functions:
1. **Listview Screen Function** - Displays records from a data file with selection capability
2. **Add/Edit Screen Function** - Provides data entry/editing interface
3. **Menu/Simple Screen Function** - Menu systems and non-data interfaces

#### Basic Implementation
```business-rules
00100 LIBRARY "screenio": fnfm$, fnfm
00200 ! Call a screen and get string result
00300 LET RESULT$ = fnfm$("CUSTLIST")
00400 ! Call a screen and get numeric result  
00500 LET SUCCESS = fnfm("CUSTEDIT", CUSTKEY$)
```

### ScreenIO Function Reference

#### fnfm$ - String Return Function
Returns the key of the selected/edited record or blank if cancelled.

**Syntax:**
```business-rules
fnfm$(scrnname$ [; key$] [, row] [, col] [, parentkey$] [, parentwindow] [, displayonly] [, dontredolistview] [, recordval] [, MAT passeddata$] [, usemyf] [, MAT myf$] [, MAT myf] [, path$] [, selecting])
```

**Parameters:**
- `scrnname$` - Name of the screen to call (required)
- `key$` - Key of record to edit (blank for new record)
- `row, col` - Screen position (default: centered)
- `parentkey$` - Extra value for custom functions/filtering
- `parentwindow` - Parent window number (default: 0)
- `displayonly` - Display without passing control (0/1)
- `dontredolistview` - Skip listview refresh on return (0/1)
- `recordval` - Record number for editing by record
- `MAT passeddata$` - Custom data array to pass to screen
- `usemyf` - Use provided arrays instead of reading from disk (0/1)
- `MAT myf$`, `MAT myf` - String and numeric arrays for record data
- `path$` - FileIO path parameter
- `selecting` - Mode flag for screen behavior

#### fnfm - Numeric Return Function
Returns 1 if successful, 0 if cancelled, or numeric return value from screen.

**Syntax:**
```business-rules
fnfm(scrnname$ [; key$] [, row] [, col] [, parentkey$] [, parentwindow] [, displayonly] [, dontredolistview] [, recordval] [, MAT passeddata$] [, usemyf] [, MAT myf$] [, MAT myf] [, path$] [, selecting])
```

Parameters are identical to fnfm$.

#### fnDisplayScreen (Deprecated)
Use fnfm with displayonly parameter instead.

### Screen Events

#### Screen-Level Events
- **Enter Event** - Triggered when screen first displays
- **Initialize Event** - Triggered for new records (no key$ provided)
- **Read Event** - Triggered when reading initial record
- **Write Event** - Triggered before saving data
- **Mainloop Event** - Triggered on each RINPUT FIELDS iteration
- **Wait Event** - Triggered after keyboard idle timeout
- **Record Locked** - Triggered when record is locked
- **Exit Event** - Triggered when screen closes

#### Control Events
- **Filter Event** (Listviews) - Determines record inclusion
  - Return true/false for inclusion
  - Return HTML color code for row coloring
- **Validation Event** (Data controls) - Validates user input
  - TextBoxes, CheckBoxes, SearchBoxes, Radio Buttons, ComboBoxes
- **Click Event** (Non-data controls) - User interaction
  - Buttons, Pictures, Captions

### Event Implementation Examples

#### Filter Event for Listview
```business-rules
! In custom function for listview filter
DEF FNFILTER(MAT F$, MAT F)
    ! Include only active customers
    IF F$(CUST_STATUS) = "A" THEN
        LET FNFILTER = 1
    ELSE
        LET FNFILTER = 0
    END IF
FNEND
```

#### Validation Event
```business-rules
DEF FNVALIDATE$(VALUE$)
    ! Validate and format phone number
    LET PHONE$ = FNFORMATPHONE$(VALUE$)
    IF LEN(PHONE$) = 14 THEN
        LET FNVALIDATE$ = PHONE$
    ELSE
        LET FNVALIDATE$ = ""  ! Reject invalid
    END IF
FNEND
```

### Calling Screens from Screens
Within ScreenIO screens, call other screens using internal syntax:
```
[SCRNNAME]                          ! Simple call
[SCRNNAME]KEY$="123"                ! With key
[SCRNNAME(10,5)]                    ! With position
[SCRNNAME]PARENTKEY$="CUST001"      ! With parent key
[SCRNNAME]DISPLAYONLY=1             ! Display only mode
```

### Working with Multiple Data Files
For parent/child relationships (e.g., invoices with line items):

1. **Parent Listview Screen** - Lists all parent records
2. **Parent Add/Edit Screen** - Edits parent record
   - Links to child listview with DisplayOnly in Enter Event
3. **Child Listview Screen** - Lists child records
   - Filter by ParentKey$ to show only related records
4. **Child Add/Edit Screen** - Edits child records
   - Initialize with parent key in Initialize Event

### Configuration (screenio.ini)
```business-rules
! Default settings
SETTING_ENABLELOGGING=0
SETTING_FILEIOPATH$="fileio"
SETTING_SCREENIOPATH$="screenio"
SETTING_CLOCKPATH$="clocks\clock"
SETTING_IMAGEPATH$="images"
SETTING_SCREENFOLDER$="screenio"
SETTING_CLICKTOMOVE=1
SETTING_PREVIEWLISTVIEWS=1
SETTING_REALTIMEFILTERS=0
```

### ExitMode Values
Controls how screens exit and what actions to take:
- Cancel - User cancelled, no save
- Select - User selected/saved
- Custom modes defined in screen events

### Integration with FileIO
ScreenIO requires and builds upon the FileIO library:
- Automatic file handling
- No manual file opens/closes needed
- File layout changes handled automatically
- Data validation and formatting

### Best Practices
1. **Use meaningful screen names** - Makes maintenance easier
2. **Implement validation events** - Ensure data integrity
3. **Use filter events efficiently** - Can impact performance
4. **Pass ParentKey$ for related data** - Maintains relationships
5. **Handle locked records gracefully** - Implement Record Locked event
6. **Use DisplayOnly for preview** - Show without editing
7. **Batch screen calls when possible** - Better performance
8. **Return meaningful values** - Help calling programs
9. **Document custom events** - Maintainability
10. **Test event sequences** - Understand flow

## Commands

### Overview
Business Rules! commands are immediate-mode instructions that cannot be used as program statements (except with EXECUTE or in PROC). Commands manage the programming environment, file system, and program editing.

### Command vs Statement Distinction

#### Key Differences
- **Commands**: Execute immediately when typed and ENTER pressed
  - No line number required
  - Used for program management and environment control
  - Examples: DIR, LOAD, SAVE, RUN, LIST
- **Statements**: Instructions in a program that execute when RUN
  - Must have a line number (1-99999)
  - Stored in program memory until executed
  - Examples: PRINT, LET, INPUT, GOTO

#### Important Notes
- **Any statement can be run as a command** (without line number for immediate execution)
- **PRINT is assumed** if expression entered without command (e.g., `6+4` prints `10`)
- **Commands cannot be used in programs** (except with EXECUTE or in PROC)

### Command Processing Order

When you enter text without a line number, BR! processes it as follows:

1. **Check for line number**: If present, store as program statement
2. **Check for LET statement**: Process assignment and display result
3. **Check for command/immediate statement**: Execute immediately
4. **Default to PRINT**: Treat as variable or expression to print

**Examples of Default Processing**:
```
MI = 300        ! Acts as LET, assigns 300 to MI, prints result
MI              ! Prints current value of MI
NAME$           ! Prints current value of NAME$ (empty if unassigned)
123             ! Prints the number 123
a               ! Prints value of variable 'a' (0 if unassigned)
```

**Immediate Statements** (can run without line numbers):
- PRINT - Output data
- INPUT - Get user input  
- STOP - Halt execution
- LET - Assign values (LET keyword optional)

**Commands** (never use line numbers):
- SAVE - Save program
- LOAD - Load program
- RUN - Execute program
- CLEAR - Clear variables
- LIST - Display program
- REPLACE - Update saved program
- GO - Resume execution
- SYSTEM - Exit BR!
- DEL - Delete program line

### System Entry and Exit

#### BR Command
Enters Business Rules! from the operating system.

```bnf
BR [<instructions>] [-<id>] [-<filename>] [-<ref>]
```

Components:
- `<instructions>`: Any BR command/statement to execute at startup
- `-<id>`: Workstation ID (01-99) for multi-user systems
- `-<filename>`: Configuration file to use (default: BRConfig.sys)
- `-<ref>`: Additional reference parameter

Examples:
```
BR                           ! Start BR with defaults
BR CHAIN "SHOESALES"         ! Start BR and load program
BR -08                       ! Start with workstation ID 08
BR -CONFIG1                  ! Use CONFIG1 configuration file
BR "CHAIN SHOESALES -08 -CONFIG1"  ! Combined options
```

#### SYSTEM Command
Exits Business Rules! to operating system.

```bnf
SYSTEM | SY
```
- Must be in READY mode
- Properly closes all files
- Shortest abbreviation: SY

### File System Commands

#### CHDIR (Change Directory)
Changes or displays current directory.

```bnf
CHDIR [<drive>:][<path>] | CH | CD
```

Usage:
- Without parameters: displays current directory
- With path: changes to specified directory
- Cannot change drive and directory simultaneously

Examples:
```
CHDIR                        ! Display current directory
CHDIR CHAP9                  ! Change to CHAP9 subdirectory
CHDIR C:\                    ! Change to root of drive C
CHDIR \DATA\REPORTS          ! Absolute path
```

#### SORT Command
Sorts records in an internal file based on specifications in a control file.

```bnf
SORT <control-file-ref>
```

**Purpose**: Reorganize internal file records in specified order (ascending/descending) by one or more fields.

**Key Concepts**:
- **Sort Control File**: Internal file containing sort specifications
- **Input File**: Original data file to be sorted
- **Output File**: Result file with reorganized records
- **Multi-field sorting**: Up to 10 fields with individual sort orders
- **Record selection**: Include/exclude records based on criteria

**Sort Output Types**:
1. **Record Out Sort**: Complete records in new order
   - Same record length as input file
   - Contains full data in rearranged sequence
   
2. **Address Out Sort**: Relative record numbers in sorted order
   - Record length always 3 bytes (PD 3 format)
   - Used with relative access to read original file in sorted order
   - More space-efficient for large records

**Example Control File Setup**:
```business-rules
! Sort CUSTOMERS.INT by state (ascending), then sales (descending)
! Control file specifies:
! - Input file: CUSTOMERS.INT
! - Output file: CUSTOMERS.SRT
! - Sort field 1: State (positions 20-21, ascending)
! - Sort field 2: Sales (positions 30-39, descending)
```

**Usage Pattern**:
```business-rules
00100 ! Execute the sort
00200 SORT "CUSTOMER.SC"
00300 ! Now CUSTOMERS.SRT contains sorted records
```

**Address Out Sort Pattern**:
```business-rules
00100 SORT "CUSTOMER.SCA"    ! Creates address file
00200 OPEN #1: "NAME=CUSTOMERS.INT", INTERNAL, INPUT, RELATIVE
00300 OPEN #2: "NAME=CUSTOMERS.ADR", INTERNAL, INPUT, SEQUENTIAL
00400 !
00500 LOOP: READ #2, USING 600: RECNUM EOF DONE
00600 FORM PD 3
00700 READ #1, USING 800, REC=RECNUM: NAME$, AMOUNT
00800 FORM C 30, N 10.2
00900 PRINT NAME$, AMOUNT
01000 GOTO LOOP
01100 DONE: CLOSE #1: CLOSE #2:
```

**PRESORT Utility**:
- Interactive program to create sort control files
- Guides through specification of:
  - Input/output files
  - Sort fields and order
  - Record selection criteria
- Alternative to manually creating control files

**Performance Considerations**:
- Address out sorts faster for large record sizes
- Record selection speeds up sorting by reducing records processed
- Multiple concurrent sorts possible with different control files

#### DIR (Directory Listing)
Lists files and directories.

```bnf
DIR [<drive>:][<path>][<filename>] [-options] [PRINT] [><file-ref>]
```

**Options (3.90+ enhancements):**
- `-P`: Pause after each screen
- `-C`: Columnar sorted order with / for directories, * for executables
- `-W`: Wide format (across instead of down), sorted with long filenames
- `-L`: Show permissions on left, long filenames on right
- `-B`: Bare long filename display only
- `PRINT`: Send output to printer
- `><file-ref>`: Redirect output to file

**Notes:**
- Searches for both long and short (DOS) filename versions
- Honors FILENAMES configuration (UPPER_CASE, LOWER_CASE, MIXED_CASE)
- Correctly reports sizes on NTFS file systems over 2GB

Examples:
```
DIR                          ! List current directory
DIR -C                       ! Columnar sorted with type indicators
DIR -L                       ! Long filenames with permissions
DIR -W                       ! Wide format with long names
DIR *.BR -B                  ! Bare listing of BR files
DIR C:\DATA PRINT            ! Print directory listing
DIR >DIRLIST.TXT            ! Save listing to file
```

Wildcard characters:
- `*`: Matches any sequence of characters
- `?`: Matches any single character

#### MKDIR (Make Directory)
Creates a new directory.

```bnf
MKDIR [<drive>:]<path>
```

Path types:
- **Absolute**: Starts with \ (from root)
- **Relative**: No leading \ (from current directory)

Examples:
```
MKDIR TEST                   ! Create TEST in current directory
MKDIR \TEST                  ! Create TEST in root
MKDIR C:\DATA\REPORTS        ! Create with full path
MKDIR TEST\SUBTEST          ! Create nested directories
```

#### RMDIR (Remove Directory)
Removes an empty directory.

```bnf
RMDIR [<drive>:]<path>
```

Requirements:
- Directory must be empty
- Cannot remove current directory

Examples:
```
RMDIR TEST                   ! Remove TEST from current directory
RMDIR C:\DATA\OLD            ! Remove with full path
```

### System Commands

#### DATE Command
Sets or displays the system date.

```bnf
DATE [<mm/dd/yy>]
```

**Usage**:
- Without parameter: Displays current date in yy/mm/dd format
- With parameter: Sets system date (format: mm/dd/yy)
- Multi-user systems: Changes affect only current terminal
- Different from DATE$ function which only retrieves date

**Examples**:
```
DATE                    ! Display current date (e.g., 24/03/15)
DATE 12/25/24          ! Set date to December 25, 2024
```

#### TIME Command
Sets or displays the system time.

```bnf
TIME [<hh:mm:ss>]
```

**Usage**:
- Without parameter: Displays current time in hh:mm:ss format
- With parameter: Sets system time (24-hour format)
- Multi-user systems: Changes affect only current terminal
- Different from TIME$ function which only retrieves time

**Examples**:
```
TIME                    ! Display current time (e.g., 15:10:23)
TIME 15:10:00          ! Set time to 3:10:00 PM
TIME 08:30:00          ! Set time to 8:30:00 AM
```

**Important Notes**:
- DATE and TIME are commands for setting values
- DATE$ and TIME$ are functions for retrieving values
- Commands execute immediately without line numbers
- Functions used in program statements or expressions

### File Management Commands

#### COPY
Copies files to another location.

```bnf
COPY <from-file-ref> <to-file-ref> [-D] [-V] [-new_recl]
```

Options:
- `-D`: Omit deleted records (internal files)
- `-V`: Verify each file before copying (asks Y/N for each)
- `-new_recl`: Specify new record length (pads with spaces, not nulls)

**3.90+ Enhancements:**
- Preserves file modification times on Unix
- Proper verification prompting (N actually skips file)
- Programs copied to .BAK before replacing (recoverable if REPLACE fails)

Examples:
```
COPY FILE1.BR FILE2.BR       ! Simple copy
COPY C:\*.BR D:\BACKUP\*.BR   ! Copy all BR files
COPY DATA?.* BACKUP\DATA?.*  ! Copy with wildcards
COPY *.* D: -V               ! Copy all with verification
COPY DATA.DAT NEW.DAT -new_recl=100  ! Copy with new record length
```

#### RENAME
Renames or moves files.

```bnf
RENAME <current-file-ref> <new-file-ref> [-V]
```

Options:
- `-V`: Verify each rename operation

Usage:
- Can rename file or change location
- Supports wildcards for batch operations

Examples:
```
RENAME OLD.BR NEW.BR         ! Simple rename
RENAME C:\DATA\FILE.DAT D:\ARCHIVE\FILE.DAT  ! Move file
RENAME *.10 *.OLD -V         ! Batch rename with verification
```

#### DROP
Deletes file contents but preserves file name.

```bnf
DROP <file-ref> [-V]
```

Characteristics:
- File remains in directory listing
- Contents cannot be recovered
- File size becomes 0

Examples:
```
DROP TEMP.DAT                ! Drop single file
DROP *.TMP -V                ! Drop with pattern and verify
```

#### FREE
Completely deletes files.

```bnf
FREE <file-ref> [-V]
```

Warning:
- Files cannot be recovered
- Use -V option with wildcards

Examples:
```
FREE OLDFILE.BR              ! Delete single file
FREE *.BAK -V                ! Delete backups with verification
```

### Program Editing Commands

#### AUTO
Automatic line numbering for program entry.

```bnf
AUTO [<starting-line>] [<increment>]
```

Defaults:
- Starting line: 10
- Increment: 10

Auto-numbering stops when:
- Line number would exceed 99999
- ENTER pressed without statement
- Line number erased
- Cursor moved to different line

Examples:
```
AUTO                         ! Start at 10, increment by 10
AUTO 100                     ! Start at 100, increment by 10
AUTO 1000 50                 ! Start at 1000, increment by 50
```

#### RENUM
Renumbers program lines.

```bnf
RENUM [-<start-line>] [-<end-line>] [<first-line>] [<increment>]
```

Parameters:
- `-<start-line>`: Beginning of range to renumber
- `-<end-line>`: End of range to renumber
- `<first-line>`: New starting line number (default: 10)
- `<increment>`: Line number increment (default: 10)

Features:
- Updates all line references (GOTO, GOSUB, etc.)
- Can renumber entire program or range

Examples:
```
RENUM                        ! Renumber all, start 10, increment 10
RENUM 100 5                  ! Start at 100, increment by 5
RENUM -330 -480 500          ! Renumber lines 330-480 starting at 500
```

#### DEL (DELETE)
Deletes program lines from the current program in memory.

```bnf
DEL <line-number>                    ! Delete single line
DEL <start-line> <end-line>          ! Delete range of lines
DELETE <line-number> [<end-line>]    ! Full command name
```

**Abbreviation**: DE (minimum unique abbreviation)

**Parameters**:
- `<line-number>`: Single line to delete
- `<start-line> <end-line>`: Range of lines to delete (inclusive)

**Important Notes**:
- Changes are only in memory until SAVE or REPLACE
- Line numbers may have gaps after deletion (this is normal)
- Cannot be undone - save program first if unsure

**Examples**:
```
DEL 50                        ! Delete line 50
DEL 20 60                     ! Delete lines 20 through 60
DELETE 100                    ! Delete line 100 (full command)
```

#### CLEAR
Clears current program from memory.

```bnf
CLEAR
```

**Purpose**: Remove programs or stray program lines from temporary memory

**Best Practice**: Use CLEAR before starting a new program

**Important Notes**:
- All unsaved changes are lost
- Variables are reset to defaults
- Should be used before writing new programs
- LOAD command performs implicit CLEAR

#### NEWPAGE
Clears the screen.

```bnf
NEWPAGE
```

**Purpose**: Clean the display screen for fresh output

#### SAVE
Saves current program to disk.

```bnf
SAVE <filename> [SOURCE]
```

**Parameters**:
- `<filename>`: Name for the program file
- `SOURCE`: Save as text file (.brs) instead of binary (.br)

**Important Notes**:
- **Must use unique filename** - Error 4150 if file exists
- Default extension is .br (binary format)
- Use SOURCE option for external editor compatibility
- Always SAVE before exiting BR!

**Examples**:
```
SAVE GRANDMA                 ! Save as GRANDMA.br
SAVE MYPROG.BR              ! Explicit extension
SAVE MYPROG SOURCE          ! Save as text (MYPROG.brs)
```

#### LOAD
Loads a program from disk into memory.

```bnf
LOAD <filename> [SOURCE]
LO <filename>                ! Abbreviation
```

**Parameters**:
- `<filename>`: Program file to load
- `SOURCE`: Load from text file format

**Important Notes**:
- Automatically performs CLEAR first
- Program loaded but not displayed (use LIST to view)
- Program name appears in status line
- For .br or .wb files, extension optional
- Other extensions must be specified

**Examples**:
```
LOAD GRANDMA                 ! Load GRANDMA.br
LOAD GRANDMA.BAK            ! Load backup file
LOAD MYPROG SOURCE          ! Load from text format
```

#### REPLACE
Replaces existing file with current program.

```bnf
REPLACE [<filename>]
REP [<filename>]             ! Abbreviation
```

**Parameters**:
- `<filename>`: File to replace (optional if program already loaded)

**Important Notes**:
- Use when updating existing programs
- Creates .bak backup of original file
- Without filename, replaces currently loaded file
- Must specify full name for non-.br extensions

**SAVE vs REPLACE**:
- **SAVE**: Only works with new, unique filenames
- **REPLACE**: Updates existing files, creates backup

**Examples**:
```
REPLACE                      ! Replace current loaded file
REPLACE GRANDMA             ! Replace GRANDMA.br
REP MYPROG.BAK              ! Replace backup file
```

#### FREE
Deletes a file from disk.

```bnf
FREE <filename>
```

**Purpose**: Remove programs from directory

**Important Notes**:
- Opposite of SAVE command
- Must specify extension for non-.br files
- Shows file location after deletion
- Cannot be undone

**Examples**:
```
FREE GRANDMA                ! Delete GRANDMA.br
FREE GRANDMA.BAK           ! Delete backup file
```

#### LIST
Displays program lines.

```bnf
LIST [<line-range>]
LIS                          ! Abbreviation
```

**Display Format**:
- Line numbers padded to 5 digits
- Keywords converted to uppercase
- BR!'s preferred formatting applied

**Important Notes**:
- Can edit directly on listed lines
- Press ENTER on edited line to save changes
- Must LIST again after RUN to edit
- Cursor must be on edited line when pressing ENTER

**Examples**:
```
LIST                         ! List entire program
LIST 100                     ! List line 100
LIST 100-200                ! List lines 100-200
```

#### RUN
Executes the current program.

```bnf
RUN [<options>]
RU                           ! Abbreviation
```

**Purpose**: Execute program from beginning

**Important Notes**:
- Starts at lowest line number
- Continues until STOP, END, or error
- Variables reset to defaults
- Can RUN multiple times without reloading

#### STOP
Terminates program execution.

```bnf
STOP
STO                          ! Abbreviation
```

**Usage**:
- As statement in program (with line number)
- As command to halt running program

#### SYSTEM
Exits Business Rules!.

```bnf
SYSTEM
SY                           ! Abbreviation
```

**Important**: Always SAVE programs before using SYSTEM

#### DIR
Displays directory listing.

```bnf
DIR [<path>] [<options>]
```

**Options** (use with dash, e.g., DIR -P):
- `-A`: Files with archive bit on
- `-C`: Sorted columns with / for directories, * for executables
- `-D`: Bare long filename display
- `-L`: Show file permissions (Linux)
- `-O`: Sort alphabetically
- `-P`: Pause after each screen
- `-W`: Display in 4 columns

**Purpose**: List files to find programs, check disk space

**Examples**:
```
DIR                          ! Current directory
DIR -P                       ! With pause
DIR -O                       ! Sorted alphabetically
DIR C:\PROGRAMS -W           ! Specific path, wide format
```

### Debugging Commands

#### RUN with Debugging Options
Executes program with debugging features.

```bnf
RUN [STEP] [TRACE] [NORESTORE | RESTORE]
```

**Options:**
- `STEP` - Pauses after each statement execution
- `TRACE` - Prints line numbers as executed
- `STEP TRACE` - Combines both features
- `STEP NORESTORE` - Suppresses screen restoration after initial restore (3.90+)
- `STEP RESTORE` - Forces screen refresh before each step (Unix behavior)

**STEP Mode:**
- Program pauses after each line
- In STEP mode: GO means GO RUN, Enter means GO STEP
- Status line shows "STEP" and next line number
- Accept most BR! commands during pause
- Press Enter to execute next line
- In 4.3+, displays source statement before execution

Example:
```
RUN STEP                     ! Step through program
RUN TRACE                    ! Show execution flow
RUN STEP TRACE              ! Step with line numbers
```

**Input During STEP Mode:**
- STEP mode before INPUT: commands are executed
- During INPUT: data entry accepted
- Must press Enter to transition from STEP to INPUT mode

#### BREAK
Sets breakpoints and debugging options.

```bnf
BREAK <line-number> [<condition>]
BREAK OFF [<line-number>]
STATUS BREAK                ! Display all breakpoints
```

Examples:
```
BREAK 1000                   ! Break at line 1000
BREAK 1000 IF X>100         ! Conditional breakpoint
BREAK OFF 1000              ! Remove breakpoint
BREAK OFF                   ! Remove all breakpoints
STATUS BREAK                ! Show current breakpoints
```

#### DISPLAY
Shows variable values during execution.

```bnf
DISPLAY <variable-list>
DISPLAY OFF
```

Examples:
```
DISPLAY TOTAL,COUNT         ! Monitor variables
DISPLAY NAME$,ADDRESS$      ! Monitor string variables
DISPLAY OFF                 ! Stop monitoring
```

#### LIST with Search
Search for strings in program.

```bnf
LIST "<string>"             ! Case-sensitive search
LIST '<string>'             ! Case-insensitive search
LIST <line>-                ! List from line forward
LIST -<line>                ! List from line backward
LIST <start>,<end>          ! List range
```

Examples:
```
LIST "PRINT"                ! Find all PRINT statements
LIST 'error'                ! Find error/ERROR/Error
LIST 100-                   ! List from line 100
LIST -500                   ! List up to line 500
LIST 100,200               ! List lines 100-200
```

#### Variable Inspection
Check variable values during debugging.

From STEP mode or error mode:
```
PRINT <variable>            ! Display variable value
<variable>                  ! Quick display (shorthand)
```

Examples (in STEP mode):
```
PRINT TOTAL                 ! Shows: 1234.56
BALANCE                     ! Shows: 789.00
NAME$                       ! Shows: John Doe
```

#### READ and DATA for Test Automation
Automate data entry during debugging.

```bnf
DATA <value1> [,<value2>] [,...]
READ <variable1> [,<variable2>] [,...]
RESTORE                     ! Reset data pointer
```

**DATA Statement Characteristics:**
- Non-executable (skipped in normal flow)
- Combined into single data table before execution
- Pointer starts at first item
- Order determined by line numbers

Examples:
```business-rules
00100 DATA 456.98           ! Starting balance
00110 DATA 34.20,2.56,98.42,17.99,10.00,-99  ! Debits
00120 DATA 155.54,49.72,-99 ! Credits
00130 READ STARTBAL         ! Reads 456.98
00140 READ DEBIT           ! Reads 34.20
00150 READ DEBIT           ! Reads 2.56
```

**Multiple DATA Statements:**
- All combined into single table
- Order by line number
- No limit on items per statement (800 char max)
- No limit on number of DATA statements

**RESTORE Statement:**
```business-rules
00200 RESTORE              ! Reset pointer to first item
00210 READ FIRSTVAL        ! Re-read first value
```

#### LOGGING Configuration
Enable detailed logging for debugging.

```bnf
LOGGING <loglevel>, <logfile> [, UNATTENDED] [, DEBUG_LOG_LEVEL=<int>] [, +CONSOLE]
```

**Log Levels (3.90i+):**
| Level | Name | Description |
|-------|------|-------------|
| 0 | MAJOR_ERROR | Causes major problems during execution |
| 1 | NOTABLE_ERROR | Unexpected error likely to cause problems |
| 2 | MINOR_ERROR | Unexpected error that can be ignored |
| 3 | MAJOR_EVENT | Starting program, exiting, shelling |
| 4 | SECURITY_EVENT | Logons, logon attempts |
| 5 | MINOR_EVENT | Individual commands |
| 9 | DEBUGGING_EVENT | Added for debugging purposes |

Higher levels include all lower levels.

**3.90i+ Behavior:**
- Config messages after LOGGING statement sent only to logfile (mostly NOTABLE_ERROR)
- Avoids displaying REMmed statements to operators
- Config messages before LOGGING sent only to screen with pause for viewing

Configuration Example (BRConfig.sys):
```
LOGGING 5, debug.log        ! Log all events
LOGGING 9, trace.log        ! Maximum debugging detail
```

#### Extended Debugging Features (3.90+)

##### DISPLAY Command
Shows variable values after changes with associated line numbers:
```bnf
DISPLAY <variable> | ALL [OFF | PRINT] [>filename]
```

**Output Format:**
```
line-number variable-name new-value
```

**Features:**
- Displays up to 240 characters of data (expanded from 80)
- Can redirect output to file
- Shows changes as they occur during execution

##### BREAK Command
Sets breakpoints on variables or lines:
```bnf
BREAK <variable> | <line> | <label>: [OFF]
```

**Behavior:**
- Enters step mode when variable changes or line is reached
- Can be active with DISPLAY on same variable
- Generates errors 1006 and 1070 for invalid commands

##### Extended Function Key Stepping (Ctrl-F1 to Ctrl-F4)
- **Ctrl-F1**: Step Into Clause - Processes only next clause
- **Ctrl-F2**: Step Over Clause - Processes clause plus called routines
- **Ctrl-F3**: Step Into Line - Processes to next line number
- **Ctrl-F4**: Step Over Line - Processes line plus called routines

**Note**: Higher F-key numbers = larger scope of step

#### Debugging Best Practices

**Finding Calculation Errors:**
1. Check mathematical formulas in LET statements
2. Use RUN STEP to monitor execution
3. Print variable values at key points
4. Verify data types (numeric vs string)

**Common Debugging Patterns:**
```business-rules
! Step through specific section
00500 ! Start debugging here
00510 LET DEBUG=1
00520 IF DEBUG THEN PRINT "X=";X,"Y=";Y
00530 LET RESULT=X*Y
00540 IF DEBUG THEN PRINT "RESULT=";RESULT
```

**Using DATA for Test Cases:**
```business-rules
! Test data for debugging
90000 DATA "Test1",100,200
90010 DATA "Test2",300,400
90020 DATA "END",-1,-1
```

**Error Mode Commands:**
During error mode, you can:
- LIST program lines
- PRINT variable values
- Check STATUS
- Use RETRY to re-execute
- Use CONTINUE to proceed
- Use END/STOP to terminate

### Information Commands

#### DATE
Displays or sets system date.

```bnf
DATE [<mm/dd/yyyy>]
```

#### TIME
Displays or sets system time.

```bnf
TIME [<hh:mm:ss>]
```

#### HELP
Displays help information.

```bnf
HELP [<topic>]
```

### File Reference Syntax

#### Complete File Reference
```bnf
<file-ref> ::= [<drive>:][<path>]<filename>[.<ext>]
```

Components:
- `<drive>:` - Drive letter with colon (A: through Z:)
- `<path>` - Directory path with backslashes
- `<filename>` - 1-8 characters (longer names truncated)
- `.<ext>` - Optional 3-character extension

Path Types:
- **Absolute**: `\DIR\SUBDIR\FILE.EXT` (starts from root)
- **Relative**: `SUBDIR\FILE.EXT` (from current directory)

### Wildcard Usage

#### Wildcard Characters
- `*` - Matches zero or more characters
- `?` - Matches exactly one character

Examples:
```
*.BR         ! All files with .BR extension
CHAP?.DAT    ! CHAP1.DAT, CHAP2.DAT, etc.
DATA*.*      ! All files starting with DATA
*.*          ! All files
```

### Best Practices

1. **Always use -V with wildcards** - Prevents accidental operations
2. **Save before using editing commands** - CLEAR, DEL cannot be undone
3. **Use absolute paths for critical operations** - Avoids confusion
4. **Verify directory before MKDIR** - Prevents duplicate attempts
5. **Check if directory empty before RMDIR** - Command will fail otherwise
6. **Use AUTO for new programs** - Reduces typing errors
7. **RENUM periodically** - Maintains clean line numbering
8. **Backup before FREE/DROP** - Operations cannot be reversed
9. **Test wildcards with DIR first** - Verify pattern matches
10. **Exit with SYSTEM** - Ensures proper file closure

## Procedures

### Overview
A **procedure file** is a text file containing a list of commands and/or programs to run in order. It is executed using the PROC command. Procedures provide a programming system including common elements like lists of instructions, conditional and unconditional branching, line labels, looping capability, sub-procedures (similar to subroutines), input/output capabilities, comment lines and end-of-line comments.

### Key Characteristics
- **File Type**: ASCII text file (DISPLAY file)
- **Creation**: Can be created with any text editor or from within BR!
- **Comments**: Lines beginning with `!` or end-of-line comments after `!`
- **Line Labels**: Begin with colon `:` for branching targets
- **Line Format**: No line numbers required
- **One Command Per Line**: Each line contains exactly one command
- **Execution**: Commands execute sequentially with branching capability
- **Line Length**: Up to 800 characters per line
- **Number of Lines**: Unlimited
- **Self-Deleting**: Files with .$$$ extension automatically delete after execution

### Creating and Editing Procedures

#### Method 1: External Text Editor
1. Create a new text file with any editor (Notepad, EditPad Pro, vi, etc.)
2. Type commands exactly as you would at the keyboard
3. Save with any extension (commonly .txt or no extension)
4. Use word processors only if they can read/write standard ASCII text

#### Method 2: From Within BR!
Write a BR! program to OPEN a DISPLAY file and PRINT lines of text:
```business-rules
00100 OPEN #1: "name=STARTUP.PRO,recl=800", DISPLAY, OUTPUT
00110 PRINT #1: "! Startup procedure"
00120 PRINT #1: "LOAD MENU"
00130 PRINT #1: "RUN"
00140 CLOSE #1:
```

#### Example: Single-User System
```
! Procedure to remove deleted records on single-user system
COPY CUST.FIL TEMP.FIL -D
FREE CUST.FIL
RENAME TEMP.FIL CUST.FIL
RUN MENU
```

#### Example: Multi-User System
```
! Procedure to remove deleted records on multi-user system
PROCERR RETURN
PROTECT CUST.FIL,RESERVE
PROCERR STOP
SKIP BUSY IF ERR<>0
!
COPY CUST.FIL TEMP[WSID].FIL -D
FREE CUST.FIL
RENAME TEMP[WSID].FIL CUST.FIL
PROTECT CUST.FIL,RELEASE
SKIP DONE
!
:BUSY
ALERT File is busy, try again later -type GO for menu
!
:DONE
RUN MENU
```

### Starting Procedures

#### Method 1: PROC Command
```bnf
PROC {ECHO|NOECHO|<proc name>|*<proc name>}
```
- Opens and begins execution of a procedure file
- Automatically closes most recently executed active procedure before opening new one
- Asterisk (*) prevents F2 logging of commands within procedure
- **ECHO**: Reverses PROC NOECHO effects
- **NOECHO**: Prevents procedure lines from being displayed on screen

Examples:
```
PROC B:PROCNAME
PROC *START           ! Prevents F2 logging
PROC ECHO            ! Resume displaying commands
PROC NOECHO          ! Hide command display
```

#### Method 2: SUBPROC Command
```bnf
SUBPROC <filename>[.<ext>]
```
- Temporarily suspends most recent procedure
- Starts new procedure, then resumes calling procedure when complete
- Creates nested procedure (up to 9 levels, P1-P9 shown in status line)
- Does not cancel currently active procedures

#### Method 3: CHAIN Statement from Program
```business-rules
00900 CHAIN "proc=DAILY"        ! Ends program, cancels active procedures
00920 CHAIN "subproc=DAILY"     ! Ends program, suspends active procedures
```

#### Method 4: EXECUTE Statement from Program
```business-rules
04200 EXECUTE "PROC DAILY"      ! Starts procedure without ending program
04300 EXECUTE "SUBPROC DAILY"   ! Line 4200 cancels recent procedure; 4300 doesn't
```

#### Method 5: BR Command Line
From operating system:
```
BR "PROC DAILY"

### Stopping Procedures

#### CTRL-A Interrupt
Press CTRL-A to enter ATTN mode, then use:

#### CLEAR PROC Command
```bnf
CLEAR PROC | CL PRO
```
- Ends current program (if any)
- Closes all active procedure files
- Leaves memory unchanged (useful for debugging)

#### CLEAR ALL Command
```bnf
CLEAR ALL | CL A
```
- Ends current program (if any)
- Closes all active procedure files
- Clears memory

#### PROC Command
Executing another PROC command closes all previous procedure files.

### Special Procedure Commands

#### ALERT Command
```bnf
ALERT [<message>]
```
- Suspends procedure execution
- Beeps and displays message
- Waits for operator response
- Type GO to continue or CLEAR PROC to stop

Example:
```
ALERT Put payroll checks in printer, then type GO
```

#### PROCERR Command
```bnf
PROCERR {STOP|RETURN}
```
Controls error handling in procedures:
- **PROCERR STOP** (default): Procedure stops when error occurs
- **PROCERR RETURN**: Procedure continues to next command on error

Common pattern with FREE command:
```
PROCERR RETURN
FREE HISTORY.DAT
PROCERR STOP
```

#### SKIP Command
```bnf
SKIP <number> [IF <condition>]
SKIP <label> [IF <condition>]
```
Branches within a procedure by skipping lines.

**Conditional Skip**:
```
SKIP 4 IF ERR=0
SKIP NOHISTORY IF ERR
```

**Unconditional Skip**:
```
SKIP 2
SKIP DONE
```

**Using Labels**:
```
LOAD PROG1
RUN
SKIP NOHISTORY IF ERR
ALERT Insert HISTORY CD in Drive D: -- type GO
LOAD PROG2
RUN
:NOHISTORY
SKIP DONE
LOAD PROG3
RUN
:DONE
```

Label rules:
- Must begin with colon (:)
- Must be on separate line
- Nothing else allowed on label line

#### RUN PROC Command
```bnf
RUN PROC
```
Modifies program execution so INPUT/LINPUT/RINPUT statements read from procedure file instead of keyboard.

**Limitations**:
- Cannot be used with INPUT FIELDS or RINPUT FIELDS
- Must provide exact number of input lines expected

Example:
```
LOAD GLTRANSF      ! Program expects menu choice
RUN PROC           ! Use input from next line
1                  ! Menu option to select
LOAD NEXTPROG
RUN
```

### Procedure Flow Control

#### Sequential Execution
Commands execute in order from top to bottom until:
- End of file reached
- Error occurs (if PROCERR STOP)
- CLEAR PROC command
- Another PROC command

#### Nested Procedures
- SUBPROC creates nested procedure
- Up to 9 levels of nesting
- Returns to calling procedure when complete
- Flow similar to GOSUB in programs

#### Error Handling Flow
1. With PROCERR STOP (default):
   - Error stops procedure
   - System beeps
   - Control returns to keyboard
   
2. With PROCERR RETURN:
   - Error registered in ERR variable
   - Execution continues with next command
   - No beep or message

### Common Procedure Patterns

#### Automated Monthly Processing
```
! Monthly closing procedure
PROCERR RETURN
FREE TEMPFILE.DAT      ! Remove if exists
PROCERR STOP
LOAD MONTHEND1
RUN
LOAD MONTHEND2
RUN
ALERT Confirm ready to clear files, type GO to continue
LOAD CLEARFILES
RUN
```

#### Menu-Driven Procedure
```
LOAD MAINMENU
RUN PROC
1                      ! Select option 1
LOAD PROCESS1
RUN
SUBPROC BACKUP         ! Run backup procedure
LOAD MAINMENU
RUN PROC
9                      ! Select exit option
```

#### Conditional Processing
```
LOAD VALIDATE
RUN
SKIP ERROR IF ERR
LOAD PROCESS
RUN
SKIP DONE
:ERROR
ALERT Validation failed! Check data and restart
:DONE
```

### Best Practices

1. **Always Comment**: Document purpose and author
2. **Use PROCERR Wisely**: Return for expected errors, Stop for unexpected
3. **Test Thoroughly**: Procedures can't be debugged interactively
4. **Use Labels**: More maintainable than counting lines
5. **Backup Data**: Procedures can modify many files quickly
6. **Clear Documentation**: Help operators understand alerts
7. **Modular Design**: Use SUBPROC for reusable components

### Common Use Cases

1. **End-of-Period Processing**: Run multiple programs in sequence
2. **System Startup**: Initialize environment and load main menu
3. **Batch Operations**: Process multiple files without intervention
4. **Report Generation**: Run series of reports with proper setup
5. **Data Maintenance**: Backup, reorganize, and validate files
6. **Testing Automation**: Run test programs with predetermined inputs

### Express Procedures

Express procedures are procedures executed during the middle of running a program. When completed, the program resumes where it left off with all variables unchanged.

#### Types of Express Procedures

1. **Executed Express Procedures**
   - Started from a program with EXECUTE statement
   - Contains PROC or SUBPROC command
   - Implies NOECHO during execution
   - Commands not displayed on screen

2. **Operator-Initiated Express Procedures**
   - Started by operator during program interruption
   - PROC treated like SUBPROC (doesn't cancel active procedures)
   - Useful for debugging and inspection

#### Express vs Standard Procedures

**Invisible Execution**:
- Commands invoked by EXECUTE not displayed (PROC NOECHO implied)
- If error occurs or ALERT encountered, press F2/F3 to view command
- After completion, display returns to previous state

**Error Processing**:
- Normal PROCERR rules apply
- Errors in executed procedures return to EXECUTE statement
- ERROR condition catches any error including syntax errors
- GO resumes in priority: express procedure → program → active procedure

**Subordination**:
- Express procedures subordinate to current program
- Commands ending program remove subordinate relationship
- Program-ending commands: CLEAR, LOAD, RUN, CHAIN, END, STOP

Example:
```business-rules
01200 EXECUTE "clear proc only" ! Clears procedures above program
```

### Self-Deleting Procedures

Procedures with .$$$ extension automatically delete themselves after execution.

**Sequence of Events**:
1. BR executes procedure up to last line
2. Reads last line
3. Closes and deletes procedure file
4. Executes last line

**Important**: Avoid error-prone commands on last line since file is deleted before execution.

Example:
```
! TEMP.$$$ - Self-deleting temporary procedure
LOAD PROCESS
RUN
FREE TEMPDATA.DAT
! This file deletes itself after completion
```

### Procedure Syntax Rules

#### Blank Lines
Allowed and ignored during execution.

#### Commands
- Only one command per line
- Line length up to 800 characters

#### Comments
- Begin line with `!` for comment line
- Add `!` after command for end-of-line comment

#### Line Labels
- Must begin with colon `:`
- Made up of letters, digits, underscores
- Up to 800 characters long
- May be alone on line or followed by command (with spaces)

Example:
```
:START
LOAD MENU
RUN
:ERROR_HANDLER
ALERT Error occurred - check data
```

#### Data for RUN PROC
- Must be coded exactly as keyboard input
- Include all commas, quotation marks, etc.
- Each INPUT/LINPUT/RINPUT matched to single line
- Too many lines: procedure attempts to interpret as commands
- Too few lines: procedure expects keyboard input

#### Statements in Procedures
- Can be entered as in programs (with line numbers)
- Can be entered without line numbers (executed like commands)

#### Last Line Special Rules
- Cannot be SKIP or RUN PROC (procedure closes before execution)
- Should not be error-prone command
- Can be comment or blank line to keep procedure open

### Technical Considerations

1. **File Counting**: Each open procedure counts against OS open file limit
2. **Look-Ahead Feature**: BR closes procedure before executing last line
3. **Procedure Stacking**: Eliminated when last line is SUBPROC, RUN, or single command
4. **PROC NOECHO**: F2/F3 can recall error-causing command
5. **ALERT with NOECHO**: Must press F2/F3 to view message
6. **STATUS Command**: Displays names of all active procedures
7. **Status Line**: Shows P1-P9 for nesting level

### Procedure Termination Rules

#### PROC Command Behavior
- Cancels most recently activated procedure
- Substitutes new procedure
- Terminates any RUN PROC input mode

#### SUBPROC Command Behavior  
- Maintains procedure hierarchy
- RUN PROC stays active across SUBPROCs
- Returns to calling procedure when complete

#### EXECUTE Statement Behavior
- "EXECUTE 'PROC XYZ'" cancels last procedure
- "EXECUTE 'SUBPROC XYZ'" preserves hierarchy
- Both continue program after completion (unless new program loaded)

### Limitations

1. Cannot use with full-screen INPUT FIELDS
2. No interactive debugging
3. Must match exact input expectations
4. No conditional logic beyond SKIP
5. Cannot pass parameters between procedures
6. Limited to 9 nesting levels
7. Some commands not available (e.g., AUTO)

## Configuration (BRConfig.sys)

### Overview
The Business Rules! configuration file (BRConfig.sys) contains environmental specifications that support standards across multiple operating environments. BR automatically accesses this file at startup. Line length is limited to 800 characters.

### File Location and Loading
```
BR32.exe                    ! Searches for BRConfig.sys or WBConfig.sys
BR32.exe -C myconfig.sys   ! Use alternate config file
```

### Environment Variables
All BRConfig.sys specifications accept environment variables:
```
%USERNAME%                  ! Substituted with OS environment variable
DRIVE C:,%USERPROFILE%\data,,
```

### Core Configuration Specifications

#### Drive Mapping
Maps logical drives to physical paths for portability:
```bnf
DRIVE <drive-letter>[:], <server-full-pathname>, [<client-full-pathname>], [<subdirectory-name>]
```
Examples:
```
DRIVE C:,F:\MYAPP,SERVER-2,\PRL
DRIVE D:,\\MYSERVER\SHARE,,\DATA
DRIVE E:,%USERPROFILE%\BR_DATA,,
```

#### Attribute Substitution
Defines reusable attribute combinations:
```bnf
ATTRIBUTE [<name>] <attributes> [<defined-name>]
```
Examples:
```
ATTRIBUTE [X]U/RGB:B                          ! Underline or blue background
ATTRIBUTE [ERROR]R/RGB:R                      ! Red on red background
ATTRIBUTE [hilite_text]/#00FF00:#000000,font=arial:slant:max
ATTRIBUTE [W][X]                              ! Copy X attributes to W
```

Standard subattribute assignments:
- [E] - Error window
- [I] - Information/Dialog
- [M] - Menu
- [S] - Selection
- [W] - Normal window
- [A] - Cursor bar
- [B] - Selected item (no cursor)
- [C] - Cursor on selected item

#### Screen Attributes
```bnf
SCREEN <type> [<attribute-name>], <type> [<attribute-name>]...
```
Types: N (Normal), U (Underline), R (Reverse), B (Blink), H (Highlight)

Example:
```
SCREEN N [lime_black], U [orange_white], R [XX]
```

#### Font Configuration
```bnf
FONT [ASPECT=n/d] [<fontname>] [3DFONT=<fontname>]
SCREEN OPENDFLT FONT=<font>, FONT.TEXT=<font>, FONT.LABELS=<font>, FONT.BUTTONS=<font>
```

**FONT ASPECT (3.83h+):**
- Permits alteration of window's aspect ratio (height versus width)
- Character width = n × height ÷ d (in pixels)
- Syntax: `FONT ASPECT=n/d [fontname]`

Font qualifiers: family (Roman, Swiss, Modern), boldness (Light, Bold), style (Ital, Slant), underline (Under), size (Small, Medium, Large, Max)

Example:
```
FONT Arial
SCREEN OPENDFLT FONT.TEXT=Arial:bold, FONT.LABELS=Terminal
```

#### Color Shortcuts
```bnf
COLOR [<label>] <#hex-color or name>
```
Example:
```
COLOR [WARNING]#FFFF00
COLOR [ERROR]#FF0000
```

#### Base Year for Date Processing
```bnf
BASEYEAR <year>
```
Sets the 100-year window for DAYS function (default 1900):
```
BASEYEAR 1950   ! Dates 00-49 = 2000-2049, 50-99 = 1950-1999
```

#### Application Settings
```bnf
APPLICATION_NAME <name>
LOGIN_NAME$ <default-login>
EXECUTE "<command>"
EDITOR "<path-to-editor>" [REMOVE] [NOWAIT]
```

#### File and Path Settings
```bnf
BRSERVER <path>
FILENAMES {UPPER_CASE|LOWER_CASE|MIXED_CASE} [SEARCH]
PRINTDIR <path> [+DATE] [+TIME] [+LOGIN_NAME] [+CHANNEL] [\LOGIN_NAME] [RAW]
WORKDIR <path>
```

**FILENAMES Statement (3.90+):**
- Controls appearance of newly created files
- `UPPER_CASE`: Creates files in uppercase
- `LOWER_CASE`: Creates files in lowercase (default)
- `MIXED_CASE`: Uses NAME= string unmodified
- `SEARCH`: On Unix, permits case-insensitive search when no exact match found
- Unix defaults to case-sensitive, DOS/Windows to case-insensitive

#### Input/Output Settings
```bnf
DECIMAL {ASSUMED|REQUIRED}
DATAHILITE {ON|OFF}
INSERT {ON|OFF}
FIELDBREAK MIN_SPACES <n> [,UNDERSCORE OFF]
```

#### Memory and Performance
```bnf
FLOWSTACK <size>          ! GoSub/Function stack (default 100)
FORSTACK <size>           ! For/Next variable stack (default 100)
MAX_SORT_MEMORY <n> MB
BREAK <lines>             ! Check keyboard every n lines (default 8)
```

#### Collating Sequence
```bnf
COLLATE {NATIVE|ALTERNATE}
```
- NATIVE: ASCII order (numbers before letters)
- ALTERNATE: EBCDIC-like (numbers after letters)

#### Include Files
```bnf
INCLUDE <filename>
```
Includes another configuration file's settings.

#### Printer Configuration
```bnf
PRINTER TYPE <type-name> SELECT <printer-substring>
PRINTER [<type>] INIT [HP] [LPP <n>], "<escape-sequence>"
PRINTER [<type>] RESET, "<initialization-string>"
PRINTER [<type>] [<mode>], "<escape-sequence>"
```

Printer statements control printer initialization and formatting:
```
! Define printer types
PRINTER TYPE HPLASER SELECT "HP Laser"
PRINTER TYPE EPSONDOT SELECT "Epson"

! Initialize printers
PRINTER HPLASER INIT LPP 66, "\E&k2G\E(s10H\E&l6D\E&l0O"
PRINTER EPSONDOT INIT LPP 66, "\E@"

! Define mode settings
PRINTER HPLASER [BOLD+], "\E(s3B"
PRINTER HPLASER [BOLD-], "\E(s0B"
PRINTER HPLASER [LANDSCAPE], "\E&l1O"
PRINTER HPLASER LPP 66 [COLS=132], "\E(s16.66H"
```

#### Spooling Configuration
```bnf
SPOOLCMD [@] [-w] <command> [SPOOLFILE] [COPIES] [PRINTQUEUE]
SPOOLPATH [@:] <directory>
```

Controls print spooling:
```
SPOOLCMD COPY [SPOOLFILE] "\\server\printer"
SPOOLPATH C:\TEMP\SPOOL
SPOOLPATH @ C:\CLIENT_SPOOL   ! Client-side spool path
```

#### PrintScreen Settings
```bnf
PRINTSCREEN {GUI | PRN:/<printer>}
```
Controls screen printing behavior:
```
PRINTSCREEN GUI                ! Graphical printscreen
PRINTSCREEN PRN:/SELECT        ! User selects printer
```

#### Option Settings
```bnf
OPTION <number> [ON|OFF]
```
Common options:
- 18: Ignore Century values where century is omitted from date format mask (Y2K)
- 23: Exclude data errors from IOERR conditions (advances record pointer on CONV errors)
- 24: OPEN #... REPLACE causes any existing target file to be removed and created instead of truncated (Y2K workaround for Novell 4.11/4.2)
- 29: Save as .WB instead of .BR files
- 31: Suppress Native Windows Printing (NWP)
- 33: Use CR/LF for line endings
- 34: DIR command returns error if no files match
- 38: Prevent scientific notation
- 49: Show all fields even if protected
- 50: Allow duplicate key values in B-tree files
- 56: Error on numeric overflow

#### Substitute Paths
```bnf
SUBSTITUTE <search-path>:<replacement-path>
```
Example:
```
SUBSTITUTE C:\OLD:D:\NEW
```

#### Field Help Configuration
```bnf
FIELDHELP N=<attributes>, BORDER=<border-spec>
```
Border types: S (single), D (double), B (blank), H (highlighted)

#### GUI Settings
```bnf
GUI {ON|OFF}
FORCE_VISIBILITY {ON|OFF}
GRAPHIC_LINEDRAW {ON|RAISED|SUNKEN|OFF}
PICTURE CACHE_{ON|OFF}
```

#### BR! 4.30+ Configuration Statements

**Logging (Enhanced):**
```bnf
LOGGING <loglevel>, <native-OS-logfile> [, UNATTENDED] [, DEBUG_LOG_LEVEL=<int>] [, +CONSOLE]
```
Log levels: 0-13 (0=MAJOR_ERROR to 13=detailed debugging)

**Client-Server Reconnect:**
```bnf
CLIENT_SERVER RECONNECT_AFTER=<seconds> RECONNECT_TIME=<max-seconds>
```
Example: `CLIENT_SERVER RECONNECT_AFTER=20 RECONNECT_TIME=120`

**Date Picker Control:**
```bnf
DATE [ALWAYS|INVALID|NEVER]
```
Controls when date picker appears in DATE input fields

**HTTPS Configuration:**
```bnf
CONFIG HTTPS <port-number> [LOG <file-pathname>] [CERT=<cert-file-basename>]
```

**Filter Delimiters:**
```bnf
FILTER_DELIMITERS "<delimiter-string>"
```
Characters that trigger search in FILTER fields

**Platform-Specific Configuration:**
```bnf
@LINUX <config-statement>
@WINDOWS <config-statement>
@MAC <config-statement>
@ODBC <config-statement>
```
Apply configuration only on specified platform

**New Options (4.30+):**
- OPTION 66: Private key encryption password
- OPTION 68: Disable font stretching
- OPTION 70: Browser security mode (OFF|ON|RELAXED)

#### Logging Configuration
```bnf
LOGGING <filename>, {APPEND|REPLACE}, [loglevel]
LOGLEVEL <level>
```
Log levels:
- ALERT: Critical issues requiring immediate attention
- WARNING: Potential problems
- NOTICE: Normal but significant events
- INFO: Informational messages
- DEBUG: Detailed diagnostic information

### Dynamic Configuration
Most specifications can be changed at runtime:
```business-rules
00100 EXECUTE "CONFIG ATTRIBUTE [X]R/RGB:G"
00110 EXECUTE "CONFIG BASEYEAR 2000"
00120 EXECUTE "CONFIG DECIMAL REQUIRED"
```

### User-Specific Configuration
Prefix any specification with @login_name for user-specific settings:
```
@jsmith EDITOR "C:\Program Files\MyEditor\editor.exe"
@admin LOGLEVEL DEBUG
```

### Viewing Current Configuration
```business-rules
STATUS CONFIG          ! Display all current settings
STATUS ATTRIBUTES      ! Display attribute definitions
STATUS FONTS          ! Display available fonts (3.90+: lists fonts suitable for BR!)
STATUS COLORS         ! Display color definitions
STATUS STACKS         ! Display stack settings
STATUS FILES          ! Shows all four parameters of drive statement (3.90+)
STATUS LOCKS          ! Display file/record locks (3.90+: safer after failed COPY)
```

### Common Configuration Patterns

#### Development Environment
```
LOGLEVEL DEBUG
OPTION 23 OFF         ! Show line numbers in errors
GUI ON
FORCE_VISIBILITY ON
EDITOR "C:\Program Files\Notepad++\notepad++.exe"
```

#### Production Environment
```
LOGLEVEL WARNING
OPTION 23 ON          ! Hide line numbers
GUI ON
DECIMAL REQUIRED
LOGGING logfile.txt, APPEND, WARNING
```

#### Cross-Platform Setup
```
FILENAMES LOWER_CASE  ! Consistent between Windows/Linux
DRIVE C:,%APPDATA%\MyApp,,
DRIVE D:,\\SERVER\Share,,\DATA
```

## External Editors

### Overview
External editors provide enhanced editing capabilities for BR! programs, including:
- Cursor-based navigation and editing
- Copy/paste functionality
- Syntax highlighting
- Code completion
- Integrated debugging
- No need to press ENTER after each line edit

### File Formats

#### Binary Format (.br, .wb)
Default BR! program format:
```
SAVE program_name.br         ! Default extension
SAVE program_name.wb         ! Alternative extension
```

#### Source Format (.brs, .wbs)
Plain text format for external editing:
```
SAVE program_name SOURCE     ! Saves as .brs
LOAD program_name SOURCE     ! Loads from .brs
```

### Configuration

#### Setting the Editor
Add EDITOR statement to BRConfig.sys:
```
EDITOR "C:\Program Files (x86)\Mills Enterprise\MyEditBR\MyEditBR.exe"
EDITOR "C:\Program Files\Notepad++\notepad++.exe"
EDITOR "/usr/bin/vim"
```

#### Using the EDIT Command
The EDIT command:
1. Lists current program to source file
2. Opens external editor with source file
3. Merges changes back when editor closed

```
EDIT                         ! Edit current program
```

### Converting Between Formats

#### Methods to Create Source Files
```
LIST >filename.brs           ! Export to source
SAVE filename.brs, SOURCE    ! Save as source
REPLACE filename.brs, SOURCE ! Replace source file
```

### MyEditBR

Popular BR-specific editor with features:
- **Syntax Highlighting**: Color-coded BR! syntax
- **Code Completion**: Function name shortcuts and parameter hints
- **Refactoring**: Rename variables, labels, and forms
- **Integrated Debugger**: Visual debugging with breakpoints and watches
- **Multi-Monitor Support**: Remembers window positions
- **Customizable**: Keyboard shortcuts and preferences

#### MyEditBR Installation
1. Download from Mills Enterprise
2. Configure in BRConfig.sys:
```
EDITOR "C:\Program Files (x86)\Mills Enterprise\MyEditBR\MyEditBR.exe"
```

### Lexi Pre-Processor

**Lexi** is the BR! Lexical Preprocessor that enables editing BR programs without line numbers and provides advanced preprocessing capabilities.

#### Core Features
- **No Line Numbers During Editing**: Edit programs as source files (.BRS) without line numbers
- **Automatic Line Number Management**: Adds/removes line numbers when compiling to/from .BR files
- **Preprocessor Directives**: Supports #DEFINE, #AutoNumber, and SELECT CASE
- **Editor Integration**: Works with MyEdit, Notepad++, Sublime Text, and other editors
- **Source Code Preservation**: Maintains original line structure with spacing and comments

#### Preprocessor Directives

##### #AutoNumber Directive
Controls line numbering when adding line numbers back to source files.

**Syntax**:
```business-rules
! #AutoNumber# <starting-line>,<increment>
```

**Purpose**: Maintains consistent line number ranges for different program sections

**Example**:
```business-rules
! Without #AutoNumber (default numbering from 00001 by 1s):
00001 ! This Example Is Simple
00002    let Fnupdatefiledropdown
00003    if Trim$(_Post$(1))="" then
00004       let Fnreadlayoutfolder
00005    end if

! With #AutoNumber:
! #Autonumber# 16000,10
16000 ! #Autonumber# 16000,10
16010 DefineModes: ! Define the input spec modes
16020 def fnDefineInputModes
16030    dim InputAttributesMode
16040    dim InputFieldlistMode
16050    dim InputEditorMode
```

**Rules**:
- Must be in numerical order throughout program
- Must have enough space between directives for all lines
- Generates error if conflicts detected
- Preserves original line number structure

##### #DEFINE Directive
Creates preprocessor constants for text substitution.

**Syntax**:
```business-rules
!. "#Define# [[constant-name]] = replacement-text"
```

**Purpose**: Define reusable constants that expand during preprocessing

**Example**:
```business-rules
!. "#Define# [[ScreenControls]] = "mat ControlName$, mat FieldName$, mat Description$, mat VPosition, mat HPosition, mat FieldType$"

! Usage:
def fnEditScreen(fScreenIO, fScreenFld, ScreenName$, mat ScreenIO$, mat ScreenIO,[[ScreenControls]])
! Expands to:
def fnEditScreen(fScreenIO, fScreenFld, ScreenName$, mat ScreenIO$, mat ScreenIO, mat ControlName$, mat FieldName$, mat Description$, mat VPosition, mat HPosition, mat FieldType$)
```

**Note**: The "." forces BR to preserve comment capitalization

##### SELECT CASE Statement
Preprocessor implementation of SELECT CASE (similar to switch in C/C++).

**Syntax**:
```business-rules
#SELECT# <expression>
   #CASE# <value1>
      <statements>
   #CASE# <value2>
      <statements>
   [#CASE# ...]
#End Select#
```

**Translation**: Automatically converted to IF THEN ELSEIF statements

**Example Source**:
```business-rules
#SELECT# Mode 
   #CASE# InputAttributesMode
      let Window=fnGetAttributesWindow
      let fnGetAttributeSpec(mat InputSpec$,mat InputData$,mat InputSubs)
      rinput #Window, fields mat InputSpec$ : mat InputData$
   
   #CASE# InputFieldlistMode
      let Window=fnGetFieldsWindow
      let fnGetFieldsSpec(InputSpec$)
      rinput #Window, fields InputSpec$ : InputData
   
   #CASE# InputDebugMode
      let Window=fnGetDebugWindow
      let fnGetFieldsSpec(InputSpec$)
      rinput #Window, fields InputSpec$ : InputData
#End Select#
```

**Compiled Result**:
```business-rules
IF Mode = InputAttributesMode THEN  ! #SELECT# Mode #CASE# InputAttributesMode
   let Window=fnGetAttributesWindow
   let fnGetAttributeSpec(mat InputSpec$,mat InputData$,mat InputSubs)
   rinput #Window, fields mat InputSpec$ : mat InputData$
ELSE IF Mode = InputFieldlistMode THEN  ! #CASE# InputFieldlistMode
   let Window=fnGetFieldsWindow
   let fnGetFieldsSpec(InputSpec$)
   rinput #Window, fields InputSpec$ : InputData
ELSE IF Mode = InputDebugMode THEN  ! #CASE# InputDebugMode
   let Window=fnGetDebugWindow
   let fnGetFieldsSpec(InputSpec$)
   rinput #Window, fields InputSpec$ : InputData
END IF  ! #End Select#
```

#### Line Number Processing

##### Stripping Line Numbers
- Removes line numbers for editing
- Preserves spacing with blank comment lines
- Converts hard-coded line references to L##### labels

**Example**:
```business-rules
! Before stripping:
43900  ! #Autonumber# 43900,10
43910  DoesLayoutExist: ! Return true if layout exists
43920        def library FnDoesLayoutExist(layout$;LayoutPath$*255)
43930           let Fnsettings(Layoutpath$)
43940        fnend

! After stripping:
! #Autonumber# 43900,10
DoesLayoutExist: ! Return true if layout exists
      def library FnDoesLayoutExist(layout$;LayoutPath$*255)
         let Fnsettings(Layoutpath$)
      fnend
```

##### Adding Line Numbers
- Uses #AutoNumber directives if present
- Otherwise starts from 00001 incrementing by 1
- Preserves L##### labels as line number hints
- Maintains blank lines as comment lines

#### Lexi Tools

| Tool | Function | Description |
|------|----------|-------------|
| ConvStoO.cmd | Compile BR Program | Converts .BRS to .BR with line numbers |
| ConvOtoS.cmd | Extract Source Code | Converts .BR to .BRS without line numbers |
| DebugBR.cmd | Debug BR Program | Runs program in debug mode |
| ConvOSNL.cmd | Extract & Strip Numbers | Extracts source and removes line numbers |
| AddLN.cmd | Add Line Numbers | Adds line numbers to source file |
| StripLN.cmd | Strip Line Numbers | Removes line numbers from file |
| RunBR.cmd | Run BR Program | Executes BR program directly |

#### Editor Integration

##### MyEdit Installation
1. Download Lexi from SageAX
2. Unzip to C:\Lexi directory
3. Copy brserial.dat to C:\Lexi
4. In MyEdit: Tools → Configure User Tools → Import Lexi.mut

##### Notepad++ Installation
Add to shortcuts.xml:
```xml
<Command name="BR!s - Compile" Ctrl="yes" Alt="yes" Shift="yes" Key="73">
  C:\Lexi\ConvStoO.cmd "$(FULL_CURRENT_PATH)"
</Command>
```

##### Sublime Text Installation
Create build system (CompileBR.sublime-build):
```json
{
    "cmd": ["ConvStoO.cmd", "$file_name", "$file_base_name", "$file", "$file_path"],
    "selector": ".brs",
    "working_dir": "C:\\Lexi\\"
}
```

#### Important Considerations

##### L##### Labels
- Created automatically when stripping line numbers
- Replace hard-coded GOTO line references
- Format: L##### where ##### is original line number
- Used as hints when re-adding line numbers
- Do not harm code execution

##### PROC NOECHO
- Improves compilation speed
- Suppresses program listing during processing
- Press F2 to see errors if compilation fails

##### Best Practices
- **Always save before using Lexi tools** - Tools operate on disk files
- **Use #AutoNumber for existing programs** - Preserves line structure
- **Keep source files (.BRS) in version control** - Not compiled .BR files
- **Use meaningful #DEFINE constants** - Improves maintainability
- **Test after compilation** - Ensure preprocessing didn't break logic

### Best Practices

1. **Always save as source** when using external editors
2. **Keep backups** before major edits
3. **Use consistent editor** across team
4. **Configure syntax highlighting** for better readability
5. **Learn editor shortcuts** for efficiency

### Workflow Example

```
! In BR!
LOAD MYPROG                  ! Load existing program
SAVE MYPROG SOURCE          ! Convert to source
EDIT                        ! Opens in external editor
! Make changes in editor, save and close
! Changes automatically merged back to BR!
RUN                         ! Test changes
REPLACE MYPROG              ! Save binary version
```

## JSON and Data Store

### Overview

BR! includes comprehensive JSON support through a Data Store Function Library that enables:
- Storage and retrieval of JSON objects and other string data
- JSON parsing and compilation functions
- Web service integration with JSON data exchange
- In-memory data persistence across web requests

### Data Store Architecture

The WEB_SERVER program includes a data repository called a data store, enabling applications to:
- Save data for processing on subsequent calls
- Store named objects (JSON or otherwise) in memory
- Send JSON/HTML content back to web clients efficiently

#### Key Characteristics
- **Object Names**: Up to 200 characters, case-insensitive
- **Duplicate Names**: Support bracketed subscripts for multiple instances
- **Key Length**: Maximum 50 characters
- **Value Length**: Maximum 5000 characters per value
- **Total Capacity**: 100 MB across all objects
- **Object Size**: Stored in 5000 byte increments, max 300KB per JSON object

### JSON Structure in BR!

#### JSON Terminology
- **Object**: Brace-enclosed list of comma-separated name-value pairs `{}`
- **Array**: Bracket-enclosed ordered list of values `[]`
- **Member**: Name-value pair within an object
- **Value**: Can be string, number, object, array, true, false, or null

#### JSON Syntax Rules
```json
{
  "member_name": "string_value",
  "number_field": 123,
  "nested_object": {
    "field1": "value1",
    "field2": "value2"
  },
  "array_field": ["item1", "item2", "item3"],
  "boolean_field": true,
  "null_field": null
}
```

### Object Storage Functions

#### FNPut_Object
**Syntax**: `FNPut_Object(object-name, string-variable$)`

Creates or replaces a named object with the string value.

```business-rules
10100 LET JSON_STRING$ = '{"invoice":{"number":"INV001","amount":1500}}'
10110 LET RESULT = FNPut_Object("customer_invoice", JSON_STRING$)
```

#### FNInsert_Object
**Syntax**: `FNInsert_Object(object-name, string-variable$)`

Inserts object ahead of any existing object with same name.

```business-rules
10200 LET RESULT = FNInsert_Object("invoice[4]", INVOICE_JSON$)
```

#### FNGet_Object
**Syntax**: `FNGet_Object(object-name, string-variable$)`

Retrieves the value of a named object.

```business-rules
10300 LET RESULT = FNGet_Object("customer_invoice", RETRIEVED_JSON$)
10310 IF RESULT = -10 THEN PRINT "Object not found"
```

#### FNSend_Object
**Syntax**: `FNSend_Object(object-name [, suppress_header, suppress_length])`

Sends named object to current HTTP client.

```business-rules
10400 LET RESULT = FNSend_Object("api_response")
```

#### FNDelete_Object
**Syntax**: `FNDelete_Object(object-name)`

Deletes the named object from the data store.

```business-rules
10500 LET RESULT = FNDelete_Object("temp_data")
```

### JSON Manipulation Functions

#### FNPut_Json
**Syntax**: `FNPut_Json(fully-qualified-name, JSON-value-var$; must-exist-flag, as-is-flag)`

Creates or replaces a JSON value at specified path.

```business-rules
! Set customer name in invoice
11100 LET RESULT = FNPut_Json("invoice.customer.name", "John Smith")

! Update nested value
11110 LET RESULT = FNPut_Json("invoice.items[2].price", "29.99")
```

**Fully Qualified Name Format**:
- `object.member.submember`
- `object[n].member` - nth instance of object
- `object.member[n]` - nth value in member array

#### FNInsert_Json
**Syntax**: `FNInsert_Json(fully-qualified-name, JSON-value-var$; as-is-flag)`

Inserts JSON value, creating arrays for duplicate member names.

```business-rules
! Create array of addresses
11200 FNInsert_Json("customer.address.street", "123 Main St")
11210 FNInsert_Json("customer.address.street", "456 Oak Ave")
! Result: {"address":{"street":["123 Main St","456 Oak Ave"]}}
```

#### FNAppend_Json
**Syntax**: `FNAppend_Json(fully-qualified-name, JSON-value-var$; as-is-flag)`

Appends JSON value after specified location.

```business-rules
! Add multiple fields to same object
11300 FNAppend_Json("order.shipping[1].method", "Express")
11310 FNAppend_Json("order.shipping[1].cost", "15.00")
```

#### FNDelete_Json
**Syntax**: `FNDelete_Json(fully-qualified-name; null-value-flag)`

Deletes JSON value or sets to empty string.

```business-rules
11400 FNDelete_Json("invoice.temp_field", 0)  ! Remove completely
11410 FNDelete_Json("invoice.notes", 1)       ! Set to empty string
```

#### FNGet_Json
**Syntax**: `FNGet_Json(fully-qualified-name, container-variable$; as-is-flag)`

Retrieves JSON value from specified path.

```business-rules
11500 DIM CUSTOMER_NAME$*50
11510 LET RESULT = FNGet_Json("invoice.customer.name", CUSTOMER_NAME$)
11520 IF RESULT < 0 THEN PRINT "Error retrieving value"
```

### JSON Compilation and Parsing

#### FNCompile_Json
**Syntax**: `FNCompile_Json(value-list-type, member-name, mat keys$, mat values$, container-variable)`

Creates JSON from arrays of keys and values.

```business-rules
! Create JSON object from arrays
12100 DIM KEYS$(3)*20, VALUES$(3)*50, JSON_RESULT$*500
12110 LET KEYS$(1) = "city" : VALUES$(1) = "Dallas"
12120 LET KEYS$(2) = "state" : VALUES$(2) = "TX"
12130 LET KEYS$(3) = "zip" : VALUES$(3) = "75001"
12140 
12150 ! Create object with braces
12160 LET RESULT = FNCompile_Json("{", "address", MAT KEYS$, MAT VALUES$, JSON_RESULT$)
! Result: {"address":{"city":"Dallas","state":"TX","zip":"75001"}}

12170 ! Create array with brackets
12180 LET RESULT = FNCompile_Json("[", "locations", MAT KEYS$, MAT VALUES$, JSON_RESULT$)
! Result: {"locations":[{"city":"Dallas"},{"state":"TX"},{"zip":"75001"}]}
```

#### FNParse_Json
**Syntax**: `FNParse_Json(string-expression, value-type, member-name, mat keys$, mat values$)`

Parses JSON string into arrays.

```business-rules
! Parse JSON into arrays
12200 DIM TYPE$*1, NAME$*50
12210 DIM PARSE_KEYS$(100)*50, PARSE_VALUES$(100)*200
12220 LET JSON$ = '{"user":{"id":"123","name":"Alice","role":"admin"}}'
12230 
12240 LET RESULT = FNParse_Json(JSON$, TYPE$, NAME$, MAT PARSE_KEYS$, MAT PARSE_VALUES$)
12250 ! Arrays now contain parsed data
```

#### FNCompile_Object & FNParse_Object
Similar to JSON functions but work directly with stored objects.

```business-rules
! Compile directly to object
12300 FNCompile_Object("{", "config", MAT SETTINGS_KEYS$, MAT SETTINGS_VALUES$, "app.config")

! Parse from stored object
12310 FNParse_Object("app.config", TYPE$, NAME$, MAT KEYS$, MAT VALUES$)
```

### HTML Support Functions

#### FNSend_string
**Syntax**: `FNSend_string(string-variable$ [, suppress_header, suppress_length])`

Sends string content to HTTP client (max 30KB).

```business-rules
13100 LET HTML$ = "<h1>Dynamic Content</h1>"
13110 LET RESULT = FNSend_string(HTML$)
```

#### FNSend_Page
**Syntax**: `FNSend_Page(web-page-file-reference; mat args$, mat repl$ [, suppress_header, suppress_length])`

Sends web page file with string replacements.

```business-rules
13200 DIM ARGS$(2)*20, REPL$(2)*100
13210 LET ARGS$(1) = "{{username}}" : REPL$(1) = "John Doe"
13220 LET ARGS$(2) = "{{date}}" : REPL$(2) = DATE$
13230 LET RESULT = FNSend_Page("template.html", MAT ARGS$, MAT REPL$)
```

### HTTP Headers and Content Types

BR! automatically manages HTTP headers based on content:
- **HTML**: First character `<` sets content type to "text/html"
- **JSON**: First character `{`, `[`, or `"` sets content type to "application/json"
- **Header Suppression**: Required for multi-part responses

```business-rules
! First send - include header, suppress length
14100 FNSend_Page("header.html", MAT ARGS$, MAT REPL$, 0, 1)
! Subsequent sends - suppress headers completely
14110 FNSend_string(CONTENT$, 1, 0)
14120 FNSend_Page("footer.html", MAT ARGS$, MAT REPL$, 1, 0)
```

### Return Codes

| Code | Description |
|------|-------------|
| 1 | Success |
| 1++ | Number of array elements parsed |
| -10 | Object not found |
| -21 to -29 | Member not found at level 1-9 |
| -31+ | Invalid member subscript |
| -41+ | Unbalanced quotes or braces |
| -50 | Page not found |
| -52 | Not a file |
| -54 | Cannot open page file |
| -60 | Object name contains period |
| -80 | Invalid object subscript |
| -500 | Keys/values array mismatch |
| -510 | Invalid value-type (not "{" or "[") |
| -520 | Invalid JSON string |
| -530 | Member key is null |
| -540 | Data source is empty |
| -n | String overflow at segment n |

### Practical Examples

#### Building a REST API Response
```business-rules
! Create API response with status and data
15100 DIM RESPONSE$*5000
15110 
15120 ! Initialize response object
15130 FNPut_Json("api_response", '{"status":"success","data":{}}')
15140 
15150 ! Add data fields
15160 FNPut_Json("api_response.data.timestamp", STR$(TIME))
15170 FNPut_Json("api_response.data.user_id", USER_ID$)
15180 
15190 ! Add array of results
15200 FOR I = 1 TO NUM_RESULTS
15210    FNInsert_Json("api_response.data.results", RESULTS$(I))
15220 NEXT I
15230 
15240 ! Send to client
15250 FNSend_Object("api_response")
```

#### Processing Web Service Data
```business-rules
! Receive and parse JSON from web service
16100 DIM SERVICE_KEYS$(100)*50, SERVICE_VALUES$(100)*500
16110 DIM RESPONSE_TYPE$*1, RESPONSE_NAME$*50
16120 
16130 ! Get JSON from POST data
16140 LET JSON_DATA$ = _POST$(P_JSON_PAYLOAD)
16150 
16160 ! Parse the JSON
16170 LET RESULT = FNParse_Json(JSON_DATA$, RESPONSE_TYPE$, RESPONSE_NAME$, MAT SERVICE_KEYS$, MAT SERVICE_VALUES$)
16180 
16190 IF RESULT > 0 THEN
16200    ! Process each key-value pair
16210    FOR I = 1 TO RESULT
16220       IF SERVICE_KEYS$(I) = "action" THEN
16230          LET ACTION$ = SERVICE_VALUES$(I)
16240       ELSE IF SERVICE_KEYS$(I) = "data" THEN
16250          LET DATA$ = SERVICE_VALUES$(I)
16260       END IF
16270    NEXT I
16280 END IF
```

#### Session State Management
```business-rules
! Store session data in JSON format
17100 DIM SESSION_ID$*50
17110 LET SESSION_ID$ = "SESSION_" & STR$(RND * 1000000)
17120 
17130 ! Create session object
17140 FNPut_Json(SESSION_ID$, '{}')
17150 FNPut_Json(SESSION_ID$ & ".user", USERNAME$)
17160 FNPut_Json(SESSION_ID$ & ".login_time", STR$(TIME))
17170 FNPut_Json(SESSION_ID$ & ".ip_address", _SERVER$("REMOTE_ADDR"))
17180 
17190 ! Retrieve session data later
17200 DIM STORED_USER$*50
17210 FNGet_Json(SESSION_ID$ & ".user", STORED_USER$)
```

### Best Practices

1. **Error Handling**: Always check return codes from JSON functions
2. **String Sizing**: Dimension strings appropriately to avoid overflow errors
3. **Quote Handling**: BR! auto-quotes non-numeric values unless as-is-flag is set
4. **Performance**: Keep JSON objects under 100KB for optimal performance
5. **Naming**: Use descriptive object names; they're case-insensitive
6. **Cleanup**: Delete temporary objects when no longer needed
7. **Validation**: Validate JSON structure before parsing
8. **Stack Size**: Set BRConfig.sys stack size to 500000+ for JSON operations

## Web Integration

### BR Web Scripting Bridge

The BR Web Scripting Bridge enables BR! programs to generate web content and process web forms using PHP as an intermediary. This allows BR! applications to serve as backend logic for websites without requiring knowledge of PHP or web technologies.

#### Architecture

```
Web Browser <--> Web Server (Apache/PHP) <--> BR Web Scripting Bridge <--> BR! Program
```

##### Components
1. **PHP Adapter**: Generic PHP file that invokes BR! programs
2. **BR Web Scripting Bridge**: PHP class that manages BR! execution
3. **BR! Program**: Business logic that outputs HTML
4. **Web Server**: Apache with PHP support

#### Basic PHP Adapter

```php
<?PHP
   include('class.brphp.php');
   $br = new brphp();
   $br->RunBrCodeBehind($_SERVER['PHP_SELF']);
?>
```

This adapter automatically runs the BR! program with the same name as the PHP file.

#### BR! Web Programming Model

##### Input via _POST$ Array
Web form data is passed to BR! programs through the predefined `_POST$` array:

```business-rules
! Check if form was submitted
10100 IF UDIM(_POST$) > 0 THEN
10110    LET Username$ = _POST$(P_USERNAME)
10120    LET Password$ = _POST$(P_PASSWORD)
10130    LET Action$ = _POST$(P_BUTTON)
10140 END IF
```

##### Output via PRINT Statements
BR! programs generate HTML by printing to standard output:

```business-rules
! Generate HTML page
20100 PRINT '<html>'
20110 PRINT '<head>'
20120 PRINT '  <title>BR! Web Application</title>'
20130 PRINT '  <meta charset="utf-8">'
20140 PRINT '</head>'
20150 PRINT '<body>'
20160 PRINT '  <h1>Welcome to BR! Web</h1>'
20170 PRINT '</body>'
20180 PRINT '</html>'
```

#### Web Form Handling

##### Creating Forms
```business-rules
! Generate input form
30100 PRINT '<form method="post" action="">'
30110 PRINT '  <label>Name: <input type="text" name="username"></label><br>'
30120 PRINT '  <label>Email: <input type="email" name="email"></label><br>'
30130 PRINT '  <input type="submit" name="button" value="Submit">'
30140 PRINT '</form>'
```

##### Processing Form Data
```business-rules
! Process submitted form
40100 IF P_BUTTON THEN  ! Form was submitted
40110    LET Name$ = TRIM$(_POST$(P_USERNAME))
40120    LET Email$ = TRIM$(_POST$(P_EMAIL))
40130    ! Validate and process data
40140    IF LEN(Name$) > 0 AND POS(Email$,"@") > 0 THEN
40150       ! Save to database or file
40160       GOSUB SaveData
40170       PRINT '<p>Thank you for submitting!</p>'
40180    ELSE
40190       PRINT '<p style="color:red">Please complete all fields</p>'
40200    END IF
40210 END IF
```

#### Dynamic Content Generation

##### Displaying Database Records
```business-rules
! Read and display data in HTML table
50100 LIBRARY "fileio" : FNOPENFILE
50110 LET FileNum = FNOPEN("customers", MAT Cust$, MAT Cust, MAT Form$)
50120 
50130 PRINT '<table border="1">'
50140 PRINT '  <tr><th>ID</th><th>Name</th><th>Email</th></tr>'
50150 
50160 DO
50170    READ #FileNum, USING Form$(FileNum): MAT Cust$, MAT Cust EOF Done
50180    PRINT '  <tr>'
50190    PRINT '    <td>' & Cust$(C_ID) & '</td>'
50200    PRINT '    <td>' & Cust$(C_NAME) & '</td>'
50210    PRINT '    <td>' & Cust$(C_EMAIL) & '</td>'
50220    PRINT '  </tr>'
50230 LOOP
50240 
50250 Done: PRINT '</table>'
50260 CLOSE #FileNum:
```

##### Creating Interactive Elements
```business-rules
! Generate dropdown from data
60100 PRINT '<select name="category">'
60110 PRINT '  <option value="">Choose...</option>'
60120 FOR I = 1 TO UDIM(MAT Categories$)
60130    PRINT '  <option value="' & Categories$(I) & '">'
60140    PRINT Categories$(I) & '</option>'
60150 NEXT I
60160 PRINT '</select>'
```

#### CSS and JavaScript Integration

##### Including Stylesheets
```business-rules
70100 PRINT '<!DOCTYPE html>'
70110 PRINT '<html>'
70120 PRINT '<head>'
70130 PRINT '  <link rel="stylesheet" href="style.css">'
70140 PRINT '  <link rel="stylesheet" href="https://cdn.example.com/framework.css">'
70150 PRINT '</head>'
```

##### Embedding JavaScript
```business-rules
80100 PRINT '<script>'
80110 PRINT 'function validateForm() {'
80120 PRINT '  var x = document.forms["myForm"]["email"].value;'
80130 PRINT '  if (x.indexOf("@") == -1) {'
80140 PRINT '    alert("Invalid email address");'
80150 PRINT '    return false;'
80160 PRINT '  }'
80170 PRINT '}'
80180 PRINT '</script>'
```

#### Multi-Page Applications

##### Page Navigation
```business-rules
! Redirect to different PHP/BR programs
90100 IF Action$ = "EDIT" THEN
90110    PRINT '<form method="post" action="edit.php">'
90120    PRINT '  <input type="hidden" name="id" value="' & RecordID$ & '">'
90130    PRINT '  <input type="submit" value="Continue">'
90140    PRINT '</form>'
90150 ELSE IF Action$ = "DELETE" THEN
90160    PRINT '<meta http-equiv="refresh" content="0;url=delete.php?id=' & RecordID$ & '">'
90170 END IF
```

##### Session Management
```business-rules
! Pass data between pages via hidden fields
95100 PRINT '<input type="hidden" name="session_id" value="' & SessionID$ & '">'
95110 PRINT '<input type="hidden" name="user_id" value="' & UserID$ & '">'
95120 PRINT '<input type="hidden" name="timestamp" value="' & STR$(TIME) & '">'
```

#### Security Considerations

##### Input Validation
```business-rules
! Sanitize user input
96100 DEF FNHTML$(X$)
96110    LET X$ = SREPLACE$(X$, "&", "&amp;")
96120    LET X$ = SREPLACE$(X$, "<", "&lt;")
96130    LET X$ = SREPLACE$(X$, ">", "&gt;")
96140    LET X$ = SREPLACE$(X$, '"', "&quot;")
96150    LET X$ = SREPLACE$(X$, "'", "&#39;")
96160    LET FNHTML$ = X$
96170 FNEND
96180 
96190 ! Use when outputting user data
96200 PRINT '<p>Welcome, ' & FNHTML$(Username$) & '</p>'
```

##### Access Control
```business-rules
! Check authentication
97100 IF NOT FNVERIFYAUTH(_POST$(P_TOKEN)) THEN
97110    PRINT '<h1>Access Denied</h1>'
97120    PRINT '<p>Please <a href="login.php">log in</a> first.</p>'
97130    STOP
97140 END IF
```

#### Best Practices

1. **Separation of Concerns**: Keep business logic in BR!, presentation in HTML/CSS
2. **Error Handling**: Always validate form input and handle file/database errors
3. **Performance**: Cache frequently accessed data, minimize database reads
4. **Security**: Sanitize all user input, validate authentication
5. **Maintenance**: Use FileIO library for database access, modularize code with functions

#### Example: Complete Order Form Application

```business-rules
01000 ! Web Order Form - Complete Example
01010 ! Demonstrates form creation, validation, and processing
01020 
01030 DIM Items$(100)*50, Prices(100), Quantities(100)
01040 
01050 ! Check if form was submitted
01060 IF TRIM$(_POST$(1)) = "" THEN
01070    GOSUB ShowOrderForm
01080 ELSE
01090    GOSUB ProcessOrder
01100 END IF
01110 STOP
01120 
02000 ShowOrderForm: ! Display order form
02010    PRINT '<!DOCTYPE html>'
02020    PRINT '<html><head>'
02030    PRINT '  <title>Order Form</title>'
02040    PRINT '  <style>'
02050    PRINT '    table { border-collapse: collapse; }'
02060    PRINT '    th, td { padding: 8px; border: 1px solid #ddd; }'
02070    PRINT '    input[type="number"] { width: 60px; }'
02080    PRINT '  </style>'
02090    PRINT '</head><body>'
02100    PRINT '<h1>Product Order Form</h1>'
02110    PRINT '<form method="post">'
02120    PRINT '<table>'
02130    PRINT '  <tr><th>Item</th><th>Price</th><th>Quantity</th></tr>'
02140    
02150    ! Load and display products
02160    GOSUB LoadProducts
02170    FOR I = 1 TO NumItems
02180       PRINT '  <tr>'
02190       PRINT '    <td>' & Items$(I) & '</td>'
02200       PRINT '    <td>$' & STR$(Prices(I)) & '</td>'
02210       PRINT '    <td><input type="number" name="qty' & STR$(I) & '" min="0" value="0"></td>'
02220       PRINT '  </tr>'
02230    NEXT I
02240    
02250    PRINT '</table>'
02260    PRINT '<p><input type="submit" name="submit" value="Place Order"></p>'
02270    PRINT '</form>'
02280    PRINT '</body></html>'
02290 RETURN
02300 
03000 ProcessOrder: ! Process submitted order
03010    PRINT '<!DOCTYPE html>'
03020    PRINT '<html><head><title>Order Confirmation</title></head><body>'
03030    PRINT '<h1>Order Confirmation</h1>'
03040    
03050    LET Total = 0
03060    GOSUB LoadProducts
03070    
03080    PRINT '<table>'
03090    PRINT '  <tr><th>Item</th><th>Quantity</th><th>Subtotal</th></tr>'
03100    
03110    FOR I = 1 TO NumItems
03120       LET QtyOrdered = VAL(_POST$(P_QTY1 + I - 1)) CONV IGNORE
03130       IF QtyOrdered > 0 THEN
03140          LET Subtotal = QtyOrdered * Prices(I)
03150          LET Total += Subtotal
03160          PRINT '  <tr>'
03170          PRINT '    <td>' & Items$(I) & '</td>'
03180          PRINT '    <td>' & STR$(QtyOrdered) & '</td>'
03190          PRINT '    <td>$' & STR$(Subtotal) & '</td>'
03200          PRINT '  </tr>'
03210       END IF
03220    NEXT I
03230    
03240    PRINT '  <tr><th colspan="2">Total:</th><th>$' & STR$(Total) & '</th></tr>'
03250    PRINT '</table>'
03260    PRINT '<p>Thank you for your order!</p>'
03270    PRINT '<p><a href="">Place another order</a></p>'
03280    PRINT '</body></html>'
03290 RETURN
03300 
04000 LoadProducts: ! Load product data
04010    ! In real application, load from database
04020    LET NumItems = 3
04030    LET Items$(1) = "Widget A"
04040    LET Prices(1) = 19.99
04050    LET Items$(2) = "Widget B"
04060    LET Prices(2) = 29.99
04070    LET Items$(3) = "Widget C"
04080    LET Prices(3) = 39.99
04090 RETURN
```

## Client Server

### Overview

The BR! Client Server (CS) model enables distributed computing by separating the user interface (client) from the business logic and data processing (server). This architecture provides:

1. **Cross-platform integration**: Windows clients can connect to Linux/Mac servers and vice versa
2. **Remote access**: Users can run BR! applications over networks/internet
3. **Centralized processing**: All business logic executes on the server
4. **Extended functionality**: Client-side printing and file operations

### Architecture

```
┌─────────────┐        TCP/IP         ┌──────────────┐
│  BRClient   │ ◄─────────────────────► │  BRListener  │
│  (Windows/  │        Port 8555       │   (Server)   │
│    Mac)     │       (default)        │              │
└─────────────┘                        └──────┬───────┘
                                              │
                                              ▼
                                        ┌──────────────┐
                                        │   BRServer   │
                                        │ (Application)│
                                        └──────────────┘
```

### Components

#### Server Components
- **BRListener.exe/brlistener**: Connection agent that manages client connections
- **BRServer.exe/brserver**: BR! server program that executes business logic
- **BRListener.conf**: Configuration file specifying server settings

#### Client Components
- **BRClient.exe**: Windows/Mac client program
- **BR_Parms.txt**: Optional client configuration file

### Configuration

#### BRListener.conf Structure

```ini
# Global settings
logfile=/path/to/logfile.log
loglevel=6
port=8555

# Session definitions
[ LABEL=BR STARTDIR=/u/myapp EXECUTABLE=/u/myapp/br/brserver CONFIG=/u/myapp/brconfig.svr ]
```

##### Session Statement Parameters
- **LABEL**: Unique identifier for the session (referenced by client)
- **STARTDIR**: Server working directory (no quotes/spaces)
- **EXECUTABLE**: Path to BRServer executable
- **CONFIG**: Path to BRConfig.sys file (optional)
- **CAPTION**: Client login window caption
- **ANONYMOUS**: username@password for automatic login
- **MULTISESSION**: Allow multiple sessions per login
- **STDERR**: Error output file

#### Client Connection

##### Command Line
```bash
BRclient server_address label_name
BRclient 192.168.1.100 BR
BRclient myserver.com:7543 BR  # Custom port
```

##### BR_Parms.txt Configuration
```ini
host=192.168.1.100
label=BR
```

### Shell Calls and System Commands

#### Shell Call Flags

| Flag | Purpose | Default Behavior |
|------|---------|------------------|
| `-s` | Server shell call | Default for Linux |
| `-@` | Client shell call | Default for Windows |
| `-c` | Continue BR execution | Wait for completion |
| `-r` | Restore screen | Forward output to client |
| `-w` | Without shell | Use shell interpreter |
| `-p` | Page output | Display without paging |
| `-m` | Minimized (Windows) | Normal window |
| `-t###` | Timeout seconds | SHELL LIMIT value |

#### Examples
```business-rules
! Execute on server (Linux default)
10100 EXECUTE "SYSTEM -s ls -la"

! Execute on client (Windows default)  
10200 EXECUTE "SYSTEM -@ dir"

! Launch and continue
10300 EXECUTE "SYSTEM -c notepad.exe"

! Direct program execution without shell
10400 EXECUTE "SYSTEM -w /usr/bin/python script.py"
```

### Remote Printing

Remote printing enables client-side printing in the CS model, essential for Windows servers where printer access requires desktop login.

#### Printer Types and Behavior

| Printer | OPTION 30 OFF (Default) | OPTION 30 ON |
|---------|-------------------------|--------------|
| `PRN:/` | Client (via SPOOLCMD) | Server |
| `PRN:@/` | Client | Client |
| `WIN:/` | Client (native) | Server |
| `WIN:@/` | Client (native) | Client |
| `DIRECT:/` | Client (bypass SPOOLCMD) | Client |
| `PREVIEW:/` | Client | Client |

#### Configuration Statements

```business-rules
! Suppress remote printing (server-side printing)
OPTION 30

! Client-side spooling
SPOOLCMD @ print.bat [SPOOLFILE]

! Separate spool paths for server and client
SPOOLPATH /var/spool/br
SPOOLPATH @ C:\Temp\Spool

! Direct printing (bypass SPOOLCMD)
OPEN #1: "name=DIRECT:/HP LaserJet", DISPLAY, OUTPUT
```

#### Printer Discovery
```business-rules
! List available printers
10100 DIM PrinterList$(1)*1000
10110 PRINTER_LIST(PrinterList$)
10120 PRINT MAT PrinterList$
```

### File Operations

#### Client File Access
Files on the client are accessed using the `@:` prefix:

```business-rules
! Copy file from server to client
10100 COPY "data.txt" TO "@:C:\ClientData\data.txt"

! Copy from client to server
10200 COPY "@:C:\Upload\report.pdf" TO "reports/report.pdf"

! Check if client file exists
10300 IF EXISTS("@:C:\Config\settings.ini") THEN
10310    OPEN #1: "name=@:C:\Config\settings.ini", DISPLAY, INPUT
10320 END IF
```

#### Drive Mapping
```business-rules
! DRIVE statement with client path (3rd parameter)
DRIVE Q:, "/server/path", "C:\ClientPath", REMOTE
```

### Client Current Directory

Controls client-side directory management:

```business-rules
! Set client current directory
CLIENT_CURRENT_DIR "C:\WorkDir"

! Synchronize with server directory changes
CLIENT_CURRENT_DIR SYNC

! Disable (use startup directory)
CLIENT_CURRENT_DIR OFF
```

### Connection Management

#### Reconnection Configuration
```business-rules
! Configure automatic reconnection
CLIENT_SERVER RECONNECT_AFTER=20 RECONNECT_TIME=300
```

- **RECONNECT_AFTER**: Seconds before attempting reconnection (default: 20)
- **RECONNECT_TIME**: Maximum reconnection attempt duration (default: 120)

#### Session Management
- Session numbers displayed during reconnection attempts
- Reconnection possible from different workstations
- Login window includes reconnection checkbox

### Security Considerations

#### Authentication Methods

##### Standard Login
Users provide credentials that are validated against server OS accounts

##### Anonymous Access
```ini
[ LABEL=PUBLIC ANONYMOUS=guestuser@password123 ... ]
```
**Caution**: Anonymous users inherit specified account permissions

#### Access Control

##### Windows Server Requirements
- Users need "Allow log on locally" permission
- Configure via Domain Controller Security Policy
- Required for Windows 2003 Server and later

##### Security Best Practices
1. Use unique ports (not default 8555)
2. Implement firewall rules for BR listener
3. Restrict anonymous account OS access
4. Disable Ctrl-A interrupts for end users:
   ```business-rules
   KEYBOARD 01 00  ! Disable Ctrl-A
   KEYBOARD C0 01  ! Map line-draw character to Ctrl-A for support
   ```

### Network Configuration

#### Firewall Settings
- Configure inbound rules for BRListener.exe
- Open TCP port 8555 (or custom port)
- Windows: Create inbound policy for `C:\Windows\system32\brlistener.exe`

#### Router Configuration
- Use NAT and port forwarding for internet access
- Forward TCP port 8555 to server
- Configure router firewall to allow inbound traffic

### Platform-Specific Setup

#### Windows Server Installation

1. Copy BRListener.conf to C:\Windows
2. Place BRListener.exe in C:\Windows\System32
3. Run BRListenerInstaller.exe as Administrator
4. Verify service in Windows Services (BR_Listener)

#### Linux Server Installation

1. Copy brlistener.conf to /etc
2. Place brserver in application directory
3. Run brlistener as superuser (becomes daemon)
4. Use brlist script for service management:
   ```bash
   ./brlist install  # Install as service
   brlist start      # Start service
   brlist stop       # Stop service
   brlist restart    # Restart service
   ```

### Configuration Examples

#### Multi-Platform Setup
```ini
# Windows Server
[ LABEL=WINAPP STARTDIR=C:\Apps\BR EXECUTABLE=C:\BR\brserver.exe CONFIG=C:\Apps\brconfig.svr ]

# Linux Server
[ LABEL=LINUXAPP STARTDIR=/usr/local/br EXECUTABLE=/usr/local/br/brserver CONFIG=/usr/local/br/brconfig.svr ]

# Mac Server
[ LABEL=MACAPP STARTDIR=/Applications/BR EXECUTABLE=/Applications/BR/brserver CONFIG=/Applications/BR/brconfig.svr ]
```

#### Load Balancing Configuration
```ini
# Multiple sessions for single application
[ LABEL=APP1 STARTDIR=/app EXECUTABLE=/app/brserver MULTISESSION ]
[ LABEL=APP2 STARTDIR=/app EXECUTABLE=/app/brserver MULTISESSION ]
[ LABEL=APP3 STARTDIR=/app EXECUTABLE=/app/brserver MULTISESSION ]
```

### System Functions and Variables

#### WBPLATFORM$ Behavior
```business-rules
! Returns client platform when SHELL DEFAULT CLIENT is set
CONFIG SHELL DEFAULT CLIENT
IF WBPLATFORM$ = "WINDOWS" THEN
   ! Client is Windows
ELSE IF WBPLATFORM$ = "LINUX" THEN
   ! Client is Linux
END IF
```

#### Session Information
```business-rules
! Get session details
LET SessionID$ = SESSION$
LET WorkstationID$ = WSID$
LET UserName$ = ENV$("USERNAME")
```

### Best Practices

1. **Performance Optimization**
   - Minimize screen updates for remote connections
   - Use OPTION 33 for reduced screen refresh
   - Batch database operations

2. **Error Handling**
   - Implement connection timeout handling
   - Provide offline mode fallback
   - Log connection issues

3. **User Experience**
   - Design for network latency
   - Provide connection status indicators
   - Cache frequently accessed data

4. **Deployment**
   - Test with actual network conditions
   - Document firewall/router requirements
   - Provide connection troubleshooting guide

### Troubleshooting

#### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Connection timeout | Increase RECONNECT_TIME value |
| Slow shell commands | Set `CLIENT_SERVER RECONNECT_AFTER=999 RECONNECT_TIME=999` |
| Printer not found | Verify with PRINTER_LIST() function |
| File access denied | Check client path permissions |
| Login fails | Verify "Allow log on locally" permission |

#### Diagnostic Commands
```business-rules
! Test client connectivity
EXECUTE "SYSTEM -@ echo Client is responding"

! Check server environment
EXECUTE "SYSTEM -s env"

! Verify printer access
DIM P$(1)*1000
PRINTER_LIST(P$)
PRINT "Available printers:"
PRINT MAT P$
```

This grammar reference provides comprehensive coverage of the Business Rules! language for AI-assisted code reading and generation.

### Tips for AI Code Generation

1. **Do NOT use line numbers** - They are optional.  only use when already there
2. **Use lowercase syntax** case insensitive.  use lowercase unless changing code that is already uppercase
3. **String variables end with $** - This is mandatory
4. **Comments have three styles**:
   - `!` for single-line comments (most common)
   - `/* ... */` for multi-line comments
   - `/** ... */` for JavaDoc-style function documentation
5. **Abbreviations are common** - PR for PRINT, etc.
6. **Case doesn't matter** - Keywords can be any case
7. **Default string length is 18** - Use DIM to specify longer
8. **Arrays are 1-based** - First element is (1), not (0)
9. **Multiple statements per line** - Separate with :
10. **GOTO is acceptable** - Common in BR! programs
11. **Subroutines use GOSUB/RETURN** - Not CALL
12. **Document functions with JavaDoc** - Use `@param`
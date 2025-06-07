Here's a detailed summary of the **Business Rules! Language** based on the full review of the language specification and supporting documentation. This summary provides both a high-level overview and the specific technical context needed for code generation, debugging, and extension.

---

## 🧠 **Business Rules! Language – Developer Summary**

### 1. **Core Language Structure**

Business Rules! (BR) is a line-numbered procedural language designed for application programming, especially in business environments that require structured I/O, reporting, file manipulation, and forms processing. Its syntax and semantics resemble older BASIC-style languages but with extensive support for structured data access and GUI/RTF integration.

### 2. **Syntax Rules & Conventions**

* **Line Numbers:** Every line in BR! must start with a numeric label (e.g., `100`, `105`, `1200`). These facilitate control flow and multi-line entry handling.
* **Colon `:` Delimiter:** Used to separate multiple statements on the same line.
* **Multi-line Statements:** Use `!:` to continue logic across lines.

---

### 3. **Data Types and Variables**

* **Strings:** Declared with `DIM Var$*##` (e.g., `DIM Name$*30`)
* **Numerics:** Implicitly declared; no need for `DIM`, but can be used in matrices.
* **Arrays:** Declared as `DIM ArrayName(N)` or `DIM StrArray$(N)*##` with support for up to 3 dimensions.
* **Function Assignment:** Functions return values by assigning to the function name (e.g., `LET MyFunc=42 : FNEND`).

---

### 4. **Control Structures**

* **Conditional:** `IF...THEN`, `IF...THEN...ELSE`, `END IF` (multi-line only for full blocks)
* **Loops:**

  * `DO...LOOP` with `WHILE`, `UNTIL`, or both.
  * `FOR...TO...NEXT` for definite loops.
* **Branching:**

  * `GOTO`, `GOSUB`, `RETURN`, `ON GOTO`, `ON GOSUB`
  * `LABEL` is used for structured GOTO targets.

🔗 [Branching Statements Reference](https://brulescorp.com/brwiki2/index.php?title=Branching_Statements)

---

### 5. **I/O and File Handling**

BR! supports advanced file access:

* **OPEN** syntax:

  ```br
  OPEN #1: "name=FILENAME", display, input, sequential
  ```
* File types:

  * **DISPLAY** – text files
  * **INTERNAL** – structured records
  * Access: `SEQUENTIAL`, `RELATIVE`, `KEYED`
* **I/O Commands:**

  * `INPUT #`, `LINPUT #` (entire line)
  * `PRINT`, `PRINT #`, `PRINT FIELDS`
  * `READ`, `WRITE`, `REWRITE`, `CLOSE`

🔗 [OPEN Statement Details](https://brulescorp.com/brwiki2/index.php?title=OPEN)

---

### 6. **Built-in Functions**

* **Date Handling:** `DAYS(YYYYMMDD)` → Julian days; `DATE(days, "format")`
* **Math:** `MAX`, `MIN`, `MOD`, `ABS`, etc.
* **String:** `POS`, `TRIM$`, `LEFT$`, `RIGHT$`, `CNVRT$`
* **System:** `ENV$()`, `EXECUTE`, `MSGBOX()`

🔗 [Function Reference](https://brulescorp.com/brwiki2/index.php?title=Category:Functions)

---

### 7. **Forms and GUI Support**

* GUI windows and dialog boxes are supported via library functions in **FNSnap.dll**
* Interactive components include:

  * Text boxes, radio buttons, checkboxes, message dialogs.
  * `FNWAITWIN`, `FNOPTIONS$`, `FNWINROWCOL`

🔗 [FnSnap Functions](https://brulescorp.com/brwiki2/index.php?title=FnSnap)

---

### 8. **Libraries and DLLs**

BR! supports **dynamic libraries** via the `LIBRARY` statement:

```br
LIBRARY "FNSnap.dll/vol002": FNPRINT_FILE
```

* Libraries are used for GUI (`FNSnap.dll`), RTF output (`RTFLIB.dll`), and custom logic.
* Library functions use the `DEF LIBRARY` declaration and `FNEND` return.

---

### 9. **Common Error Handling**

* `ON ERROR`, `ON FNKEY`, `ON ATTN` for trap logic.
* Use `ERR` function to capture the last error code.
* Common errors:

  * `0002` – Conversion Error
  * `0004` – String Overflow
  * `0106` – Array Sizes Conflict
  * `0201` – RETURN without GOSUB

🔗 [Business Rules Error Codes](https://brulescorp.com/brwiki2/index.php?title=Business_Rules_Errors)

---

### 10. **Advanced Topics**

* **RTF Reports:** Use `FNRTFSTART` and `FNRTFEND` to generate RTF files.
* **Matrix Operations:** `MAT` command supports numerical arrays with operations like addition, multiplication, sorting.
* **Parameterization:** Many commands accept `POS=`, `REC=`, `RECL=`, `USE`, etc.

🔗 [Parameters Reference](https://brulescorp.com/brwiki2/index.php?title=Category:All_Parameters)

---

## 💡 Use This Summary For:

* **Prompt context building** for BR! code generation.
* **Template generation** for new modules or libraries.
* **Error handling** and syntax validation.
* **Library documentation reference** when working with `FNSnap.dll` or `RTFLIB.dll`.

Would you like code templates or best-practice samples based on this summary?

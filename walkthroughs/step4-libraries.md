# Working with Library Functions

Learn how to create and use library functions to organize your BR projects effectively.

## Creating a Library File

Create a separate `.brs` file for your library functions:

**Create `mathlib.brs`:**
```br
! Math Library Functions

/**
 * Calculate the area of a circle
 * @param radius - The radius of the circle
 */
def library circleArea(radius)
    let pi = 3.14159
    return pi * radius * radius
fnend

/**
 * Convert temperature from Celsius to Fahrenheit
 * @param celsius - Temperature in Celsius
 */
def library celsiusToFahrenheit(celsius)
    return (celsius * 9 / 5) + 32
fnend
```

## Using Library Functions

In your main program file, reference the library:

**Create `main.brs`:**
```br
! Main Program
library "mathlib": circleArea, celsiusToFahrenheit

let radius = 5
let area = circleArea(radius)
print "Circle area: "; area

let tempC = 25
let tempF = celsiusToFahrenheit(tempC)
print tempC; "°C = "; tempF; "°F"
```

## Library Features

### Auto-Completion for Library Functions
- **Type the function name** and see it in completion suggestions
- **Function signature** shows parameter names and types
- **Documentation** appears in hover tooltips

### Library Path Completion
When typing library statements:
```br
library "    ! Path completion shows available library files
```

### Cross-File Navigation
- **Go to Definition** (F12) works across library files
- **Find References** shows usage across your entire project
- **Hover information** displays documentation from library files

## Documentation Comments

Use JSDoc-style comments for rich documentation:

```br
/**
 * Description of what the function does
 * @param paramName - Description of parameter
 * @param anotherParam - Another parameter description
 */
def library myFunction(paramName, anotherParam$)
    ! Function implementation
fnend
```

## Project Organization Tips

- **Group related functions** in themed library files
- **Use descriptive file names** like `stringutils.brs`, `mathlib.brs`
- **Document all library functions** with parameter descriptions
- **Keep libraries focused** on specific functionality

The extension automatically indexes all `.brs` files in your workspace for seamless library function support! 
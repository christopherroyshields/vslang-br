00010 REM *** Test file for function diagnostics ***
00020 REM This file tests all four diagnostic types
00030 REM
00040 REM ===== Test 1: Missing FNEND (at end of file) =====
00050 DEF FNMISSINGEND(X)
00060   LET Y=X+1
00070 REM FNEND is missing here!
00075 REM
00076 REM ===== Test 1b: Missing FNEND (before next DEF) =====
00077 DEF FNMISSING2(A)
00078   LET Z=A+2
00079 REM FNEND missing, next DEF should trigger diagnostic
00080 REM
00090 REM ===== Test 2: Duplicate Functions =====
00100 DEF FNDUPLICATE(A)
00110   LET FNDUPLICATE=A*2
00120 FNEND
00130 REM
00140 REM This is a duplicate - should be flagged
00150 DEF FNDUPLICATE(B)
00160   LET FNDUPLICATE=B*3
00170 FNEND
00180 REM
00190 REM ===== Test 3: Undefined Function Calls =====
00200 LET RESULT1=FNUNDEFINED(10)
00210 LET RESULT2$=FNUNDEFINED$(20)
00220 REM
00230 REM ===== Test 4: Parameter Mismatches =====
00240 DEF FNPARAMS(X,Y,Z)
00250   LET FNPARAMS=X+Y+Z
00260 FNEND
00270 REM
00280 REM Too few parameters (expected 3, got 2)
00290 LET RESULT3=FNPARAMS(1,2)
00300 REM
00310 REM Too many parameters (expected 3, got 4)
00320 LET RESULT4=FNPARAMS(1,2,3,4)
00330 REM
00340 REM Correct number of parameters
00350 LET RESULT5=FNPARAMS(1,2,3)
00360 REM
00370 REM ===== Test 5: Valid Function =====
00380 DEF FNVALID(A,B)
00390   LET FNVALID=A+B
00400 FNEND
00410 REM
00420 REM Valid call
00430 LET RESULT6=FNVALID(5,10)
00440 REM
00450 REM ===== Test 6: Optional Parameters =====
00460 DEF FNOPTIONAL(X,Y;Z)
00470   LET FNOPTIONAL=X+Y
00480 FNEND
00490 REM
00500 REM Valid with 2 params (Z is optional)
00510 LET RESULT7=FNOPTIONAL(1,2)
00520 REM
00530 REM Valid with 3 params
00540 LET RESULT8=FNOPTIONAL(1,2,3)
00550 REM
00560 REM Invalid - too few (missing required param Y)
00570 LET RESULT9=FNOPTIONAL(1)
00580 REM
00590 REM Invalid - too many
00600 LET RESULT10=FNOPTIONAL(1,2,3,4)
00610 REM
00620 REM ===== Test 7: System Functions (should not be flagged) =====
00630 LET X=ABS(-5)
00640 LET Y$=LTRIM$(Z$)
00650 REM
00660 REM ===== Test 8: Inline Return (should not need FNEND) =====
00670 DEF FNINLINE(X)=X*2
00680 REM No FNEND needed for inline functions
00690 REM
00700 LET RESULT11=FNINLINE(7)
00710 REM
00720 REM ===== End of test file =====

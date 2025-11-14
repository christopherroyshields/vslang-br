00010 REM *** Test parameter type mismatches ***
00020 REM
00030 REM ===== Function with numeric and string parameters =====
00040 DEF FNTEST(X,Y$,Z)
00050   LET FNTEST=X+Z
00060 FNEND
00070 REM
00080 REM ===== Correct types - should not be flagged =====
00090 LET R1=FNTEST(10,NAME$,20)
00100 REM
00110 REM ===== Type mismatches - should be flagged =====
00120 REM String passed to number parameter X
00130 LET R2=FNTEST(NAME$,"test",30)
00140 REM
00150 REM Number passed to string parameter Y$
00160 LET R3=FNTEST(10,NUM,20)
00170 REM
00180 REM All wrong types
00190 LET R4=FNTEST(A$,B,C$)
00200 REM
00210 REM ===== Array type tests =====
00220 DIM ARR(10), SARR$(10)*20
00230 DEF FNARR(MAT A())
00240   LET FNARR=A(1)
00250 FNEND
00260 REM
00270 REM Correct - number array
00280 LET R5=FNARR(MAT ARR())
00290 REM
00300 REM Wrong - string array instead of number array
00310 LET R6=FNARR(MAT SARR$())
00320 REM
00330 REM ===== String function test =====
00340 DEF FNSTR$(S$,T$)
00350   LET FNSTR$=S$&T$
00360 FNEND
00370 REM
00380 REM Correct
00390 LET R7$=FNSTR$("Hello","World")
00400 REM
00410 REM Wrong - numbers instead of strings
00420 LET R8$=FNSTR$(X,Y)
00430 REM
00440 REM ===== End of test =====

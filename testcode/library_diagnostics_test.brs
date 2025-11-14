00010 REM *** Test file for library function diagnostics ***
00020 REM
00030 REM ===== Test 1: Library Function Definition =====
00040 DEF LIBRARY FNMYLIB(X,Y)
00050   LET FNMYLIB=X+Y
00060 FNEND
00070 REM
00080 REM ===== Test 2: Duplicate Library Functions =====
00090 REM (To test this, you would need another file with same library function)
00100 DEF LIBRARY FNDUPLICATELIB(A)
00110   LET FNDUPLICATELIB=A*2
00120 FNEND
00130 REM
00140 REM ===== Test 3: Local duplicate of library function =====
00150 DEF LIBRARY FNDUPLICATELIB(B)
00160   LET FNDUPLICATELIB=B*3
00170 FNEND
00180 REM
00190 REM ===== Test 4: Missing FNEND for library function =====
00200 DEF LIBRARY FNMISSINGLIB(X)
00210   LET Y=X+1
00220 REM FNEND is missing here!
00230 REM
00240 REM ===== Test 5: Valid library function call =====
00250 LET RESULT=FNMYLIB(10,20)
00260 REM
00270 REM ===== End of test file =====

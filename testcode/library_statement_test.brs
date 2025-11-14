00010 REM *** Test LIBRARY statement function declarations ***
00020 REM
00030 REM ===== Declare external library functions =====
00040 LIBRARY "FNSnap.dll": FNPRINT_FILE, FNOPEN_DIALOG$
00050 REM
00060 REM ===== These calls should NOT be flagged as undefined =====
00070 LET RESULT=FNPRINT_FILE("test.txt")
00080 LET FILE$=FNOPEN_DIALOG$()
00090 REM
00100 REM ===== This should still be flagged as undefined =====
00110 LET X=FNNOTDECLARED(5)
00120 REM
00130 REM ===== Multiple LIBRARY statements =====
00140 LIBRARY "RTFLIB.dll": FNRTF_INIT, FNRTF_CLOSE
00150 REM
00160 LET RESULT2=FNRTF_INIT()
00170 REM
00180 REM ===== End of test =====

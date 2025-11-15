! Manual test file for auto line number insertion
! The provider now only auto-inserts when pressing Enter on a line WITH a line number

! TEST 1: Press Enter at end of line 00010 below
! EXPECTED: Should auto-insert 00020 on new line
00010 PRINT "Test 1"

! TEST 2: Press Enter at end of this comment (no line number)
! EXPECTED: Should NOT auto-insert, just create blank line

! TEST 3: Press Enter on the blank line below (no line number)
! EXPECTED: Should NOT auto-insert, just create another blank line

! TEST 4: Press Enter at end of line 00100 below
! EXPECTED: Should auto-insert 00110 on new line
00100 LET X = 10

! TEST 5: After TEST 4, press Enter on the new blank 00110 line
! EXPECTED: Should auto-insert 00120 (since 00110 has a line number)

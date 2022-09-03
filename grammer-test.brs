! GRAMMER TEST CODE

! multiline comment
/* Aute occaecat ea laborum 
fugiat irure et eiusmod do 
consequat id aliquip culpa voluptate. "ttest"
 */

! REM comment
rem lorem ipsum dolar et somet

! double quoted string
let a = "lorem ipsum dolar et somet"

! double quoted string with embedded double quotes
let a = "lorem ipsum ""dolar"" et somet"

! string with commands
execute "COPY a.bat b.bat"

! single quote string
execute 'COPY "foo.bat" "bar.bat"'

! single quote string
execute 'lorem ipsum ''foo.dat'' dolar'

! interpolated string
execute `copy {{if test$ == test$}} {{filename$(5)}}.bak`

! multiline
print `Consectetur ad occaecat ipsum incididunt 
consequat occaecat exercitation 
sunt eu aute veniam amet do.`

! line continutation

let a = b !: let b = c !: 
let b = 1 ! test !:
let c = 2 ! test !:
print b$

! lexi test
! #Autonumber# 16000,10
PreformInput: ! Preform main input operation
def fnPreformInput(&Mode,Control,mat ScreenIO$,mat ScreenIO;___,Window)
  #SELECT# Mode #CASE# InputAttributesMode
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
fnend

! custom function call
let fntest

!string
let foo$=bar$

!numberic
let foo=bar

!line label
00001 test: let foo = bar

!line number
00001 let foo = bar
00002 print "foo"

!numeric
let a = 1 + 23 + 45678

! control keywords
if foo == bar then
else if bar == 1 then
end if
do
loop

! internal functions
BR_FileName$(test)
str$(1)
val("1")

! misc keywords
00100 OPEN #5: "NAME=data,KFNAME=key", INTERNAL,OUTIN,KEYED

!error cond
print val("") error IGNORE

!statement
chain "test.wb"

! mat statement
mat a$(1)=mat b$
print mat a$
print fields "2,2,grid 10/80,headers": (Mat Headings$,Mat Widths,Mat Forms$)

! #AutoNumber#$ 100, 10
let test$ = TEST$

! function test
let str$(WSID$)
let Sleep()
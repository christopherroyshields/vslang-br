@echo off
rem   echo calling command: %0 %*
rem   echo percent 1: %1
rem   echo percent 2: %2
rem   pause
rem   @echo on

if "%~1"=="" goto HELP
if "%~2"=="" goto SET_FROM_1_PARAMETERS
if "%~3"=="" goto ERR
if "%~4"=="" goto ERR
goto SET_FROM_4_PARAMETERS

:SET_FROM_1_PARAMETERS
Set name=%1
Set name_wo_quotes=%~1
Set folder=%~dp1
Set npne_name=%~n1
Set name_ext=%~x1
set extout=%name_ext:~0,3%
rem echo %extout%
Set np_name=%npne_name%%name_ext%
set cmd_home=%~dp0
Set drive=%folder:~0,2%
goto AFTER_SET

:SET_FROM_4_PARAMETERS
Set np_name=%1
Set name_ext=%~x1
set extout=%name_ext:~0,3%
rem echo %extout%
Set name_wo_quotes=%~1
Set npne_name=%2
Set name=%3
Set folder=%4
set cmd_home=%~dp0
Set drive=%folder:~0,2%
goto AFTER_SET

:AFTER_SET
rem   @echo AFTER_SET
rem   @echo       cmd_home: %cmd_home%
rem   @echo        np_name: %np_name%
rem   @echo           name: %name%
rem   @echo      npne_name: %npne_name%
rem   @echo name_wo_quotes: %name_wo_quotes%
rem   pause

Rem copy /y %name% %name%.Pre_%~n0.bak

rem original     copy %name% %cmd_home%%np_name%
rem echo "%name%"
rem echo "%cmd_home%%np_name%"

copy %name% "%cmd_home%tmp\%np_name%"
rem pause

echo proc noecho > "%cmd_home%convert.prc"
rem echo %cmd_home%convert.prc
rem pause
echo 00002 Infile$="tmp\%np_name%" >> "%cmd_home%convert.prc"
echo 00003 Outfile$="tmp\tempfile" >> "%cmd_home%convert.prc"
echo subproc linenum.brs >> "%cmd_home%convert.prc"
echo run >> "%cmd_home%convert.prc"
echo clear >> "%cmd_home%convert.prc"
echo subproc tmp\tempfile >>"%cmd_home%convert.prc"

echo skip PROGRAM_REPLACE if exists("tmp\%npne_name%") >> "%cmd_home%convert.prc"
echo skip PROGRAM_REPLACE if exists("tmp\%npne_name%%extout%") >> "%cmd_home%convert.prc"

echo save "tmp\%npne_name%%extout%" >> "%cmd_home%convert.prc"
echo skip XIT >> "%cmd_home%convert.prc"
echo :PROGRAM_REPLACE >> "%cmd_home%convert.prc"

echo replace "tmp\%npne_name%%extout%" >> "%cmd_home%convert.prc"
echo skip XIT >> "%cmd_home%convert.prc"
echo :XIT >> "%cmd_home%convert.prc"
echo system >> "%cmd_home%convert.prc"
cd "%cmd_home%"
start lexitip
brnative proc convert.prc

del "%cmd_home%convert.prc"
del "%cmd_home%tmp\tempfile"

rem copy /y %cmd_home%%npne_name% %folder%\*.*
rem origional     if exist "%cmd_home%%npne_name%.br" (
rem origional       copy /y %cmd_home%%npne_name%.br %folder%*.*
rem origional       del %cmd_home%%npne_name%.br
rem origional     ) else (
rem origional       copy /y %cmd_home%%npne_name% %folder%*.*
rem origional       del %cmd_home%%npne_name%
rem origional     )

if exist "%cmd_home%tmp\%npne_name%%extout%" (
  copy /y "%cmd_home%tmp\%npne_name%%extout%" "%folder%*.*"
  del "%cmd_home%tmp\%npne_name%%extout%"
) else (
  copy /y "%cmd_home%tmp\%npne_name%" "%folder%*.*"
  del "%cmd_home%tmp\%npne_name%"
)

del "%cmd_home%tmp\%np_name%"
goto RUNDEBUG

:RUNDEBUG
start lexitip
rem Change Drive if needed
%drive%
rem Then run the program
cd %folder%
echo proc noecho >convert.$$$
echo load "%npne_name%" >> convert.$$$
echo run >> convert.$$$
brnative.exe proc convert.$$$
goto END

:ERR
echo Syntax Error, there was something wrong with your command.
echo you said:
echo %0
echo See the correct usage below.
:HELP
echo Compiles from Business Rules! source to program.
echo .
echo %~n0  [np_name] [npne_name] [name] [folder]  (all parameters required)
echo    or
echo %~n0  [name]                                 (only one parameter)
echo .
echo You must use either one or four parameters.  Paths that contain spaces will not work due cmd file parameter limitations.  no quote encapsulated paths are allowed (at least in the one parameter implementation).
echo .
echo [name]       = the name with the extension and the path.
echo [np_name]    = the name with the extension but no path.
echo [npne_name]  = name without path or extension
echo [folder]     = just the path
echo .
echo NOTE: All parameters discussed above are for the source file.
echo       The destination program file will be the same as the source file
echo       only it will have a .br extension instead.
goto END

:END

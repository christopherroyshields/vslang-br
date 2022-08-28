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

echo proc noecho > "%cmd_home%convert.prc"
rem echo %cmd_home%convert.prc
rem pause

rem Convert to source code and Renum Labels Only
echo subproc tmp\%np_name% >> "%cmd_home%convert.prc"
echo RENUM LABELS_ONLY >> "%cmd_home%convert.prc"
type "%cmd_home%convOtoS.dat" >> "%cmd_home%convert.prc"
echo "tmp\%np_name%" >> "%cmd_home%convert.prc"
echo clear >> "%cmd_home%convert.prc"

rem Strip the line numbers
echo 00002 Infile$="tmp\%np_name%" >> "%cmd_home%convert.prc"
echo 00003 Outfile$="tmp\tempfile" >> "%cmd_home%convert.prc"
echo subproc strip.brs >> "%cmd_home%convert.prc"
echo run >> "%cmd_home%convert.prc"
echo system >> "%cmd_home%convert.prc"

cd "%cmd_home%"
start lexitip
brnative proc convert.prc

del convert.prc
move tmp\tempfile "tmp\%np_name%"

copy /y "tmp\%np_name%" "%folder%*.*"
del "tmp\%np_name%"

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
:END

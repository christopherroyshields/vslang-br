rem test filename parsing
@echo off
Set name_ext=%~x1
Set base_name=%~n1
for /f "tokens=1* delims=." %%j in ("%base_name%") do set base_name=%%j&set name_ext2=%%k
if NOT "%name_ext2%"=="" set name_ext=.%name_ext2%
Set name_ext=%name_ext:brs=br%
Set name_ext=%name_ext:wbs=wb%
echo base_name: %base_name%  ext: %name_ext%
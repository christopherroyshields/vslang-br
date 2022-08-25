Welcome to Lexi, BR's Lexical Preprocessor - another free service by Sage. This linkage can be used to automatically convert between BRS and BR files
from within MyEdit. This can make your Editing life much easier. This linkage
works with ALL versions of BR. However it requires a version of MyEdit dated
10/20/2006 or later.

To install the linkage, use the following steps.

Express Install:

1) Unzip Lexi.zip into C:\Lexi.
2) Copy your personal brserial.dat file into C:\Lexi.
3) Launch MyEdit.
4) Go to the Tools Menu, and then select "Configure User Tools".
5) Click the "Import Tools" Button.
6) Select the "lexi.mut" file from C:\Lexi.


Custom Install:

1) Unzip Lexi.zip into its own directory.
2) Copy your personal brserial.dat file into this directory.
3) Launch MyEdit.
4) Go to the Tools Menu, and then select "Configure User Tools".
5) Select "Add"
6) Enter the following information: (Replace C:\Lexi\ with the appropriate folder)
Menu Item Name: Compile BR Program
Application/Command: C:\Lexi\ConvStoO.cmd
Working Folder: C:\Lexi\
Command Line Parameters: %%np_name %%npne_name "%%name" "%%folder"
7) Click OK to add the "Compile" tool.
8) Select "Add" again.
9) Enter the following information: (Replace C:\Lexi\ with the appropriate folder)
Menu Item Name: Extract Source
Application/Command: C:\Lexi\ConvOtoS.cmd
Working Folder: C:\Lexi\
Command Line Parameters: %%np_name %%npne_name "%%name" "%%folder"
10) Click OK
11) Enjoy.

Thats it. Now, if you load a .BR file in MyEdit, you can select the "Extract Source" tool.
The file will be converted to a .BRS file and the new one will be loaded in MyEdit. If you
load a .BRS file, you can select the "Compile" tool, and the file will automatically be
"compiled" into a .BR file for you. Then simply load BR and test your new program.

This works with all versions of BR.

LIST OF ALL AVAILABLE FUNCTIONS:
Menu Item Name					Application	Parameters
==========================================	============	=========================================
Compile BR Program				ConvStoO.cmd	%%np_name %%npne_name "%%name" "%%folder"
Extract Source Code				ConvOtoS.cmd	%%np_name %%npne_name "%%name" "%%folder"
Debug BR Program**				DebugBR.cmd	%%np_name %%npne_name "%%name" "%%folder"
Run BR Program*					RunBR.cmd	%%np_name %%npne_name "%%name" "%%folder"
Extract Source Code and Strip Line Numbers	ConvOSNL.cmd	%%np_name %%npne_name "%%name" "%%folder"
Add Line Numbers				AddLN.cmd	%%np_name %%npne_name "%%name" "%%folder"
Strip Line Numbers				StripLN.cmd	%%np_name %%npne_name "%%name" "%%folder"

* Run BR Program requires that you have a copy of brnative.exe in the appropriate version sitting
in your application folder. This may not be possible in all situations. Use Compile BR Program in
situations where you cannot use Debug BR Program.
* Debug BR Program requires that you have a copy of brnative.exe at version 4.18 in your application folder,
and a copy of MyEdit BR Edition v3 or higher.

TIPS:
1) Inside the \Lexi\ folder you will find a copy of BR renamed to brnative.exe. It works
better if this brnative.exe is the same version of BR that you are using in your programs. So
copy your BR to this folder and replace brnative.exe with it.

2) If you are having some trouble "Extracting Source" and you installed MyEdit to a custom
location you will need to modify the file ConvOtoS.cmd to point to the proper location of
MyEdit.exe. Load it in a text editor and you'll see what I mean.

3) There is an additional tool called DebugBR.cmd. This only works if there is a working BR
file called brnative.exe in the same folder as your program files. You add it to the list the
same way as you did the other tools above.

4) This only works with a copy of MyEdit.exe dated 10/20/2006 or later.

5) The Express Install option only works with a copy of MyEdit from February 2010 or later. 
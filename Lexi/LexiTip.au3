Local $SplashWindow = WinWait("[Class:#32770]", "program is licensed for use",5)
if $SplashWindow > 0 then
   ControlClick($SplashWindow,"","Button1")
EndIf

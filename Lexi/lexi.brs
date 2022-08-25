! Lexi.br ! #Autonumber# 10,10
!  Primary Library for Lexi for adding and removing the line numbers
!    and Implementing special Lexi commands
!
!  Copyright 2003 Gabriel Bakker
!  Copyright 2007 Sage AX, LLC and Gabriel Bakker
!
!  This Version Made in Summer of 2019.
!
!    Lexi is a Lexical Preprocessor for the Business Rules language. It enables the BR Programmer
!     to use Modern Editors, and many modern program statements that aren't supported in BR directly.
!    Lexi makes line numbers optional, and adds Select Case, and Multiline Strings and Multiline Comments
!     and much much more, to Business Rules.
!
dim String$*4000,String2$*4000
dim Infile$*255
dim Const$(1)*800
dim Constname$(1)*30
dim Currentselect$*400,Trimmedline$*4000
dim Currentcase$(1)*400
dim AfterString$*4000
dim multicomment$*5000,backstring$*5000

dim BRProgram$(1)*2000

def library fnApplyLexi(InFile$*255,OutFile$*255;DontAddLineNumbers,SourceMapFile$*255,___,InFile,OutFile,Increment,LabelIncrement,SourceMapFile,SourceMap,RealCount,LineCount)
   let fnSetLexiConstants

   let Increment=1
   let Labelincrement=10
   mat Constname$(0)
   mat Const$(0)
   str2mat('=|+|-|+=|-=|*|/|,|&|(| and| or',mat continuations$,'|')

   open #(InFile:=FngetfileNo): "name="&Infile$, display, input
   open #(OutFile:=fnGetFileNo): "name="&Outfile$&", recl=800, replace", display, output
   if len(SourceMapFile$) then
      open #(SourceMapFile:=fnGetFileNo): "name="&SourceMapFile$&", recl=800, replace", display, output error Ignore
      let SourceMap=1
   end if

   READLINE: linput #InFile: String$ eof DONEREADING
      ! String Concatenation
      do while (CheckPosition:=fnPosNotInString(String$,StringConcatCommand$))
         let String$(CheckPosition:CheckPosition)="(inf:0)"
      loop

      ! Line Continuation
      do while (WrapPosition:=fnPosNotInString(String$,LineWrapCommand$))
         linput #InFile: String2$ eof Ignore
         let Linecount+=Increment
         let RealCount+=1
         if file(1)=0 then
            let String$=rtrm$(String$(1:WrapPosition-1))&" "&trim$(String2$)
         end if
      loop until file(1)

      let backstring$ = string$
      let multicomment$=''
      let continuationfound = 0
      let continuationposition = fncontinuationpos(string$,multicomment$,mat continuations$)
      do while continuationposition
         linput #InFile: String2$ eof DONEREADING
         let Linecount+=Increment
         let RealCount+=1
         let continuationposition = fncontinuationpos(string2$,multicomment$,mat continuations$)
         let String$=rtrm$(String$)&' '&trim$(String2$)
         let continuationfound = 1
      loop
 !
      if continuationfound then
         if multicomment$<>'' then String$(inf:inf)= '! '&multicomment$
      else
         let string$ = backstring$
      end if

      ! Backtick String processing
      !
      ! Check for a ` that is not inside "s .. so count from the beginning flagging if we're in "s
      !  if so, we're in special character processing mode. loop until the end of the string,
      !  which is a ` that is not immediately followed by another ` (we'll honor BR's normal stuff) ``
      !
      ! just like above, we put everything together on one line.
      !  Each new line should add a "&hex$("0D0A")&" and then the rest of the string.
      !   If a " is encountered, then turn it into a ""
      !   If a {Variable$} is encountered then turn it into "&Variable$&"
      !   If a {Variable} is encountered then turn it into "&str$(Variable)&"
      !
      let InQuotesSingle=0 : let InQuotesDouble=0 : let CheckPosition=0 : InComment=0
      do while CheckPosition<=len(String$)
         let CheckPosition+=1
         if pos("""",String$(CheckPosition:CheckPosition)) and ~InQuotesSingle then let InQuotesDouble=~InQuotesDouble
         if pos("'",String$(CheckPosition:CheckPosition)) and ~InQuotesDouble then let InQuotesSingle=~InQuotesSingle
         if pos("!",String$(CheckPosition:CheckPosition)) and ~InQuotesDouble and ~InQuotesSingle then let InComment=1
         if String$(CheckPosition:CheckPosition)="`" and ~InQuotesSingle and ~InQuotesDouble and ~InComment then
            ! pause
            ! Enable Special String Processing.
            ! Check from there to the end of the line.
            let String$(CheckPosition:CheckPosition)=""""
            let SpecialPosition=CheckPosition
            let SpecialStringProcessing=1
            do while SpecialStringProcessing
               let SpecialPosition+=1
               if SpecialPosition>len(String$) then
                  ! Read the next string and put it on here.
                  linput #InFile: String2$ eof Ignore
                  let Linecount+=Increment
                  let RealCount+=1
                  if file(1)=0 then
                     let String$=String$&"""&hex$(""0d0a"")&"""&trim$(String2$)
                     let SpecialPosition+=15
                  else
                     ! This is an error, the string isn't completed. Exit and let BR give the error.
                     let SpecialStringProcessing=0
                  end if
               else if String$(SpecialPosition:SpecialPosition)="`" then
                  ! If its followed by another one then
                  if len(String$)>=SpecialPosition+1 and String$(SpecialPosition+1:SpecialPosition+1)="`" then
                     ! Replace it with a single one.
                     let String$(SpecialPosition:SpecialPosition+1)="`"
                  else ! Otherwise
                     ! Replace it with a " and turn off SpecialStringProcessing.
                     let String$(SpecialPosition:SpecialPosition)=""""
                     let SpecialStringProcessing=0
                  end if
               else if String$(SpecialPosition:SpecialPosition+1)="{{" then
                  if (ReplacePosition:=pos(String$,"}}",SpecialPosition)) then
                     ! Replace everything from here to the }} with "&contents&".
                     if pos(String$(SpecialPosition:ReplacePosition),"$") then
                        let String$(ReplacePosition:ReplacePosition+1)="&"""
                        let String$(SpecialPosition:SpecialPosition+1)="""&"
                        let SpecialPosition=ReplacePosition+1
                     else
                        ! if there's no $ inside, then add a str$() around it.
                        let String$(ReplacePosition:ReplacePosition+1)=")&"""
                        let String$(SpecialPosition:SpecialPosition+1)="""&str$("
                        let SpecialPosition=ReplacePosition+7
                     end if
                  end if
               else if String$(SpecialPosition:SpecialPosition)="""" then
                  ! if its a single double quote, replace it with 2 double quotes.
                  let String$(SpecialPosition:SpecialPosition)=""""""
                  let SpecialPosition+=1
               end if
            loop
            let CheckPosition=SpecialPosition
         end if
      loop

      ! Multi Line Comments
      !
      ! While we're at it we should support multi-line comments using /* and */. Those will be easier.
      /*
      At the position of the BeginningCommentMark replace it with a !.
      At every line in between there, add a ! to the beginning.
      At the position of the EndCommentMark Put all the stuff before it after it, and vice versa, and change it to a !
      */
      if MultilineComment then
         if (SpecialPosition:=fnPosNotInString(String$,CommentEndCommand$)) then
            let MultilineComment=0
            let String$=String$(SpecialPosition+2:len(String$))&" ! "&String$(1:SpecialPosition-1)
         else
            let String$(1:0)=" ! "
         end if
      else
         if (ReplacePosition:=fnPosNotInString(String$,CommentStartCommand$)) then
            let MultilineComment=1
            let String$(ReplacePosition:ReplacePosition+1)="!"
         end if
      end if
 !
      ! Line Continuation
      if not SkipNextOne and (ltrm$(String$)(1:1)="!" and pos(String$,"!")>3) then let String$(1:4)=" ! ."&ltrm$(string$(1:4))

      ! Define Substituions - Apply
      for Constindex=1 to Udim(Mat Const$)
         if (Constantposition:=Pos(Uprc$(String$),Uprc$(Constname$(Constindex)))) then
            let String$=String$(1:Constantposition-1) & Const$(Constindex) & String$(Constantposition+Len(Constname$(Constindex)):Len(String$))
         end if
      next Constindex

      ! Define Substitutions
      if (Constantposition:=fnPosNotInString(String$,DefineCommand$,0,1)) then
         let Constantposition+=8
         if (Constnamestartpos:=Pos(String$,"[[",Constantposition)) then
            if (Constnameendpos:=Pos(String$,"]]",Constnamestartpos)) then
               let Constnameendpos+=1
               mat Const$(Constindex:=(Udim(Mat Const$)+1))
               mat Constname$(Constindex)
               let Constname$(Constindex)=String$(Constnamestartpos:Constnameendpos)
               let Const$(Constindex)=Trim$(String$(Constnameendpos+2:Len(String$)))
               if Const$(Constindex)(1:1)="=" then ! If Equals, Then Ignore It
                  let Const$(Constindex)=Trim$(Const$(Constindex)(2:Len(Const$(Constindex))))
               end if
               if Const$(Constindex)(1:1)='"' And Const$(Constindex)(Len(Const$(Constindex)):Len(Const$(Constindex)))='"' then
                  let Const$(Constindex)=Const$(Constindex)(2:Len(Const$(Constindex))-1) ! Remove Quotes If Both Are Present
               end if
            end if
         end if
      end if

      ! Select Case
      if (Selectposition:=fnPosNotInString(String$,SelectCommand$,0,1)) then
         if (Caseposition:=fnPosNotInString(String$,CaseCommand$,Selectposition,1)) then
            let Currentselect$=String$(Selectposition+8:Caseposition-1)
            let Caseindex=0
            let Currentcasechunk=Caseposition+6
            do
               let Caseindex+=1
               mat Currentcase$(Caseindex)
               if (Nextcasechunk:=Pos(String$,"#",Currentcasechunk)) then
                  let Currentcase$(Caseindex)=String$(Currentcasechunk:Nextcasechunk-1)
                  let Currentcasechunk=Nextcasechunk+1
               else
                  let Currentcase$(Caseindex)=String$(Currentcasechunk:Len(String$))
               end if
            loop While Nextcasechunk
            let Afterstring$=" then  ! " & String$(SelectPosition:Len(String$))
            let String$=String$(1:SelectPosition-1) & "if "
            for Caseindex=1 to Udim(Mat Currentcase$)
               if Caseindex>1 then
                  let String$=String$ & " or "
               end if
               let String$=String$ & Trim$(Currentselect$) & " = " & Trim$(Currentcase$(Caseindex))
            next Caseindex
            let String$ = String$ & Afterstring$
         end if
      else if (Caseposition:=fnPosNotInString(String$,CaseCommand$,0,1)) then
         if Len(Trim$(Currentselect$)) then
            let Caseindex=0
            let Currentcasechunk=Caseposition+6
            do
               let Caseindex+=1
               mat Currentcase$(Caseindex)
               if (Nextcasechunk:=Pos(String$,"#",Currentcasechunk)) then
                  let Currentcase$(Caseindex)=String$(Currentcasechunk:Nextcasechunk-1)
                  let Currentcasechunk=Nextcasechunk+1
               else
                  let Currentcase$(Caseindex)=String$(Currentcasechunk:Len(String$))
               end if
            loop While Nextcasechunk
            let Afterstring$=" then  ! " & String$(Caseposition:Len(String$))
            let String$=String$(1:Caseposition-1) & "else if "
            for Caseindex=1 to Udim(Mat Currentcase$)
               if Caseindex>1 then
                  let String$=String$ & " or "
               end if
               let String$=String$ & Trim$(Currentselect$) & " = " & Trim$(Currentcase$(Caseindex))
            next Caseindex
            let String$ = String$ & Afterstring$
         end if
      else if (Caseposition:=fnPosNotInString(String$,CaseElseCommand$,0,1)) then
         if Len(Trim$(Currentselect$)) then
            let String$ = String$(1:Caseposition-1) & "else " & String$(Caseposition+11:Len(String$)) & " ! " & String$(Caseposition:Len(String$))
         end if
      else if (Endposition:=fnPosNotInString(String$,EndSelectCommand$,0,1)) then
         let String$ = String$(1:EndPosition-1) & "end if" & String$(EndPosition+12:len(String$)) & "  ! " & String$(EndPosition:len(String$))
         let Currentselect$ = ""
      end if

      if DontAddLineNumbers then goto PrintLine ! Skip down to PrintLine

      ! Auto Number Code
      if (Newnumber:=fnPosNotInString(String$,AutonumberCommand$,0,1)) then
         let Temp=0
         let Temp=Val(String$(Newnumber+12:Newincrement:=Pos(String$,",",Newnumber+12))) conv BADAUTONUMBER
         if Temp=0 then goto BADAUTONUMBER
         let Newlinecount=Temp
         if Newlinecount<=Linecount then print "AUTONUMBER ERROR IN "&Str$(Lastlinecount)&" TO "&Str$(Newlinecount)&" AUTONUMBER SECTION" : close #InFile: : close #OutFile: : execute ("*FREE "&Outfile$) : print Bell : pause : execute ("SYSTEM")
         let Lastlinecount=Linecount=Newlinecount
         let Increment=Val(String$(Newincrement+1:4000)) conv BADAUTONUMBER
         let Linecount-=Increment ! Decrement So Next Increment Is Correct
      end if

      ! Handle L Labels Automatic Renumbering
      if (Ltrm$(Uprc$(String$))(1:1)="L") And (Newnumber:=Pos(Ltrm$(Uprc$(String$))(1:7),":")) then
         let Newlinecount=Val(Ltrm$(Uprc$(String$))(2:Newnumber-1)) conv BADAUTONUMBER
         if (Newlinecount>Linecount) then
            let Linecount=Newlinecount
            if Mod(Linecount,Labelincrement)=0 then let Increment=Labelincrement
            let Linecount-=Increment ! Decrement So Next Num Is Correct
         else
            let Increment=Max(Int(Increment/2),2) ! Cut Incr In Half To Catch Up
         end if
      end if

   BADAUTONUMBER: ! Ignore Line Number Information
      let X=0
      let X = Val(String$(1:5)) conv ADDLINENUMBER
      if X>0 then goto PRINTLINE

   ADDLINENUMBER: !
      if Not Skipnextone then
         if Trim$(String$)="" then
            let String$=Cnvrt$("PIC(#####)",(Linecount:=Linecount+Increment)) & "  !"
         else
            let String$=Cnvrt$("PIC(#####)",(Linecount:=Linecount+Increment)) & " " & String$
         end if
      else
         let String$="      "&String$
         let Skipnextone=0
      end if
      let RealCount+=1
      if SourceMap then
         print #SourceMapFile: str$(LineCount)&","&str$(RealCount)
      end if
   PRINTLINE: !
      if Trim$(String$)(Len(Trim$(String$))-1:Len(Trim$(String$))) = "!:" then let Skipnextone=1
      print #OutFile: String$
   goto READLINE

DONEREADING: !
   close #OutFile:
   close #InFile:
   if SourceMap then close #SourceMapFile:
fnend
!
def fncontinuationpos( &strng$, &multicomment$, mat continuations$;___,exclsrchstart,continuationpos,singlequotecount,doublequotecount,exclpos,colonpos,i,tempstr$*5000,tempcomm$*5000)
   exclsrchstart = 1
   tempstr$ = strng$ : tempcomm$ = multicomment$
   do
      exclpos=pos(strng$,'!',exclsrchstart)
      colonpos=pos(strng$,':',exclsrchstart)
      underscrorepos =pos(strng$,'_',exclsrchstart)
      exclsrchstart = exclpos+1 ! move search start forward for next iteration of the loop
      if exclpos and exclpos+1 <> colonpos and not (underscrorepos and underscrorepos=exclpos+1) then ! if not ! :
         singlequotecount = 0 : doublequotecount = 0
         for i=1 to exclpos -1
            if strng$(i:i)="'" then singlequotecount+=1
            if strng$(i:i)='"' then doublequotecount+=1
         next i
         ! even number of quotes preceding ! means this is a comment and not a exclamation in the middle of a string literal,
         ! such as PRINT "exclamation in a literal!!! followed by more literal"
         if mod(singlequotecount,2)=0 and mod(doublequotecount,2)=0 then
            multicomment$(inf:inf) = strng$ (exclpos+1:inf)
            strng$ (exclpos:inf) = ''
            strng$=trim$(strng$) ! must trim for continuation check below
            exit do
         end if
      end if
   loop while exclpos
   !  checking for continuations is much cleaner after removing comments,
   !  so this is why it's done after checking for comments
   i = 1
   do while i <= udim(continuations$)
      continuationpos = pos(uprc$(strng$),uprc$(continuations$(i)), len(strng$)-len(continuations$(i))+1)
      if continuationpos then
         exit do
      end if
      i += 1
   loop
   !
   fncontinuationpos = continuationpos
fnend

def fnSetLexiConstants
   let LineWrapCommand$="!"&"_"
   let StringConcatCommand$="&"&"="
   let DefineCommand$="#DEF"&"INE#"
   let SelectCommand$="#SEL"&"ECT#"
   let CaseCommand$="#CA"&"SE#"
   let CaseElseCommand$="#CASE"&" ELSE#"
   let EndSelectCommand$="#END"&" SELECT#"
   let AutonumberCommand$="#AUTO"&"NUMBER#"
   let CommentStartCommand$="/"&"*"
   let CommentEndCommand$="*"&"/"
fnend

def FngetfileNo(;___,I)
   do
      I+=1
      if I>=199 and I<300 then let I=300  ! Skip over the invalid 200s
   loop until File(I)=-1
   let FngetfileNo=(I)
fnend

def library fnUndoLexi(InFile$*255,OutFile$*255)
   let fnSetLexiConstants
   open #(InFile:=FngetfileNo): "name="&Infile$&", recl=800", display, input
   open #(OutFile:=fnGetFileNo): "name="&Outfile$&", recl=800, replace", display, output

READLINEUNDO: linput #InFile: String$ eof DONEREADINGUNDO
   for Constindex=1 to Udim(Mat Const$)
      if (Constantposition:=Pos(Uprc$(String$),Uprc$(Const$(Constindex)))) then
         let String$=String$(1:Constantposition-1) & Constname$(Constindex) & String$(Constantposition+Len(Const$(Constindex)):Len(String$))
      end if
   next Constindex
   if (Constantposition:=fnPosNotInString(String$,DefineCommand$,0,1)) then
      let Constantposition+=8
      if (Constnamestartpos:=Pos(String$,"[[",Constantposition)) then
         if (Constnameendpos:=Pos(String$,"]]",Constnamestartpos)) then
            let Constnameendpos+=1
            mat Const$(Constindex:=(Udim(Mat Const$)+1))
            mat Constname$(Constindex)
            let Constname$(Constindex)=String$(Constnamestartpos:Constnameendpos)
            let Const$(Constindex)=Trim$(String$(Constnameendpos+2:Len(String$)))
            if Const$(Constindex)(1:1)="=" then ! If Equals, Then Ignore It
               let Const$(Constindex)=Trim$(Const$(Constindex)(2:Len(Const$(Constindex))))
            end if
            if Const$(Constindex)(1:1)='"' And Const$(Constindex)(Len(Const$(Constindex)):Len(Const$(Constindex)))='"' then
               let Const$(Constindex)=Const$(Constindex)(2:Len(Const$(Constindex))-1) ! Remove Quotes If Both Are Present
            end if
         end if
      end if
   end if
   if (Selectposition:=fnPosNotInString(String$,SelectCommand$,0,1)) then
      if (Caseposition:=fnPosNotInString(String$,CaseCommand$,Selectposition,1)) then
         if (IfPosition:=Pos(Uprc$(String$),"IF ")) then
            let String$=String$(1:IfPosition-1) & String$(SelectPosition:len(String$))
            let CurrentlyInCaseStatement=1
         end if
      end if
   else if (Caseposition:=fnPosNotInString(String$,CaseCommand$,0,1)) then
      if CurrentlyInCaseStatement then
         let String$ = String$(1:pos(uprc$(string$),"ELSE IF")-1) & String$(CasePosition:len(String$))
      end if
   else if (Caseposition:=fnPosNotInString(String$,CaseElseCommand$,0,1)) then
      if CurrentlyInCaseStatement then
         let String$ = String$(1:pos(uprc$(string$),"ELSE ")-1) & String$(CasePosition:len(String$))
      end if
   else if (Endposition:=fnPosNotInString(String$,EndSelectCommand$,0,1)) then  !
      if CurrentlyInCaseStatement then
         let String$ = String$(1:pos(uprc$(String$),"END IF")-1) & String$(EndPosition:len(String$))
         let CurrentlyInCaseStatement=0
      end if
   end if

   if trim$(string$(1:5))="" then
      if string$(6:6)=" " then
         let String$=String$(7:4000)
      else
         let String$=String$(6:4000)
      end if
      goto NOLINENUMBER
   end if
   let X=Val(String$(1:5)) conv NOLINENUMBER
   if (X>0) And String$(6:6)=" " then let String$=String$(7:4000)
NOLINENUMBER: ! A Line Has No Line Number At This Point
   print #OutFile: String$
   goto READLINEUNDO
DONEREADINGUNDO: !
   close #OutFile:
   close #InFile:
fnend

def fnPosNotInString(&String$,Thing$*32;StartPosition,CaseInsensitive,___,CheckDirection,InQuotesSingle,InQuotesDouble,InComment,CheckPosition,Found)

   ! Before we do our detailed checking lets do a quick "POS"
   !  This will save time then checking everything .. if its not in the string
   !   at all then we don't have to worry about checking the string closely.
   if (CaseInsensitive and pos(uprc$(String$),uprc$(Thing$))) or (~CaseInsensitive and pos(String$,Thing$)) then

      let CheckDirection=1
      if StartPosition>0 then
         let CheckPosition=StartPosition-1
      else if StartPosition<0 then
         let CheckDirection=-1
         let CheckPosition=len(String$)+(StartPosition)+1
      end if

      let CheckPosition=min(len(String$)+1,CheckPosition)
      let CheckPosition=max(0,CheckPosition)

      do while CheckPosition<=len(String$) and CheckPosition>=0
         let CheckPosition+=CheckDirection
         if pos("""",String$(CheckPosition:CheckPosition)) and ~InQuotesSingle then let InQuotesDouble=~InQuotesDouble
         if pos("'",String$(CheckPosition:CheckPosition)) and ~InQuotesDouble then let InQuotesSingle=~InQuotesSingle
         ! if pos("!",String$(CheckPosition:CheckPosition)) and ~InQuotesDouble and ~InQuotesSingle then let InComment=1
         if ~InQuotesSingle and ~InQuotesDouble then
            if (CaseInsensitive and uprc$(Thing$)=uprc$(String$(CheckPosition:CheckPosition+len(Thing$)-1))) or (~CaseInsensitive and Thing$=String$(CheckPosition:CheckPosition+len(Thing$)-1)) then
               let Found=CheckPosition
            end if
         end if
      loop until Found
      let fnPosNotInString=Found
   end if
fnend

Ignore: Continue

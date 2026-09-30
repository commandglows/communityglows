; Installed-package metadata only; the executable exits before Tauri/UI/auth.
!macro NSIS_HOOK_POSTINSTALL
  ClearErrors
  ExecWait '"$INSTDIR\${MAINBINARYNAME}.exe" --record-onboarding-installation' $0
  ${If} ${Errors}
  ${OrIf} $0 != 0
    MessageBox MB_ICONSTOP "CommunityGlows installation could not be confirmed. Please reinstall the package."
    SetErrorLevel 1
    Abort
  ${EndIf}
!macroend

; Tauri invokes POSTUNINSTALL only after its running-app cancellation check.
; The unlisted witness keeps $INSTDIR non-empty until this final cleanup.
!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$INSTDIR\communityglows-onboarding-installation-v1"
  RMDir "$INSTDIR"
!macroend

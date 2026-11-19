$ErrorActionPreference = "Continue"
Set-Location c:\intern\portal
$p = Start-Process -FilePath "npx.cmd" -ArgumentList "next","start","-p","3100" -PassThru -WindowStyle Hidden
Start-Sleep 8
$base = "http://localhost:3100"
$pw = "Passw0rd!Demo"

function Try-Req($method, $url, $body, $session, $headers) {
  try {
    $a = @{ Uri = $url; Method = $method; MaximumRedirection = 0; UseBasicParsing = $true; ErrorAction = "Stop" }
    if ($body) { $a.Body = ($body | ConvertTo-Json); $a.ContentType = "application/json" }
    if ($session) { $a.WebSession = $session }
    if ($headers) { $a.Headers = $headers }
    $r = Invoke-WebRequest @a
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $r.Content }
  } catch {
    $r = $_.Exception.Response
    if ($r) { return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = "" } }
    return [pscustomobject]@{ Status = -1; Body = $_.Exception.Message }
  }
}
function Check($name, $actual, $expected) {
  $ok = ($actual -eq $expected)
  "{0,-58} {1}  (got {2}, want {3})" -f $name, $(if ($ok) { "PASS" } else { "FAIL" }), $actual, $expected
}
function Login($user, $session) {
  Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body (@{ username = $user; password = $pw } | ConvertTo-Json) -ContentType "application/json" -WebSession $session -UseBasicParsing | Out-Null
}
function Csrf($session) { @{ "x-csrf-token" = ($session.Cookies.GetCookies($base) | Where-Object Name -eq "ipm_csrf").Value } }

$admin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "admin@beat.local" $admin
Check "Admin GET /admin" (Try-Req GET "$base/admin" $null $admin).Status 200
Check "Admin GET /admin/users" (Try-Req GET "$base/admin/users" $null $admin).Status 200
Check "Admin GET /admin/grants" (Try-Req GET "$base/admin/grants" $null $admin).Status 200
Check "Admin GET /admin/template" (Try-Req GET "$base/admin/template" $null $admin).Status 200
Check "Admin GET /admin/logs" (Try-Req GET "$base/admin/logs" $null $admin).Status 200
Check "Admin POST /api/interns blocked (403)" (Try-Req POST "$base/api/interns" @{ name="X" } $admin (Csrf $admin)).Status 403

$hr = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "hr@beat.local" $hr
Check "HR GET /hr" (Try-Req GET "$base/hr" $null $hr).Status 200
Check "HR GET /hr/interns" (Try-Req GET "$base/hr/interns" $null $hr).Status 200
Check "HR GET /hr/certificates" (Try-Req GET "$base/hr/certificates" $null $hr).Status 200

$m1 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "mentor1@beat.local" $m1
Check "Mentor GET /mentor" (Try-Req GET "$base/mentor" $null $m1).Status 200
Check "Mentor GET /mentor/interns" (Try-Req GET "$base/mentor/interns" $null $m1).Status 200
Check "Mentor GET /mentor/projects" (Try-Req GET "$base/mentor/projects" $null $m1).Status 200
Check "Mentor GET /mentor/assignments" (Try-Req GET "$base/mentor/assignments" $null $m1).Status 200
Check "Mentor GET /mentor/extensions" (Try-Req GET "$base/mentor/extensions" $null $m1).Status 200
Check "Mentor GET /mentor/presentations" (Try-Req GET "$base/mentor/presentations" $null $m1).Status 200

$i1 = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "intern1@beat.local" $i1
Check "Intern GET /intern" (Try-Req GET "$base/intern" $null $i1).Status 200
Check "Intern GET /intern/assignments" (Try-Req GET "$base/intern/assignments" $null $i1).Status 200
Check "Intern GET /intern/presentations" (Try-Req GET "$base/intern/presentations" $null $i1).Status 200
Check "Intern GET /intern/certificate" (Try-Req GET "$base/intern/certificate" $null $i1).Status 200
Check "Intern GET /notifications" (Try-Req GET "$base/notifications" $null $i1).Status 200

Check "Cron POST /api/cron/reminders with secret" (Try-Req POST "$base/api/cron/reminders" $null $null @{ "x-cron-secret" = "change-me-cron-secret" }).Status 200

Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "next.*start|3100" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

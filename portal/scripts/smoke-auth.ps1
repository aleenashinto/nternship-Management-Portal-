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
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Loc = $r.Headers.Location; Body = $r.Content }
  } catch {
    $r = $_.Exception.Response
    if ($r) { return [pscustomobject]@{ Status = [int]$r.StatusCode; Loc = $r.Headers.Location; Body = "" } }
    return [pscustomobject]@{ Status = -1; Loc = ""; Body = $_.Exception.Message }
  }
}
function Check($name, $actual, $expected) {
  $ok = ($actual -eq $expected)
  "{0,-58} {1}  (got {2}, want {3})" -f $name, $(if ($ok) { "PASS" } else { "FAIL" }), $actual, $expected
}
function Login($user, $session) {
  Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body (@{ username = $user; password = $pw } | ConvertTo-Json) -ContentType "application/json" -WebSession $session -UseBasicParsing | Out-Null
}
function Csrf($session) { ($session.Cookies.GetCookies($base) | Where-Object Name -eq "ipm_csrf").Value }

$r = Try-Req GET "$base/admin"; Check "anon GET /admin redirects" $r.Status 307; Check "  -> /login" ([string]$r.Loc).EndsWith("/login") $true
$r = Try-Req GET "$base/api/auth/me"; Check "anon GET /api/auth/me" $r.Status 401
$r = Try-Req POST "$base/api/auth/login" @{ username = "admin@beat.local"; password = "wrong" }; Check "login wrong password" $r.Status 401
$r = Try-Req POST "$base/api/auth/login" @{ username = ""; password = "" }; Check "login invalid body (zod)" $r.Status 400

$admin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "admin@beat.local" $admin
$r = Try-Req GET "$base/api/auth/me" $null $admin; Check "admin /api/auth/me after login" $r.Status 200
$r = Try-Req GET "$base/admin" $null $admin; Check "admin GET /admin" $r.Status 200
$r = Try-Req GET "$base/mentor" $null $admin; Check "admin may enter /mentor area" $r.Status 200
$r = Try-Req POST "$base/api/auth/logout" $null $admin; Check "logout WITHOUT csrf header blocked" $r.Status 403
$r = Try-Req POST "$base/api/auth/logout" $null $admin @{ "x-csrf-token" = (Csrf $admin) }; Check "logout WITH csrf header" $r.Status 200
$r = Try-Req GET "$base/api/auth/me" $null $admin; Check "me after logout" $r.Status 401

$m = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "mentor1@beat.local" $m
$r = Try-Req GET "$base/admin" $null $m; Check "mentor GET /admin redirected" $r.Status 307
$r = Try-Req GET "$base/hr" $null $m; Check "mentor GET /hr redirected" $r.Status 307
$r = Try-Req GET "$base/mentor" $null $m; Check "mentor GET /mentor" $r.Status 200

$hr = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Login "hr@beat.local" $hr
$r = Try-Req GET "$base/mentor" $null $hr; Check "HR GET /mentor redirected" $r.Status 307

$hdrs = @{ Origin = "http://evil.example" }
$r = Try-Req POST "$base/api/auth/login" @{ username = "x"; password = "y" } $null $hdrs; Check "cross-origin login POST blocked" $r.Status 403

$last = 0; 1..7 | ForEach-Object { $last = (Try-Req POST "$base/api/auth/login" @{ username = "ratelimit@test.local"; password = "bad" }).Status }
Check "rate limit after repeated failures" $last 429

Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match "next.*start|3100" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

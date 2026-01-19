$projectDir = Get-ChildItem C:\cursor_ws -Directory | Where-Object { $_.Name -match "에듀테크" } | Select-Object -First 1 -ExpandProperty FullName
Set-Location $projectDir
python read_excel.py


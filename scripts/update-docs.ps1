# Скрипт для автоматического обновления технической документации (PowerShell)
# Запускается после каждого коммита через Git hook

Write-Host "📝 Обновление технической документации..." -ForegroundColor Cyan

# Получаем текущую дату
$CurrentDate = Get-Date -Format "yyyy-MM-dd"

# Обновляем дату последнего обновления в TECHNICAL_DOCUMENTATION.md
if (Test-Path "docs/TECHNICAL_DOCUMENTATION.md") {
    $content = Get-Content "docs/TECHNICAL_DOCUMENTATION.md" -Raw
    $content = $content -replace '\*\*Дата обновления:\*\*.*', "**Дата обновления:** ${CurrentDate}"
    $content = $content -replace '\*\*Последнее обновление:\*\*.*', "**Последнее обновление:** ${CurrentDate}"
    Set-Content "docs/TECHNICAL_DOCUMENTATION.md" -Value $content -NoNewline
    Write-Host "✅ Обновлена дата в TECHNICAL_DOCUMENTATION.md" -ForegroundColor Green
}

# Проверяем изменения в API
$apiChanges = git diff --cached --name-only | Select-String "app/api/"
if ($apiChanges) {
    Write-Host "⚠️  Обнаружены изменения в API. Пожалуйста, обновите docs/API.md и docs/TECHNICAL_DOCUMENTATION.md" -ForegroundColor Yellow
}

# Проверяем изменения в типах
$typesChanges = git diff --cached --name-only | Select-String "lib/types.ts"
if ($typesChanges) {
    Write-Host "⚠️  Обнаружены изменения в типах. Пожалуйста, обновите docs/TECHNICAL_DOCUMENTATION.md (раздел 'Компоненты и модули')" -ForegroundColor Yellow
}

# Проверяем изменения в SQL миграциях
$sqlChanges = git diff --cached --name-only | Select-String "\.sql$"
if ($sqlChanges) {
    Write-Host "⚠️  Обнаружены изменения в SQL миграциях. Пожалуйста, обновите docs/TECHNICAL_DOCUMENTATION.md (раздел 'База данных')" -ForegroundColor Yellow
}

# Проверяем изменения в компонентах
$componentsChanges = git diff --cached --name-only | Select-String "components/"
if ($componentsChanges) {
    Write-Host "⚠️  Обнаружены изменения в компонентах. Пожалуйста, обновите docs/TECHNICAL_DOCUMENTATION.md (раздел 'Компоненты и модули')" -ForegroundColor Yellow
}

# Проверяем изменения в зависимостях
$packageChanges = git diff --cached --name-only | Select-String "package.json"
if ($packageChanges) {
    Write-Host "⚠️  Обнаружены изменения в зависимостях. Пожалуйста, обновите docs/TECHNICAL_DOCUMENTATION.md (раздел 'Технический стек')" -ForegroundColor Yellow
}

# Проверяем изменения в переменных окружения
$envChanges = git diff --cached --name-only | Select-String "\.env"
if ($envChanges) {
    Write-Host "⚠️  Обнаружены изменения в переменных окружения. Пожалуйста, обновите docs/TECHNICAL_DOCUMENTATION.md (раздел 'Переменные окружения')" -ForegroundColor Yellow
}

Write-Host "✅ Обновление документации завершено" -ForegroundColor Green

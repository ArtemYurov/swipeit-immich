# Plan: Android prerelease workflow (GitHub Actions)

**Branch:** `feature/android-prerelease-workflow`
**Base branch:** `ai-factory-init` (содержит AI Factory tooling; будет смерджен в `master` отдельно)
**Created:** 2026-04-25
**Mode:** full

## Overview

Автоматизировать сборку Android-варианта Immich Swipe (Expo managed workflow) на каждый push в `master` с изменениями в `mobile/**`. Результат — debug-signed APK, опубликованный как **GitHub prerelease**. В разделе Releases всегда виден ровно один prerelease — самый свежий, остальные удаляются вместе с git-тегами.

Шаблон логики prerelease адаптирован из проекта TomoBar (`~/Projects/macos/tomobar/TomoBar/.github/workflows/release.yml`).

## Settings

- **Testing:** No (workflow YAML; валидация — actionlint вручную и реальный запуск через `workflow_dispatch`)
- **Logging:** Verbose (echo с эмодзи-маркерами на каждом шаге для удобства первой диагностики)
- **Docs:** Warn-only (без обязательного docs checkpoint; README обновим отдельно по факту)
- **Roadmap linkage:** N/A (roadmap для проекта пока не создан)

## Build numbering scheme

```
${slug}-${branch}-${count}-${sha7}

slug    = immich-swipe          (mobile/app.json:expo.slug)
branch  = ${GITHUB_REF_NAME//\//-}   (master, либо feature-foo для feature/foo)
count   = git rev-list --count HEAD  (общее число коммитов в ветке)
sha7    = git rev-parse --short=7 HEAD

example: immich-swipe-master-127-a360017
```

Используется как:
- `tag_name` GitHub Release (= git tag)
- `name` Release ("Prerelease ${VERSION}")
- имя файла APK (`${VERSION}.apk`)

## Trigger

```
on:
  push:
    branches: [master]
    paths:
      - 'mobile/**'
      - '.github/workflows/android-prerelease.yml'
  workflow_dispatch: {}
```

`paths` filter экономит CI-минуты: коммиты в `client/**` (web) **не** запускают android-сборку. `workflow_dispatch` нужен для ручного дёрга при отладке без push'а.

## Pipeline (high-level)

```
checkout (fetch-depth: 0)
   |
   v
compute version  -> id=version, outputs.version
   |
   v
setup-node (20, npm cache) + setup-java (Temurin 17) + setup-android@v3
   |
   v
npm ci (in mobile/)
   |
   v
expo prebuild --platform android --no-install --clean
   |
   v
gradle assembleDebug (in mobile/android/)
   |
   v
rename app-debug.apk -> ${VERSION}.apk -> id=apk, outputs.apk_path
   |
   v
softprops/action-gh-release@v1 (draft prerelease, files=apk)
   |
   v
gh release edit --draft=false  (publish)
   |
   v
gh release list -> tail -n +2 -> delete release + git tag (continue-on-error)
```

## Tasks

### Phase 1 — Skeleton & toolchain (T1-T4)

- [x] **T1** [#8] — Создать `.github/workflows/android-prerelease.yml` со скелетом triggers + permissions + env + jobs.build runs-on/defaults
- [x] **T2** [#9] — Step `actions/checkout@v4` с `fetch-depth: 0`
- [x] **T3** [#10] — Step `Compute version` (id=version) — формирование `immich-swipe-{branch}-{count}-{sha7}` и запись в `$GITHUB_OUTPUT`
- [x] **T4** [#11] — Toolchain: setup-node@v4 (20, npm cache), setup-java@v4 (Temurin 17), android-actions/setup-android@v3

→ **Commit checkpoint 1:** `chore(ci): scaffold android prerelease workflow with version + toolchain`

### Phase 2 — Build pipeline (T5-T8)

- [x] **T5** [#12] — Step `Install mobile deps` (`npm ci` в mobile/)
- [x] **T6** [#13] — Step `Expo prebuild` (`npx expo prebuild --platform android --no-install --clean`)
- [x] **T7** [#14] — Step `Gradle assembleDebug` (chmod +x gradlew, `./gradlew assembleDebug --no-daemon --stacktrace`)
- [x] **T8** [#15] — Step `Rename APK` (id=apk, `mv app-debug.apk ${VERSION}.apk`, output `apk_path`)

→ **Commit checkpoint 2:** `feat(ci): add android prerelease build pipeline`

### Phase 3 — Release & cleanup (T9-T11)

- [x] **T9** [#16] — Step `softprops/action-gh-release@v1` (draft prerelease, files=apk_path)
- [x] **T10** [#17] — Step `Publish prerelease` (`gh release edit --draft=false` + echo URL)
- [x] **T11** [#18] — Step `Cleanup old prereleases` (`gh release list` + jq + tail -n +2 + delete release + delete git tag, `continue-on-error: true`)

→ **Commit checkpoint 3:** `feat(ci): publish android prereleases with cleanup of old releases`

## Dependency graph

```
T1 ── T2 ── T3 ── T4 ── T5 ── T6 ── T7 ── T8 ── T9 ── T10 ── T11
                  ↑                       ↑
                  └─── reused in T8 ──────┘
                  (steps.version.outputs.version)
```

Все задачи последовательны по `blockedBy`. Особенность: T8 зависит и от T7 (нужен APK файл), и от T3 (нужна version-output для имени).

## Files affected

- **Создаётся:** `.github/workflows/android-prerelease.yml` (единственный новый файл)

Других изменений нет — README обновим отдельной задачей при необходимости.

## Out of scope (sticky decisions)

Зафиксировано в обсуждении и **не входит** в этот план:

- ❌ Подпись release-keystore — пока debug-signed достаточно
- ❌ AAB / Play Store integration — отложено
- ❌ Кэш Gradle (`~/.gradle/caches`) — добавим, если время сборки станет проблемой
- ❌ Web-клиент CI — отдельный план, не в этом
- ❌ iOS build — нужен macOS runner и Apple-сертификаты

## Validation (после merge в master)

1. Локально проверить YAML через `actionlint` (если установлен).
2. После merge — открыть Actions tab, дёрнуть `workflow_dispatch` руками.
3. Проверить, что:
   - Job `build` зелёный.
   - В Releases появился prerelease с тегом `immich-swipe-master-N-XXXXXXX`.
   - APK скачивается и устанавливается на Android-устройстве (debug-signed).
4. Сделать второй push в `mobile/**` → проверить, что:
   - Создан **новый** prerelease с инкрементированным `count`.
   - **Старый** prerelease и его git-тег удалены (`gh release list` показывает один prerelease).

## Settings passed to /aif-implement

```yaml
testing: false
logging: verbose
docs: warn-only
roadmap_linkage: none
```

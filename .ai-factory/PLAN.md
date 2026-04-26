# Fix Android CI workflow: bundle JS + stable signing

**Mode:** fast
**Created:** 2026-04-26
**Branch:** feature/android-prerelease-workflow

## Settings

- **Testing:** No (CI workflow change — verification via smoke-test on real device)
- **Logging:** Verbose (emoji-маркированные статусы в шагах workflow, согласовано с существующим стилем)
- **Docs:** Warn-only (одна строка-указатель в README, остальное — внутри workflow как SSOT)
- **CI verification:** Yes — отдельный smoke-test после реализации

## Context

APK, собираемый текущим workflow `.github/workflows/android-build.yml`, после установки на телефон показывает бесконечный сплеш-экран. Корневая причина установлена через `adb logcat`:

```
unknown:BridgelessReact: handleHostException: "Unable to load script.
Make sure you're running Metro or that your bundle 'index.android.bundle'
is packaged correctly for release."
```

Workflow собирает через `./gradlew assembleDebug`. Для React Native + Expo debug-вариант **не вшивает JS-bundle в APK** — он рассчитан на запуск рядом с Metro packager. На телефоне без Metro приложение виснет на сплеше.

Дополнительно: каждый запуск workflow на ubuntu-latest получает свежий `~/.android/debug.keystore`, поэтому подпись APK меняется между билдами и Android отказывается ставить новую версию поверх старой (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`).

## Approach

**Вариант D** (см. RESEARCH.md): держать `assembleDebug`, но добавить два дополнительных шага:

1. Восстанавливать **стабильный** debug-keystore из GH Secret в `~/.android/` перед сборкой — gradle подхватывает по convention, никаких правок build.gradle (это важно потому что `expo prebuild --clean` пересоздаёт android/ на каждом запуске).
2. Запускать `npx expo export:embed` после prebuild и до gradle, чтобы JS-bundle оказался внутри APK.

Подпись остаётся debug-уровня (хардкод `storepass=android`), но **стабильна между билдами**, т.к. keystore приходит из секрета, а не генерится заново.

## Architecture changes

```
.github/workflows/android-build.yml         ← правка (3 новых step)
README.md                                   ← +1 короткий подраздел
GitHub repo Settings → Secrets              ← +1 secret: ANDROID_DEBUG_KEYSTORE_BASE64
```

Никаких изменений в коде приложения, в build.gradle, в app.json. Только CI и документация.

## Tasks

### Phase 1: One-time setup

- **Task #1** — Сгенерировать stable debug keystore локально и загрузить в GH Secret через `gh secret set`. Без этого workflow падает на самом первом новом шаге.

### Phase 2: Workflow & docs

- **Task #2** — Добавить три новых шага в `.github/workflows/android-build.yml`:
  - `Verify Android signing secret` (early-fail с инструкцией если секрет отсутствует)
  - `Restore stable debug keystore` (восстановить из base64 в `~/.android/debug.keystore`)
  - `Bundle JS into APK` (`npx expo export:embed` между Expo prebuild и Gradle assembleDebug)
- **Task #3** — Добавить короткий подраздел в README.md с указателем на workflow как SSOT для setup-инструкций.

### Phase 3: Verification

- **Task #4** — Smoke-test: коммит → push → workflow run → установка APK на телефон → проверка что приложение проходит сплеш → второй push → проверка установки поверх существующего без uninstall.

## Dependencies

```
#1  ──┬──>  #2  ───┬──>  #4
      └──>  #3  ───┘
```

Task #2 заблокирован #1 (workflow упадёт на verify step без секрета).
Task #4 заблокирован #1, #2, #3 (нечего тестить без всех изменений).

## Commit Plan

4 задачи — **single commit at the end** (по правилу skill: 5+ tasks → checkpoints). Suggested message:

```
fix(ci): bundle JS and use stable keystore for android workflow

- Add ANDROID_DEBUG_KEYSTORE_BASE64 secret check with self-help error
- Restore stable debug.keystore from secret before gradle build
- Bundle JS via expo export:embed before assembleDebug so APK is
  standalone-runnable without Metro
- Add README pointer to workflow for first-time setup
```

Task #1 (генерация и загрузка секрета) — manual, не входит в коммит.
Task #4 (smoke-test) — после коммита и push.

## Risks & mitigations

- **expo export:embed может потребовать Metro internals** → проверяем на CI run в Task #4. Fallback: использовать `react-native bundle` напрямую с теми же аргументами.
- **expo prebuild --clean сносит assets/** → шаг Bundle JS делается ПОСЛЕ prebuild, так что путь чистый.
- **Утечка keystore через base64 в логах** → secret не выводится в plain в логах, ни одна команда не делает `echo "$KEYSTORE_B64"`. Только `base64 -d` в файл.

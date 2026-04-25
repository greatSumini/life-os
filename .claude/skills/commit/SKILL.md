---
name: commit
description: 현재 변경사항을 프로젝트의 commit 컨벤션에 맞게 커밋한다. 무관한 변경은 반드시 별도 커밋으로 분리한다. 사용자가 "commit", "커밋", "commit push" 등을 요청할 때 이 스킬을 따른다.
user-invocable: true
argument-hint: "[push]"
allowed-tools: Bash, Read
---

# commit Skill

life-os 저장소의 커밋 규칙을 강제한다. 항상 이 형식과 분리 규칙을 따른다.

## 메시지 형식

```
<type>(<scope>): <한국어 설명>
```

### type

| type | 용도 |
|------|------|
| `feat` | 새 기능, 새 로그/기록 추가, 새 데이터 도입 |
| `fix` | 버그/오류 수정, 잘못된 기록 정정 |
| `refactor` | 동작 변화 없이 구조 개선 |
| `docs` | 문서/주석/CLAUDE.md 변경만 |
| `chore` | 사소한 정리, 설정 변경, 문구 수정 |

### scope

저장소 최상위 디렉터리 또는 영역명을 사용한다:

- `cooking` — cooking/ 하위 변경
- `fitness` — fitness/ 하위 변경
- `skills` — .claude/skills/ 하위 변경
- `claude` — .claude/ 의 설정/메모리 (skills 제외)
- 그 외 새 영역이 생기면 디렉터리명 그대로

### 설명

- 한국어 명사형/평서형, 짧고 구체적으로.
- 같은 커밋 안 여러 변경은 ` + ` 로 연결.
- 부연이 필요하면 ` — ` 로 추가.

### 예시 (실제 history 기준)

- `feat(cooking): products.toml 도입 + 04-23, 04-25 식사 로그`
- `feat(fitness): 04-25 운동 로그 저장 — 가슴 + 코어 + 러닝`
- `feat(skills): recipe 스킬 추가`
- `chore: 문구 수정`

## 분리 규칙 (강제)

**원칙**: 한 커밋은 한 가지 일만 한다. 리뷰어가 "이 커밋이 무슨 일을 하는가"에 한 문장으로 답할 수 있어야 한다.

다음 경우는 **반드시 별도 커밋으로 분리**한다:

1. **scope가 다르면 무조건 분리** — `cooking/` 변경과 `fitness/` 변경은 절대 같은 커밋에 묶지 않는다.
2. **같은 scope여도 주제가 다르면 분리**:
   - 로그 추가 + 스키마/구조 변경 → 분리
   - 신규 기능 + 기존 기록 정정 → 분리
   - skill 추가 + 다른 skill 수정 → 분리
3. **다음은 같은 커밋에 묶어도 된다**:
   - 같은 작업 단위의 부속 변경 (예: 새 데이터 도입 + 그 데이터를 참조하는 기존 로그 마이그레이션 + 관련 CLAUDE.md 컨벤션 추가)
   - 같은 날짜의 같은 종류 로그 여러 건

판단 기준: "이 변경들 중 하나만 revert하고 싶을 수 있는가?" → yes면 분리.

## 실행 절차

### Step 1. 변경사항 파악

```bash
git status
git diff
git diff --staged
```

untracked 파일도 빠짐없이 확인한다.

### Step 2. 그룹핑

위 분리 규칙에 따라 변경 파일들을 그룹으로 나눈다. 각 그룹마다:
- type, scope, 설명을 정한다
- 어떤 파일들이 포함되는지 명시한다

그룹이 2개 이상이면 사용자에게 분리 계획을 보고하고 진행한다 (한 줄씩 나열). 단일 그룹이면 곧바로 Step 3.

### Step 3. 그룹별 커밋

각 그룹마다 `git add <files>` → `git commit -m "<message>"` 를 순서대로 실행한다. `git add .` 는 사용 금지 (다른 그룹 변경이 섞일 수 있음).

### Step 4. push (선택)

argument에 `push` 가 있거나 사용자가 push를 명시했을 때만 `git push` 실행. 그 외에는 push하지 않는다.

### Step 5. 결과 보고

- 만든 커밋 해시·메시지 한 줄씩
- push 했으면 원격 ref 업데이트 결과 한 줄

## 금지

- `git commit --no-verify` 사용 금지 (hook 실패 시 원인을 고친다)
- `git add .` / `git add -A` 사용 금지 (그룹 분리가 깨진다)
- 영어 커밋 메시지 작성 금지 (history 일관성)
- Claude 서명/공동 작성자 라인 추가 금지

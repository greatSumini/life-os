---
name: fitness-log-workout
description: 운동 기록을 파싱하여 fitness/logs/YYMMDD.toml에 저장한다. PT 트레이너 정리 텍스트 또는 직접 입력을 받아 구조화된 로그로 변환한다.
user-invocable: true
argument-hint: "[운동 내용 텍스트]"
---

# fitness-log-workout Skill

운동 기록을 파싱하여 `fitness/logs/YYMMDD.toml`에 저장하는 스킬이다.

## 파일 경로

- 운동 사전: `fitness/exercises.toml`
- 운동 로그 디렉터리: `fitness/logs/` (파일명 형식: `YYMMDD.toml`)
- 근육 그룹 분류: `fitness/profile.toml`

## 실행 절차

### Step 0. 현재 한국 날짜 확인

```bash
TZ=Asia/Seoul date '+%y%m%d'
```

이 값을 로그 파일명으로 사용한다.

### Step 1. 입력 확인

사용자 입력이 없으면 AskUserQuestion으로 다음을 묻는다:

```
오늘 한 운동을 알려주세요.
예시: 랫풀다운 4세트 12회 50kg / 시티드 로우 3세트 15회 40kg
또는 트레이너가 정리해준 텍스트를 그대로 붙여넣어도 됩니다.
```

### Step 2. 운동 유형 파악

입력 내용에서 운동 유형을 판단한다:
- PT 트레이너 정리 텍스트가 포함되어 있으면 `type = "pt"`
- 그렇지 않으면 `type = "solo"`

명시적으로 언급되지 않았다면 AskUserQuestion으로 묻는다:
```
오늘 운동은 PT였나요, 개인 운동이었나요?
1. PT
2. 개인 운동
```

### Step 3. 데이터 수집

다음을 병렬로 읽는다:

**3-1. 운동 사전 읽기**

`fitness/exercises.toml`을 Read 툴로 읽어 기존 운동 목록을 확인한다.

**3-2. 기존 로그 확인**

오늘 날짜의 로그 파일이 이미 있는지 확인한다. 있으면 기존 내용을 읽어 운동을 추가(append)할 준비를 한다.

### Step 4. 입력 파싱

사용자 입력에서 각 운동별로 다음 정보를 추출한다:
- 운동 이름
- 세트 수
- 횟수 (reps)
- 무게 (weight_kg) — 있는 경우
- 메모/주의사항 (notes) — 있는 경우

트레이너의 전체 코멘트가 있으면 `trainer_notes`로 추출한다.

### Step 5. 운동 ID 매칭 및 사전 업데이트

각 운동을 `exercises.toml`에서 매칭한다.

**매칭 규칙:**
- 운동 이름이 exercises.toml의 name 값과 일치하면 해당 id를 사용
- 유사한 이름이면 (예: "랫풀" → "랫풀다운") 매칭 시도
- 매칭되지 않는 운동이 있으면 AskUserQuestion으로 다음을 묻는다:

```
"[운동 이름]"이 운동 사전에 없습니다. 추가할까요?
타겟 근육과 카테고리를 알려주세요.
예시: 타겟=[광배근, 이두근], 카테고리=back
```

새 운동은 `exercises.toml`에 추가한다. id는 운동 이름의 영문 snake_case로 생성한다.

### Step 6. 로그 파일 저장

`fitness/logs/YYMMDD.toml` 형식으로 저장한다.

기존 로그가 없는 경우 새 파일 생성:

```toml
date = "2026-04-16"
type = "pt"
trainer_notes = "전체적인 트레이너 코멘트"

[[exercises]]
id = "lat_pulldown"
sets = 4
reps = 12
weight_kg = 50.0
notes = "마지막 세트 치팅 주의"

[[exercises]]
id = "seated_row"
sets = 3
reps = 15
weight_kg = 40.0
```

기존 로그가 있는 경우:
- `[[exercises]]` 항목만 추가한다
- `type`이나 `trainer_notes`가 변경되었으면 업데이트한다

### Step 7. 저장 완료 보고

저장된 내용을 간결하게 요약한다:

```
운동 기록 저장 완료 (260416)
- 유형: PT
- 운동: 랫풀다운(4×12, 50kg), 시티드 로우(3×15, 40kg)
- 트레이너 노트: ...
```

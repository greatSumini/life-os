---
name: fitness-log-inbody
description: 인바디 측정 수치를 입력받아 fitness/inbody/YYMMDD.toml에 저장하고, 이전 기록과 비교하여 변화를 요약한다.
user-invocable: true
argument-hint: "[인바디 수치]"
---

# fitness-log-inbody Skill

인바디 측정 수치를 `fitness/inbody/YYMMDD.toml`에 저장하고 이전 기록과 비교하는 스킬이다.

## 파일 경로

- 인바디 기록 디렉터리: `fitness/inbody/` (파일명 형식: `YYMMDD.toml`)
- 사용자 목표: `fitness/profile.toml`

## 실행 절차

### Step 0. 현재 한국 날짜 확인

```bash
TZ=Asia/Seoul date '+%y%m%d'
```

### Step 1. 입력 확인

사용자 입력이 없거나 불완전하면 AskUserQuestion으로 다음을 묻는다:

```
인바디 측정 결과를 알려주세요. 아래 항목 중 있는 것만 입력하면 됩니다.

필수:
- 체중 (kg)
- 골격근량 (kg)
- 체지방량 (kg)
- 체지방률 (%)

선택:
- BMI
- 인바디 점수
- 부위별 근육량 (우팔/좌팔/몸통/우다리/좌다리)
```

### Step 2. 이전 기록 조회

```bash
ls fitness/inbody/ | sort -r | head -1
```

가장 최근 인바디 파일을 Read 툴로 읽는다. 없으면 첫 기록으로 진행한다.

### Step 3. 로그 파일 저장

`fitness/inbody/YYMMDD.toml` 형식으로 저장한다:

```toml
date = "2026-04-16"

[body]
weight_kg = 75.0
skeletal_muscle_kg = 33.5
body_fat_kg = 15.2
body_fat_pct = 20.3
bmi = 24.1

[segmental_muscle]
right_arm = 3.2
left_arm = 3.1
trunk = 25.0
right_leg = 9.5
left_leg = 9.4

[scores]
inbody_score = 75
```

입력되지 않은 항목은 생략한다 (빈 값으로 채우지 않음).

### Step 4. 이전 기록 비교 및 보고

이전 기록이 있으면 변화를 계산하여 보고한다:

```
인바디 기록 저장 완료 (260416)

이전 측정 (260301) 대비 변화:
- 체중: 75.0kg → 76.2kg (+1.2kg)
- 골격근량: 33.5kg → 34.1kg (+0.6kg) ✓
- 체지방량: 15.2kg → 15.0kg (-0.2kg) ✓
- 체지방률: 20.3% → 19.7% (-0.6%p) ✓

목표(넓은 등판) 관련:
- 몸통 근육량: 25.0kg → 25.8kg (+0.8kg) — 등 발달에 긍정적
```

이전 기록이 없으면 기준점(baseline) 기록임을 알린다.

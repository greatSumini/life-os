---
name: recommend-menu
description: 현재 보유한 식재료와 과거 요리 기록을 참고해 오늘 먹을 메뉴를 추천한다. 혼자 먹는지/대접인지, 격식 여부를 고려해 최적의 메뉴를 제안한다.
user-invocable: true
argument-hint: ""
allowed-tools: Read, Bash, AskUserQuestion
---

# recommend-menu Skill

현재 식재료와 과거 요리 로그를 분석해 오늘의 메뉴를 추천하는 스킬이다.

## 파일 경로

- 식재료 목록: `cooking/ingredients.md`
- 요리 로그 디렉터리: `cooking/logs/`  (파일명 형식: `YYMMDD.toml`)
- 요리 채점 기준: `cooking/CLAUDE.md`

## 실행 절차

### Step 0. 현재 한국 날짜·시간 조회

다음 명령으로 한국 기준 현재 날짜와 시간을 정확히 확인한다:

```bash
TZ=Asia/Seoul date '+%Y-%m-%d %H:%M %A'
```

이 값을 이후 모든 단계의 기준으로 사용한다.

시간대를 기준으로 식사 종류를 판단한다:
- **아침 (breakfast)**: 10:00 이전
- **점심 (lunch)**: 10:00 ~ 15:00
- **저녁 (dinner)**: 15:00 이후

### Step 1. 식사 목적 파악

AskUserQuestion으로 다음을 묻는다:

```
오늘 누구를 위해 요리할까요?
1. 혼자 먹을 거예요
2. 누군가를 대접할 거예요
```

- **1번 선택**: `mode = solo`로 설정하고 Step 3으로 진행한다.
- **2번 선택**: `mode = host`로 설정하고 Step 2로 진행한다.

### Step 2. 격식 여부 파악 (mode = host일 때만)

AskUserQuestion으로 다음을 묻는다:

```
자리가 격식 있는 편인가요?
1. 아니요, 평상시처럼 편하게
2. 네, 중요하거나 특별한 자리예요
```

- **1번 선택**: `formal = false`
- **2번 선택**: `formal = true`

### Step 3. 데이터 수집

다음 세 가지를 병렬로 수집한다.

**3-1. 식재료 목록 읽기**

`cooking/ingredients.md`를 Read 툴로 읽는다.

신선도 우선순위 판단 기준:
- **당일 소비 권장** (유통기한 매우 짧음): 신선 육류·생선, 열린 달걀, 해동된 해물
- **빠른 소비 권장** (3일 내): 냉장 야채류, 두부, 신선 유제품
- **여유 있음**: 냉동식품, 가공식품, 소스·조미료류

**3-2. 최근 5일 요리 로그 읽기**

`cooking/logs/` 디렉터리의 파일 목록을 확인한다:

```bash
ls cooking/logs/ | sort -r | head -5
```

각 파일을 Read 툴로 읽고 다음 정보를 추출한다:
- 조리한 메뉴명 (`type = "cooked"`인 것만)
- effort, satisfaction, romantic 점수

**3-3. 채점 기준 읽기**

`cooking/CLAUDE.md`를 Read 툴로 읽어 effort·romantic·satisfaction 기준을 확인한다.

### Step 4. 분석 및 추천 메뉴 도출

수집한 데이터를 바탕으로 다음 기준에 따라 메뉴 3가지를 도출한다.

**공통 제약 조건:**
- 현재 보유 식재료만으로 만들 수 있는 메뉴여야 한다 (없는 재료 1~2가지는 간단히 구매 가능한 경우 언급 가능)
- 최근 5일 로그에 등장한 메뉴와 겹치지 않도록 한다
- 유통기한이 짧을 것으로 판단되는 식재료를 활용하는 메뉴를 우선 고려한다

**mode = solo 기준:**
- effort 낮을수록 유리 (1~2 우선)
- satisfaction 높을수록 유리 (4~5 목표)
- romantic은 고려하지 않음
- 과거 로그에서 satisfaction이 높았던 메뉴의 재료 조합을 참고해 유사한 스타일 우선 추천
- **아침 식사인 경우 (breakfast)**: effort > 2인 메뉴는 절대 추천 금지. 후보 메뉴 도출 단계에서 effort 3 이상인 메뉴는 검토 대상에서 제외한다.

**mode = host, formal = false 기준:**
- effort는 크게 고려하지 않음
- satisfaction 최우선 (4~5 목표)
- romantic 2 이상 권장

**mode = host, formal = true 기준:**
- effort는 고려하지 않음
- satisfaction 최우선 (5 목표)
- romantic 3 우선 고려

### Step 5. 추천 결과 출력

다음 형식으로 메뉴 3가지를 제안한다:

```
## 오늘의 메뉴 추천 (한국 시간 기준: YYYY-MM-DD HH:MM)

**상황**: [혼밥 | 대접 - 편한 자리 | 대접 - 특별한 자리]

---

### 1순위: [메뉴명]
- **사용 재료**: [재료 목록]
- **예상 effort**: N/5
- **예상 satisfaction**: N/5
- **추천 이유**: [유통기한 우선 활용 여부, 과거 만족도 참고 내용, 최근 메뉴와 다른 점 등]

### 2순위: [메뉴명]
...

### 3순위: [메뉴명]
...

---
💡 **참고**: [구매 필요 재료가 있다면 간략히 언급 / 유통기한 주의 재료 언급 등]
```

추천이 끝난 뒤 추가 질문은 하지 않는다. 사용자가 선택하면 그에 맞게 답변한다.

---
name: fitness-log-report
description: PT 트레이너의 리포트(음성 전사 등)를 fitness/reports/YYMMDD.md에 저장하고, 핵심 취약점과 방향성을 추출하여 profile.toml을 업데이트한다.
user-invocable: true
argument-hint: "[트레이너 리포트 텍스트]"
---

# fitness-log-report Skill

트레이너 리포트를 `fitness/reports/YYMMDD.md`에 저장하고 `profile.toml`의 취약점을 업데이트하는 스킬이다.

## 파일 경로

- 리포트 디렉터리: `fitness/reports/` (파일명 형식: `YYMMDD.md`)
- 사용자 프로필: `fitness/profile.toml`

## 실행 절차

### Step 0. 현재 한국 날짜 확인

```bash
TZ=Asia/Seoul date '+%y%m%d'
```

### Step 1. 입력 확인

사용자 입력이 없으면 AskUserQuestion으로 묻는다:

```
트레이너 리포트 내용을 붙여넣어 주세요.
(음성 전사 텍스트, 메모, 또는 트레이너가 보내준 텍스트 등)
```

### Step 2. 기존 프로필 읽기

`fitness/profile.toml`을 Read 툴로 읽어 현재 목표와 취약점을 확인한다.

### Step 3. 리포트 분석 및 저장

입력된 텍스트에서 다음을 추출한다:
- **현재 취약점**: 어떤 부위가 약한지, 어떤 문제가 있는지
- **발전 방향**: 트레이너가 제안하는 개선 방향
- **구체적 운동 제안**: 추천된 운동이 있다면

`fitness/reports/YYMMDD.md`에 다음 형식으로 저장한다:

```markdown
# 트레이너 리포트 — 2026-04-16

## 현재 취약점
- [추출된 취약점 목록]

## 발전 방향
- [추출된 발전 방향]

## 추천 운동
- [있는 경우]

## 원문
> [입력된 전사 텍스트 전문]
```

### Step 4. profile.toml 업데이트

추출된 취약점을 `fitness/profile.toml`의 `[weaknesses]` 섹션에 반영한다:

```toml
[weaknesses]
last_updated = "2026-04-16"
areas = ["후면삼각근", "코어"]
notes = "코어 안정성 부족, 후면 삼각근 비대칭"
```

기존 취약점을 완전히 덮어쓰는 것이 아니라, 트레이너의 최신 평가를 기준으로 갱신한다.
이전 취약점 중 트레이너가 더 이상 언급하지 않는 항목이 있다면, 개선된 것으로 판단하여 제거한다.

### Step 5. 저장 완료 보고

```
트레이너 리포트 저장 완료 (260416)

취약점 업데이트:
- 추가: 코어 안정성
- 유지: 후면삼각근
- 개선(제거): 좌우 밸런스 (이전 리포트에서 지적됐으나 이번에 언급 없음)

발전 방향: 등 운동 볼륨 주 2회 이상, 페이스풀로 후면삼각근 보강
```

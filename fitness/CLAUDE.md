# fitness

## 데이터 구조

- `profile.toml` — 사용자 목표, 취약점, 근육 그룹 분류 (모든 스킬의 기준점)
- `exercises.toml` — 운동 사전. 운동 id → 이름, 타겟 근육, 카테고리 매핑
- `logs/YYMMDD.toml` — 일별 운동 기록. exercises.toml의 id로 참조
- `inbody/YYMMDD.toml` — 인바디 측정 기록
- `reports/YYMMDD.md` — 트레이너 리포트 (전사 원문 + 요약)

## 근육 그룹 분류

profile.toml의 `[muscle_groups]`를 단일 진실 공급원(SSOT)으로 사용한다.
로그 기록, 볼륨 집계, 추천 등 모든 곳에서 이 분류를 따른다.

## 로그 마킹 컨벤션

운동 로그(`logs/YYMMDD.toml`)에서 다음 두 가지를 별도로 마킹한다. 트레이너 웹(`trainer-web`)에서 색상으로 구분되어 표시된다.

### 미실시 운동 — `[[skipped]]`

계획했으나 수행하지 못한 운동은 `[[workouts]]` 대신 `[[skipped]]` 배열에 기록한다. 볼륨 집계에 포함되지 않는다. 웹에서는 **빨간색 + 취소선**으로 표시된다.

```toml
[[skipped]]
exercise = "running"
notes = "시간 부족"
```

`[[skipped]]`만으로 "미실시" 의미가 전달되므로 notes에 "계획했으나 미실시", "수행 못함" 등의 문구를 중복 기재하지 않는다. 단, 미실시 *이유* (예: "시간 부족")는 유효 정보이므로 적어도 된다.

### 자세 불안정 운동 — `unstable = true`

수행은 했지만 자세가 불안정해 트레이너 점검이 필요한 운동에는 `unstable = true` 필드를 추가한다. 웹에서는 **주황색**으로 표시된다.

```toml
[[workouts]]
exercise = "incline_bench_press"
sets = 3
weight_kg = 15
reps_per_set = 12
unstable = true
notes = "신규 / 가벼운 무게로 시작"
```

`unstable = true`만으로 의미가 전달되므로 notes에 "자세 불안정", "트레이너 점검 요청" 등의 문구를 중복 기재하지 않는다.

## 볼륨 추적 기준

- **주간 볼륨** = 해당 근육 그룹의 총 세트 수 (exercises.toml로 조인하여 계산)
- **최소 유효 볼륨 (MEV)**: 주당 10세트
- **최대 적응 볼륨 (MAV)**: 주당 20세트
- 목표 근육(등)은 MAV 근처, 유지 근육은 MEV 이상 유지

## 분석 시 주의사항

- weight_kg 증가 추세를 추적하여 점진적 과부하(progressive overload) 여부 확인
- 같은 운동의 이전 기록 notes를 반드시 참조하여 주의사항 전달
- 인바디 segmental_muscle 변화로 목표 근육 성장 추적

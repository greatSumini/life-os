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

## 볼륨 추적 기준

- **주간 볼륨** = 해당 근육 그룹의 총 세트 수 (exercises.toml로 조인하여 계산)
- **최소 유효 볼륨 (MEV)**: 주당 10세트
- **최대 적응 볼륨 (MAV)**: 주당 20세트
- 목표 근육(등)은 MAV 근처, 유지 근육은 MEV 이상 유지

## 분석 시 주의사항

- weight_kg 증가 추세를 추적하여 점진적 과부하(progressive overload) 여부 확인
- 같은 운동의 이전 기록 notes를 반드시 참조하여 주의사항 전달
- 인바디 segmental_muscle 변화로 목표 근육 성장 추적

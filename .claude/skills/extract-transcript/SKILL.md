---
name: extract-transcript
description: YouTube URL을 입력받아 영상 대본을 추출하고 transcripts/ 폴더에 저장한다. 자막이 있으면 직접 가져오고, 없으면 Whisper API로 음성 인식한다. 도메인 특수 용어 오기도 자동 수정한다.
user-invocable: true
argument-hint: "<YouTube URL>"
allowed-tools: Read, Write, Bash
---

# extract-transcript Skill

YouTube 영상의 대본을 추출해 `transcripts/` 폴더에 저장하는 스킬이다.

## 파일 경로

- 대본 추출 스크립트: `.claude/skills/extract-transcript/scripts/extract_transcript.py`
- 오기 수정 스크립트: `.claude/skills/extract-transcript/scripts/apply_corrections.py`
- 대본 저장 폴더: `transcripts/`

## 실행 절차

### Step 1. 대본 추출

```bash
python3 .claude/skills/extract-transcript/scripts/extract_transcript.py "<YouTube URL>" \
  --output-dir transcripts
```

출력 JSON:
```json
{
  "success": true,
  "method": "transcript_api" | "whisper",
  "file": "transcripts/영상제목.txt",
  "title": "영상 제목",
  "char_count": 85000,
  "sample": "앞부분 2000자 + 균등 분포 샘플 3구간"
}
```

**에러 처리 (success: false):**

| error_type | 대응 |
|---|---|
| `api_key_missing` | "자막이 없는 영상입니다. Whisper API를 사용하려면 OPENAI_API_KEY 환경변수를 설정해 주세요. (`export OPENAI_API_KEY=\"sk-...\"`)"|
| `private_video` | "비공개 또는 지역 제한 영상이라 접근할 수 없습니다." |
| `invalid_url` | "올바른 YouTube URL이 아닙니다." |
| 기타 | error 필드 내용 그대로 전달 |

에러 발생 시 사용자에게 안내하고 스킬을 종료한다.

### Step 2. 샘플 분석 → 오기 수정 목록 생성

Step 1 출력의 `sample` 필드를 분석한다.

샘플을 읽고 다음을 파악한다:
- 영상의 도메인/주제 (예: React 개발, 주식 투자, 의학 강의 등)
- 해당 도메인에서 자주 등장하는 전문 용어 중 자동 자막/음성인식 특성상 오기됐을 가능성이 있는 단어

수정 목록을 JSON으로 작성하고 Write 툴로 `transcripts/.corrections_tmp.json`에 저장한다:

```json
{
  "corrections": [
    {"wrong": "리엑트", "right": "React"},
    {"wrong": "하이드래이션", "right": "hydration"},
    {"wrong": "훅스", "right": "Hooks"}
  ]
}
```

수정이 필요 없다고 판단되면 `{"corrections": []}` 로 저장한다.

**주의:** 일반적인 단어나 확실하지 않은 경우는 포함하지 않는다. 도메인 특수 용어 중 명백히 오기된 것만 포함한다.

### Step 3. 오기 수정 적용

```bash
python3 .claude/skills/extract-transcript/scripts/apply_corrections.py \
  "<Step 1의 file 값>" \
  transcripts/.corrections_tmp.json
```

출력 JSON:
```json
{"success": true, "corrections_applied": 12}
```

적용 후 임시 파일을 삭제한다:
```bash
rm transcripts/.corrections_tmp.json
```

### Step 4. 결과 보고

다음 형식으로 사용자에게 보고한다:

```
완료: transcripts/영상제목.txt
- 추출 방식: 자막 직접 추출 | Whisper API
- 글자 수: 85,000자
- 수정된 용어: 12건
```

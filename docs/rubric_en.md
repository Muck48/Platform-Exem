# Rubric — Midterm Practical Lab Test (100 Points)

## Assessment Criteria

| Area | Points | Expected evidence / performance |
|---|---:|---|
| API contract and analysis | 20 | Endpoints, payloads, status codes, and assumptions match the contract; the reasons for using `400`, `404`, and `409` are clear. |
| Data design and business rules | 20 | The schema/ERD supports the relationship; data types are appropriate; overlapping booking times are checked correctly. |
| Implementation and security | 25 | CRUD works; validation and error handling are complete; request data is not concatenated into SQL; JSON error responses work. |
| Testing and evidence | 15 | At least five cases cover create/read/update/delete and errors; evidence is supplied from `curl` or another HTTP client. |
| Quality Gate improvement | 10 | A pre-30-minute snapshot and evidence of at least three findings, fixes, and verification steps; improvements are meaningful. |
| AI responsibility / You Own It | 10 | The AI log is transparent; output has been checked; key decisions and code can be explained. |

## Performance Descriptors

### 1. API Contract and Analysis — 20 points

- **17–20:** All key endpoints and responses are complete; naming is consistent; statuses and errors are appropriate; assumptions can be verified.
- **10–16:** Most CRUD operations are complete, but some parts of the contract or status-code choices are inconsistent.
- **1–9:** The contract is unclear, or the implementation does not match the stated contract.
- **0:** No evidence of API design.

### 2. Data Design and Business Rules — 20 points

- **17–20:** The relationship is clear, validation is complete, and overlapping times are prevented for both create and update operations.
- **10–16:** The schema is usable, but some edge cases or validation are missing.
- **1–9:** Data can be stored, but important business rules do not work.
- **0:** No usable data design.

### 3. Implementation and Security — 25 points

- **22–25:** All CRUD operations are complete, stable, and secure according to the requirements; JSON error responses work correctly.
- **13–21:** Core CRUD works, but some endpoints, validation, or error handling are missing.
- **1–12:** Only some flows work, or there is a significant risk, such as constructing SQL directly from request input.
- **0:** The submission cannot run or be tested.

### 4. Testing and Evidence — 15 points

- **13–15:** Evidence covers five or more cases, including validation, not found, and conflict cases; `curl` or HTTP-client results can be verified.
- **7–12:** Important tests are present, but error coverage or evidence is incomplete.
- **1–6:** Only happy-path testing is shown.
- **0:** No test evidence.

### 5. Quality Gate Improvement — 10 points

- **8–10:** The review leads to meaningful, verifiable improvements and is clearly connected to the Quality Gate.
- **4–7:** A review record and fixes are present, but the changes are minor or the evidence is incomplete.
- **1–3:** A checklist is mentioned without a demonstrated improvement.
- **0:** No review.

### 6. AI Responsibility / You Own It — 10 points

- **8–10:** The AI log is transparent; AI suggestions are used critically; the student can explain the work independently.
- **4–7:** An AI log exists, but verification or explanation is unclear.
- **1–3:** AI was used, but there is no evidence of verification or the student cannot explain important parts.
- **0:** The rules are violated, or ownership of the work cannot be confirmed.

## Fairness Principles

- Every student receives the same task, starter repository, API contract, test data, and time allocation.
- AI use is permitted equally for all students; marks are not awarded for using a particular tool.
- Marks are based on verifiable evidence and results, not on frontend appearance or code volume.
- Quality Gate marks reflect the quality of review and improvement, not the quality of the initial attempt alone.
- The instructor may ask each student two or three standard questions, or use an equivalent random sampling approach, to confirm ownership of the work.

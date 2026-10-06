# Quality Gate — Midterm Practical Lab Test

Use this Quality Gate after the first 30 minutes and again during the final 5 minutes before submission. Its purpose is to help you verify that your Campus Equipment Booking API is correct, usable, and genuinely your own work.

## How to use this Quality Gate

1. Read the task, API contract, marking rubric, and any permitted course resources.
2. Review the eight checks below that apply to your work.
3. If you find a meaningful issue, fix it and test the fix.
4. Record at least three improvements in `QUALITY_GATE_REVIEW.md` using: **finding → action taken → evidence**.

If an important requirement is missing, a test fails, or you cannot explain a key part of your solution, stop and resolve it before submitting.

## 1. Purpose

- [ ] My API solves the stated equipment-booking problem.
- [ ] My routes, request bodies, responses, and status codes match the common API contract.
- [ ] I have met the required deliverables and submission instructions.
- [ ] I have not added unrelated features that reduce the time available for required work.

## 2. Reliability

- [ ] My equipment data and booking data are saved and retrieved consistently.
- [ ] Creating or updating a booking cannot create an overlap for the same equipment.
- [ ] `equipmentId` is checked against existing equipment.
- [ ] The API handles invalid requests without crashing.

## 3. Course Context

- [ ] My work follows the instructor's task, the API contract, and the permitted technology stack.
- [ ] I understand which parts I implemented myself and which parts were assisted by AI or other permitted resources.
- [ ] I used only permitted sources and recorded significant AI assistance in `AI_LOG.md`.
- [ ] I can identify the important files, routes, schema, and commands needed to run my work.

## 4. Reasoning

- [ ] I can explain why I selected each important status code, especially `400`, `404`, and `409`.
- [ ] I can explain how my overlap check works for both create and update operations.
- [ ] I can distinguish required behaviour from optional design choices.
- [ ] I can explain any limitations or assumptions in my implementation.

## 5. Execution Value

- [ ] The API can be run by following the instructions in `README.md`.
- [ ] The equipment endpoint and all required booking CRUD endpoints work.
- [ ] I tested the API with `curl` or another HTTP client and recorded the results.
- [ ] I have focused effort on the required API, validation, testing, and documentation.

## 6. Accuracy

- [ ] Booking fields, dates, IDs, and responses contain the correct values.
- [ ] I validate that `startAt` is before `endAt`.
- [ ] Every error response uses JSON in the required `{ "error": "..." }` format.
- [ ] I use SQL/D1 parameter binding and do not concatenate request data into SQL statements.

## 7. Delivery Quality

- [ ] My source code is runnable and my README includes clear run instructions.
- [ ] My API contract and brief schema/ERD are included.
- [ ] I have included any CORS configuration only if I chose to use a browser-based client.
- [ ] I have evidence for at least five test cases, including successful requests and error cases.
- [ ] My files are named clearly and are complete enough for marking.

## 8. You Own It

- [ ] I can explain every important route, validation rule, database query, and test result in my own words.
- [ ] My `AI_LOG.md` truthfully records important prompts, what I used, and how I checked it.
- [ ] I can explain what I changed after the Quality Gate review and why.
- [ ] I am ready to answer follow-up questions about my design and implementation.

## Quality Gate Review Record

Create `QUALITY_GATE_REVIEW.md` and include at least three meaningful improvements. At least one improvement must relate to **Reliability** or **Accuracy**, and at least one must relate to **Reasoning** or **You Own It**.

| Quality Gate area | Finding | Action taken | Evidence |
|---|---|---|---|
| Example: Reliability | An update could conflict with its own existing booking. | Excluded the booking being updated from the overlap query. | Added an update test; it returns `200` without a false conflict. |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

## Submission Decision

- **READY:** All required work is complete, tests have been checked, and you can explain the submission.
- **REVIEW WITH INSTRUCTOR:** A requirement or result is unclear and you need clarification.
- **REWORK:** A real issue remains; fix it and repeat the relevant test.
- **DO NOT SUBMIT YET:** The work is incomplete, key evidence is missing, or you cannot explain important parts of it.

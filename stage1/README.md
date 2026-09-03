# Dingel Hafizia App — 1st Stage Frontend

Frontend-only implementation of the supplied Stage 1 blueprint.

## Included
- Clean/blank Dashboard
- Slide Navigation Menu
- Financial Management: Income / Expenses, transaction entry/history, Today's Total
- Student Management: Students Data, student profiles, Student Fees, Payments & Dues
- Responsive mobile/desktop UI
- Browser localStorage persistence for Stage 1 frontend data
- No Firebase / backend in this stage

## Run
Open `index.html` in a modern browser. Stage 1 data is stored locally in the browser using `localStorage`; no Firebase or backend is required.

## Functional checks
- Dashboard totals update from saved transactions and fee records
- Income/Expense records can be added, edited, filtered by type/date, and deleted
- Today's Total uses the current date and summarizes income, expenses, and balance
- Student profiles can be added, viewed, edited, and deleted
- Deleting a student also removes that student's fee records
- Student fees can be added, edited, filtered by status/search, and deleted
- Fee validation prevents paid amount from exceeding the total fee
- User-entered text is HTML-escaped before table/profile rendering
- Mobile navigation opens/closes through the menu button and overlay

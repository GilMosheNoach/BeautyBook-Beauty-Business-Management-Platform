-- The free trial now starts at sign-up, without a card. Unlock owners who signed up but never added one.
UPDATE "Subscription"
SET "status" = 'TRIALING',
    "trialEndsAt" = "createdAt" + INTERVAL '2 months',
    "currentPeriodEnd" = "createdAt" + INTERVAL '2 months'
WHERE "status" = 'INCOMPLETE';

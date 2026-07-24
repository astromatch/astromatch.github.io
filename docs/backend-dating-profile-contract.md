# Backend handoff: dating profile

The frontend profile hub now has product surfaces for photos, dating prompts,
question-and-answer cards, discovery preferences, distance, hobbies, and
interests. These remain honest empty states until the backend supports them.

## Required endpoints

All endpoints must derive ownership from the verified Firebase bearer token.
Never accept a client-supplied `user_id`.

### Dating profile

- `GET /api/v1/me/dating-profile`
- `PATCH /api/v1/me/dating-profile`

Suggested response:

```json
{
  "data": {
    "username": "deepak",
    "bio": "A short public dating introduction.",
    "max_distance_km": 50,
    "interested_in": ["women"],
    "hobbies": ["Cooking", "Photography"],
    "interests": ["Live music", "Travel"],
    "dating_prompts": [
      {"id": "uuid", "prompt": "A perfect Sunday looks like…", "answer": "...", "position": 0}
    ],
    "questions": [
      {"id": "uuid", "question": "What are you looking for right now?", "answer": "...", "position": 0}
    ],
    "photos": [
      {"id": "uuid", "url": "https://...", "alt": "Profile photo", "position": 0, "is_primary": true}
    ]
  }
}
```

Validate username uniqueness, maximum field lengths, allowed discovery values,
prompt/question counts, and ordered positions. Return field-level validation in
`error.fields`.

### Photos

- `POST /api/v1/me/dating-profile/photos/upload-url`
- `POST /api/v1/me/dating-profile/photos`
- `PATCH /api/v1/me/dating-profile/photos/{photoId}`
- `DELETE /api/v1/me/dating-profile/photos/{photoId}`
- `PUT /api/v1/me/dating-profile/photos/order`

Use short-lived signed uploads, validate MIME type and file size server-side,
strip metadata, generate safe display variants, and support three to six ordered
photos. Deleting the primary photo should atomically promote the next photo.

## Privacy and discovery

- Keep birth data and natal-chart internals separate from the dating profile.
- Define explicitly which profile fields are public, match-only, and private.
- Store distance preferences privately; expose only coarse distance bands.
- Add account-level visibility and pause-discovery controls.
- Never put names, photos, answers, locations, or birth details into analytics.
- Archive records when needed for safety workflows instead of immediately
  hard-deleting them.

## Frontend integration follow-up

When the endpoints ship, replace the current empty states with the returned
arrays and enable the existing Manage/Edit controls. Keep the response envelope
as `{ "data": ..., "meta": ... }` and use the existing API error format.

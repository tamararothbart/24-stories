---
name: library.html — Go-Live Configuration Checklist
description: Four things that must be configured in library.html before it goes live. Raise this automatically when Make scenarios are being built or when library.html is being wired up.
type: project
originSessionId: 4f091a65-6943-4839-bc63-4a2f26f75ebe
---
# library.html — Go-Live Configuration Checklist

**Raise this at the start of any Make scenario build session, or any session where library.html is being wired to live data.**

---

## 1. Airtable Read-Only API Key

In library.html, line:
```
var AIRTABLE_KEY = 'YOUR_AIRTABLE_READ_ONLY_API_KEY';
```

- Go to airtable.com → Account → Developer Hub → Personal access tokens
- Create a **read-only** token scoped to the 24 Stories base
- Replace the placeholder with the token

---

## 2. Airtable Base ID

In library.html, line:
```
var AIRTABLE_BASE = 'YOUR_AIRTABLE_BASE_ID';
```

- Open the 24 Stories base ("52stories") in Airtable
- Go to Help → API documentation
- The base ID is at the top — format: `appXXXXXXXXXXXXXX`

---

## 3. Four Make Webhook URLs

In library.html, replace all four placeholders:

```
var HOOK_STORY_PHOTO = 'YOUR_MAKE_WEBHOOK_URL_STORY_PHOTO';
```
→ Updates `Stories.StoryImageURL` for a given subscriber + week

```
var HOOK_CAPTION = 'YOUR_MAKE_WEBHOOK_URL_CAPTION';
```
→ Updates `Stories.StoryImageCaption` for a given subscriber + week

```
var HOOK_BOOK_PHOTO = 'YOUR_MAKE_WEBHOOK_URL_BOOK_PHOTO';
```
→ Updates `Subscribers.PortraitPhotoURL` or `Subscribers.CoverPhotoURL` depending on `fieldType` in payload

```
var HOOK_BOOK_TEXT = 'YOUR_MAKE_WEBHOOK_URL_BOOK_TEXT';
```
→ Updates `Subscribers.DedicationText`, `Subscribers.DeliveryAddress`, or **`Subscribers.BookTitle`** depending on `fieldType` in payload

Payloads sent by library.html:
- Story photo: `{ subscriberId, week, photoUrl }`
- Caption: `{ subscriberId, week, caption }`
- Book photo: `{ subscriberId, fieldType: "portrait"|"cover", photoUrl }`
- Book text: `{ subscriberId, fieldType: "dedication"|"deliveryAddress"|"bookTitle", value }`

**Book title default:** When the library loads subscriber data, pre-populate the `bookTitle` textarea with `The Collected Stories of [StorytellerFirstName] [StorytellerSurname]` if `Subscribers.BookTitle` is empty. This is a default, not a saved value — save only on user edit. Add `BookTitle` field to Airtable Subscribers table (text field).

---

## 4. Airtable Formula Field — Stories Table

In the **Stories** table in Airtable, add a new **Formula** field:

- Field name: `SubscriberRecordID`
- Formula: `ARRAYJOIN({SubscriberID}, "")`

This outputs the linked subscriber's Airtable record ID as plain text, so library.html can filter stories by subscriber. Without this field, the library cannot load stories.

The filter formula used in library.html:
`FIND("recXXXXXX", {SubscriberRecordID})`

---

## When all four are done

Remove the comment block at the top of the library.html `<script>` section and mark this checklist complete.

# 24 Stories — Printer Specification Template

**Use this file every time you send a book to print.**
Fill in the [brackets] from the BOOK COMPILED alert at hello@24stories.co.za.
Attach the PDF. Paste the specification block into the body of your email.

---

## Email subject line

```
Print order — [Subscriber First Name] [Surname] — [Book Title] — [Date]
```

---

## Email body — paste in full, fill in brackets

---

Please print the following book to the specifications below. The print-ready PDF is attached.

**SUBSCRIBER / DELIVERY**
Name: [Subscriber full name]
Delivery address: [Full delivery address from BOOK COMPILED alert]
Total copies: [Total copies — e.g. "2 (1 subscriber + 1 extra)"]

---

**PRINT SPECIFICATION — 24 STORIES HARDCOVER BOOK**

**FORMAT**
Trim size: 148 × 210mm (A5 portrait)
Orientation: Portrait
Interior page count: Approximately [estimated pages from alert] pages (exact count from attached PDF)

**BINDING**
Type: Case-bound hardcover (sewn binding preferred; perfect binding not acceptable)
Endpapers: Plain cream to match interior paper
No dust jacket

**COVER / CASE**
Cloth: [Black / Blue / Red] linen — as specified
Spine: Title and author name in foil or debossed lettering per your house template
No cover image — cloth and lettering only
No laminate

**INTERIOR PAPER**
Weight: 90gsm uncoated cream
Substitute (only if 90gsm unavailable): 80gsm uncoated cream
Do not substitute coated stock or bright white paper

**COLOUR**
Text and headings: Black, single-colour
Photographs and images: Colour RGB — embedded in PDF
If full-colour interior is unavailable: greyscale is acceptable for photo pages — advise before printing

**MARGINS**
Set in PDF via CSS. Do not add or alter margins in pre-press software.
Mirror margins (wider at spine — standard case-bound hardcover):
- Spine (inner): 20mm
- Fore-edge (outer): 15mm
- Head (top): 17mm
- Foot (bottom): 22mm
Full-bleed pages (cover, portrait photo, chapter images, dedication, colophon): zero margin — content to trim edge

**BLEED**
PDF does not include a bleed allowance.
If your workflow requires 3mm bleed, add in pre-press. Or advise and we will supply a bleed-extended PDF.

**FILE**
Format: PDF (Chrome-generated; fonts embedded; RGB colour space)
Fonts embedded: Bebas Neue (display/headings), Georgia (body text) — no substitution required
Images: Cloudinary full-resolution output, minimum 1,000px on shortest edge
If any image falls below 150dpi at trim size, advise before pressing

**PROOFING — REQUIRED BEFORE PRESS**
A digital proof (PDF soft proof or screen proof) is required before going to press.
Send proof to: hello@24stories.co.za
Subject line: Proof — [Subscriber name] — [Book title]
We will respond within 48 hours.
Do not proceed to press without written sign-off from hello@24stories.co.za.

**DELIVERY**
Ship to the delivery address above via tracked courier.
Advise estimated dispatch date and tracking number once handed to courier.
If any delay occurs beyond your quoted turnaround, notify hello@24stories.co.za before the due date passes.

**CONTACT**
hello@24stories.co.za
24stories.co.za

---

This specification accompanies every 24 Stories print order. If anything is unclear or you need source files in a different format, write to hello@24stories.co.za before printing.

---

## How to export the PDF before sending

1. Open the HTML attachment from the BOOK COMPILED email in **Chrome** (not Safari, not Mail preview)
2. Review the complete book top to bottom — content, images, chapter order, chapter titles
3. **File → Print → Save as PDF**
   - Paper size: **A5** (148 × 210mm)
   - Margins: **None** — CSS handles all margins
   - Background graphics: **On**
4. Save the PDF — this is your print file
5. The printer specification panel (amber box) does not appear in the exported PDF — only book content

## After sending

Return to Airtable → Subscribers → tick **BookDispatchEmailSent**.
This fires email-12 to the subscriber and starts delivery tracking alerts automatically.

## Notes

- Fonts (Bebas Neue) are loaded from Google Fonts at export time — Chrome must have internet access when you export the PDF
- Once exported, fonts are embedded in the PDF — no internet required by the printer
- The PDF uses mirror margins — recto (odd/right-hand) pages have the wide spine margin on the left; verso (even/left-hand) pages have it on the right. This is standard for case-bound hardcover. Verify this is honoured on the first printed proof.
- Page numbers are not in the current PDF. If the printer requires page numbers, advise and they can be added in InDesign or equivalent pre-press software.

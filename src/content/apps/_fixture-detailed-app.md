---
# Not a real App, and it never ships: the underscore keeps it out of every build
# except the test one — see src/lib/apps.ts. It exists so the with-a-body branch
# is exercised against a real build while none of the three real Apps has
# anything written about it yet.
name: Fixture Detailed App
initials: FD
description: An App with something written about it, so the detail route has something to be.
platform: Test
status: in-development
order: 98
---

Fixture body copy, which is what makes this App's detail route exist at all.

## A second heading

A second paragraph, so the prose styles have more than one block to sit on.

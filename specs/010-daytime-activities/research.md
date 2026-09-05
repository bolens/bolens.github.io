# Findings before implementation
Daytime heads use .8/.7 scale while torsos use .45/.4, producing inflated heads.
Mothman's current transform places its feet at the pine tip, so paint order alone
does not create a hideout. Tent portraits and the windhound are reusable but lack
outdoor lower-body poses. The saucer currently rocks by only a few pixels high
above terrain, so it never returns to cover.

Keep the existing symbols and renderer. Correct local geometry and add static
pose/prop symbols rather than another animation system.

# agent instruction

**Smoke-test every advertised view at every breakpoint.** "Before handing a responsive UI to a user, enumerate its views and controls, then verify with an automated browser that each view is reachable at every CSS breakpoint and input mode the UI claims to support — including and especially the primary target device's width. A control hidden by a media query with no substitute equals a feature that does not exist at that width."

*Grounded in: the tutorial map view being unreachable on iPad because the tab bar was hidden above 900px.*

# justification

The prototype's Map and Path views were reachable only via a bottom tab bar that a media query hid on screens wider than 900px — which includes the primary target device (iPad) in BOTH orientations. Desktop eyeballing and a 21-check Playwright suite that navigated programmatically (window.openNode) both missed it; the user found it in minutes on the real device. The fix took ten minutes; the round-trip through the user cost a review cycle. One reachability matrix (views x breakpoints) driven by clicks, not JS calls, catches this class entirely.

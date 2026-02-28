# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "MissionPulse" [level=1] [ref=e5]
    - paragraph [ref=e6]: Mission. Technology. Transformation.
  - generic [ref=e7]:
    - heading "Sign In" [level=2] [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - text: Email
        - textbox "Email" [ref=e11]:
          - /placeholder: you@mission.gov
          - text: maryadawson@gmail.com
      - generic [ref=e12]:
        - text: Password
        - textbox "Password" [ref=e13]:
          - /placeholder: ••••••••
          - text: Test123!!
      - link "Forgot password?" [ref=e15] [cursor=pointer]:
        - /url: /forgot-password
      - button "Sign In" [active] [ref=e16]
      - paragraph [ref=e17]:
        - text: No account?
        - link "Request Access" [ref=e18] [cursor=pointer]:
          - /url: /signup
  - paragraph [ref=e19]: © 2026 Mission Meets Tech. All rights reserved.
```
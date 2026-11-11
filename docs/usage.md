# Usage

Step-by-step flows for each kind of user. For running the app locally, see the README.

## Player flow (guest)

1. Open **Play** (`/play`). The title shows today's date; the decoder names today's cipher.
2. Click a cell (click it again or press Space to switch across/down) and pick a clue from the lists. The decoder shows the selected clue.
3. Decode it: move the Caesar slider until the clue reads as English, read the Atbash output, or (Vigenère) solve the plain key clue and type that keyword.
4. Type the answer. Tab or Enter jumps to the next clue. Your letters stay after a refresh, and the guest timer starts with your first letter.
5. **Check** marks each clue green or red; **Submit** (once every cell is filled) shows "Solved in 4:12 · not ranked". Guest solves never appear on the leaderboard.

## Demo account

1. Open **Log In** (`/login`) and press **Try the demo account** (or type the username and password shown there).
2. Play as usual: letters save to the account and the server times the solve.
3. The demo account is never ranked, and its username, password and connected accounts can't be changed. Each demo login starts today's grid empty.

## Player flow (account)

1. **Log In** (`/login`) → **Continue with GitHub** or **Continue with Google**. The first time, this creates your account with a username from your GitHub login or Google name. No email address is asked for or stored.
2. Open **Play**. Your letters now save to your account and the timer starts.
3. **Check** marks each clue green (right) or red (wrong); editing clears the marks. **Submit** is enabled once every cell is filled.
4. When solved, the grid locks and shows your time and rank. See **Leaderboard** and your streaks on your **Account** page (click your username).
5. On **Account**, change the generated username, connect the other provider, and optionally **Add a password**. Right after a GitHub/Google sign-in no current password is needed; later, changing it asks for the current one.
6. With a password set, log in on `/login` with **username + password** instead.
7. Forgot your password? On **Account**, use *Sign in again with GitHub/Google*, then set a new password within 10 minutes. Saving it signs out your other sessions.

## Visitor flow

1. **Home** (`/`): introduction to Cryp-Cross.
2. **How it works** (`/idea`): the three ciphers and the features.
3. **Team** (`/team`): who built it.
4. Use the sun/moon button in the header to switch between the dark and light themes. On a phone, the menu button opens the page links.

[Back to README](../README.md)

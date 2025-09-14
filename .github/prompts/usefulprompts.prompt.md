---
mode: agent
---
first, go through codebase summary to understand how the codebase works and is currently summarized. read it entirely. then, go through every single file that was modified or created and has not been committed yet (find out which files by doing git status) and find out what was changed or modified. 

read these files themselves DIRECTLY, in their ENTIRETY- not just their changes. make any necessary updates to top level doc strings or comments in each of these file following preexisting conventions and styles of docs in the codebase. without inducing any redundancies. then update codebasesummary.md for each modified/updated file to reflect the new statuses of these files and codes in them, once again following established codebase summary style and convention: meaning only the present state of the code needs to be reflected in the codebase summary, not the history of changes. finally, make sure to follow all guidelines mentioned in ai_instructions file while doing all of the above.

do this piece by piece. start with the first 5 modified files - edit the files themselves to update their documentation (both top level, above functions, and individual comments within the code), and edit the codebase summary too. then the next 5. and so on. everything must be comprehensively updated. 
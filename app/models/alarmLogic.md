# Alarm Logic
## Most Important Real World Params
- Did they walk into the room? 
- Someone is walking through the door.
  - Ignore how many times they walk through the door.
- 

## Types of Zones
1) **Bed**
   1) Above Bed (Where would be getting up)
   2) Pillow ()
      - Acts as the reset.
      - When the motion has gone from above bed, to pillow, and has only been registering motion on pillow and not in common area, or bed area, reset to go into Sleeping Monitoring State.
2) Entry ways (doors, windows)

### Modes
#### PersonInRoom
 - ON State: 
   - If motion is detected in anything except **Bed** trigger a personInRoom true in *events*.
 - OFF State: 
    - If the Bed.Pillow is triggered
    - And If Above Bed region has not seen motion for x-time.
      - Note: x-time must be user configurable within a certain range.
    - then personInRoom is `false`
 - OtherInfo:
    - Reset Alarm State once PersonInRoom event is fired.

### Hierarchy: 



1. Primary Motion (Above Bed) `BOOL` true,false
2. Secondary Motion (people entering the room, cleaning bed, maybe filtered by when they are going to bed, etc.)

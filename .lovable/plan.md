
# Redesign the "Allocate Rooms" Tab

Transform the current card-based list into a timetable grid layout with improved visual design.

## Current State
The Allocate Rooms tab (`WeeklySchedule.tsx`) shows routines as stacked cards with small room buttons to click for allocation. It's functional but cluttered and hard to scan.

## New Design

### Timetable Grid View
Replace the card list with a proper timetable grid:
- **Rows** = Time slots (9-10 AM, 10-11 AM, ... 4-5 PM)
- **Columns** = Rooms (all available rooms)
- **Cells** = Show allocation status -- green if free, red/colored if allocated with batch/subject/teacher info
- Clicking any cell opens allocation or de-allocation options

### Layout Structure
- Top: Day selector buttons (Mon-Sat) -- styled as pill/segmented control
- Below: Filter bar with stream/batch dropdown to highlight specific batch allocations
- Main area: Scrollable grid table with rooms as columns, time slots as rows
- Allocated cells show batch, subject, and teacher in a compact format
- Free cells show a "+" icon, clickable to allocate

### Visual Improvements
- Segmented day selector instead of plain buttons
- Color-coded cells: green for free, red for allocated, amber for conflicts
- Hover tooltips on allocated cells showing full details
- Smooth transitions on state changes
- Summary stats bar: total rooms, allocated count, free count for selected day

## Technical Details

### File Changes

**`src/components/WeeklySchedule.tsx`** -- Full rewrite:
1. Fetch all rooms and all routines for the selected day in one pass
2. Build a 2D map: `timeSlot x room -> routine | null`
3. Render as an HTML table with sticky header (room numbers) and sticky first column (time slots)
4. Each cell is clickable:
   - If unallocated: opens a dialog to pick a routine to assign to that room/time
   - If allocated: shows details with option to deallocate
5. Add stream/batch filter dropdown to highlight or filter routines
6. Add summary stats (total rooms, allocated, free)

**No database changes required** -- uses existing `routines` and `rooms` tables.

### Grid Cell Content
- **Free cell**: Light green background, "+" icon, room available text
- **Allocated cell**: Red/rose background, shows subject (bold), batch, teacher name in 3 compact lines
- **Conflict cell**: Amber background if multiple routines overlap

### Responsive Behavior
- Horizontal scroll for many rooms on smaller screens
- Sticky time slot column so it's always visible while scrolling

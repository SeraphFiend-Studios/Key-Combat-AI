// Rooms data for Key Combat AI
// Each node defines a location in the dungeon run. The `next` field
// lists the identifiers of possible next rooms.

window.roomsData = [
  {
    id: 'room_start',
    type: 'combat',
    next: ['room_fork_left', 'room_fork_right']
  },
  {
    id: 'room_fork_left',
    type: 'reward',
    next: ['room_final']
  },
  {
    id: 'room_fork_right',
    type: 'combat',
    next: ['room_final']
  },
  {
    id: 'room_final',
    type: 'elite',
    next: []
  }
];
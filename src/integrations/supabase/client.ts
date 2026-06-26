import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Detect if we should use Mock Supabase.
// We force mock mode if the Supabase URL points to the inactive/deleted 'jocsuwoozsbokidnsgax' project,
// or if we fail to resolve DNS/connect to it.
const isProjectInactive = SUPABASE_URL.includes('jocsuwoozsbokidnsgax');

// Expose status to window for components to show banners/indicators
(window as any).isMockSupabase = isProjectInactive;

// Mock database query builder mimicking Postgrest
class MockSupabaseQueryBuilder {
  private tableName: string;
  private filters: any[] = [];
  private orderCol: string | null = null;
  private limitCount: number | null = null;
  private singleRow: boolean = false;
  private maybeSingleRow: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ type: 'neq', col, val });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ type: 'gte', col, val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ type: 'lte', col, val });
    return this;
  }

  ilike(col: string, val: any) {
    this.filters.push({ type: 'ilike', col, val });
    return this;
  }

  not(col: string, op: string, val: any) {
    this.filters.push({ type: 'not', col, op, val });
    return this;
  }

  order(col: string, options?: any) {
    this.orderCol = col;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleRow = true;
    return this.then();
  }

  maybeSingle() {
    this.maybeSingleRow = true;
    return this.then();
  }

  async then(onfulfilled?: (value: any) => any) {
    try {
      const res = await this.execute();
      if (onfulfilled) return onfulfilled(res);
      return res;
    } catch (err) {
      if (onfulfilled) return onfulfilled({ data: null, error: err });
      return { data: null, error: err };
    }
  }

  private async execute() {
    let data = JSON.parse(localStorage.getItem(`mock_db_${this.tableName}`) || '[]');
    
    // Apply filters
    for (const filter of this.filters) {
      data = data.filter((item: any) => {
        const itemVal = item[filter.col];
        if (filter.type === 'eq') {
          return String(itemVal) === String(filter.val);
        } else if (filter.type === 'neq') {
          return String(itemVal) !== String(filter.val);
        } else if (filter.type === 'gte') {
          return itemVal >= filter.val;
        } else if (filter.type === 'lte') {
          return itemVal <= filter.val;
        } else if (filter.type === 'ilike') {
          return String(itemVal).toLowerCase().includes(String(filter.val).toLowerCase());
        } else if (filter.type === 'not') {
          if (filter.op === 'is' && filter.val === null) {
            return itemVal !== null && itemVal !== undefined;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (this.orderCol) {
      data.sort((a: any, b: any) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      });
    }

    if (this.singleRow) {
      if (data.length === 0) {
        return { data: null, error: { message: 'Row not found' } };
      }
      return { data: data[0], error: null };
    }

    if (this.maybeSingleRow) {
      return { data: data.length > 0 ? data[0] : null, error: null };
    }

    return { data, error: null };
  }

  async insert(data: any) {
    const records = JSON.parse(localStorage.getItem(`mock_db_${this.tableName}`) || '[]');
    const rows = Array.isArray(data) ? data : [data];
    const newRows = rows.map((row) => ({
      id: row.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }));
    records.push(...newRows);
    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(records));
    return { data: Array.isArray(data) ? newRows : newRows[0], error: null };
  }

  async update(data: any) {
    let records = JSON.parse(localStorage.getItem(`mock_db_${this.tableName}`) || '[]');
    let updatedRows: any[] = [];
    
    records = records.map((item: any) => {
      let matches = true;
      for (const filter of this.filters) {
        const itemVal = item[filter.col];
        if (filter.type === 'eq' && String(itemVal) !== String(filter.val)) {
          matches = false;
        }
      }

      if (matches) {
        const updatedItem = {
          ...item,
          ...data,
          updated_at: new Date().toISOString(),
        };
        updatedRows.push(updatedItem);
        return updatedItem;
      }
      return item;
    });

    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(records));
    return { data: updatedRows, error: null };
  }

  async delete() {
    let records = JSON.parse(localStorage.getItem(`mock_db_${this.tableName}`) || '[]');
    let deletedRows: any[] = [];

    records = records.filter((item: any) => {
      let matches = true;
      for (const filter of this.filters) {
        const itemVal = item[filter.col];
        if (filter.type === 'eq' && String(itemVal) !== String(filter.val)) {
          matches = false;
        }
      }
      if (matches) {
        deletedRows.push(item);
        return false;
      }
      return true;
    });

    localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(records));
    return { data: deletedRows, error: null };
  }
}

// Seed Mock Database if empty
const seedMockDatabase = () => {
  if (localStorage.getItem('mock_db_seeded_v3')) return;

  // Clear stale database keys to resolve any reversed roles from previous tests
  localStorage.removeItem('mock_users');
  localStorage.removeItem('mock_db_profiles');
  localStorage.removeItem('mock_db_user_roles');
  localStorage.removeItem('mock_db_rooms');
  localStorage.removeItem('mock_db_batches');
  localStorage.removeItem('mock_db_routines');
  localStorage.removeItem('mock_session');

  const mockUsers = [
    { id: 'usr-admin-1', email: 'admin@tiuroom.com', password: 'Admin@TiuRoom!2026', full_name: 'Admin User', role: 'admin' },
    { id: 'usr-stud-1', email: 'student@gmail.com', password: 'student123', full_name: 'Student User', role: 'student' },
    { id: 'usr-teach-1', email: 'teacher@gmail.com', password: 'teacher123', full_name: 'Teacher User', role: 'teacher' },
  ];

  const mockProfiles = mockUsers.map(u => ({ id: u.id, email: u.email, full_name: u.full_name }));
  const mockUserRoles = mockUsers.map(u => ({ user_id: u.id, role: u.role }));

  const mockRooms = [
    // Ground floor
    { id: 'room-g01', floor_number: 0, room_number: 'G01', room_type: 'classroom', status: 'free' },
    { id: 'room-g02', floor_number: 0, room_number: 'G02', room_type: 'lab', status: 'free' },
    { id: 'room-g03', floor_number: 0, room_number: 'G03', room_type: 'classroom', status: 'free' },
    // 1st Floor
    { id: 'room-101', floor_number: 1, room_number: '101', room_type: 'classroom', status: 'free' },
    { id: 'room-102', floor_number: 1, room_number: '102', room_type: 'classroom', status: 'free' },
    { id: 'room-103', floor_number: 1, room_number: '103', room_type: 'lab', status: 'free' },
    { id: 'room-104', floor_number: 1, room_number: '104', room_type: 'classroom', status: 'free' },
    // 2nd Floor
    { id: 'room-201', floor_number: 2, room_number: '201', room_type: 'classroom', status: 'free' },
    { id: 'room-202', floor_number: 2, room_number: '202', room_type: 'classroom', status: 'free' },
    { id: 'room-203', floor_number: 2, room_number: '203', room_type: 'classroom', status: 'free' },
    // 3rd Floor
    { id: 'room-301', floor_number: 3, room_number: '301', room_type: 'classroom', status: 'free' },
    { id: 'room-302', floor_number: 3, room_number: '302', room_type: 'classroom', status: 'free' },
    { id: 'room-303', floor_number: 3, room_number: '303', room_type: 'lab', status: 'free' },
    { id: 'room-304', floor_number: 3, room_number: '304', room_type: 'conference', status: 'free' },
    // 4th Floor
    { id: 'room-401', floor_number: 4, room_number: '401', room_type: 'classroom', status: 'free' },
    { id: 'room-402', floor_number: 4, room_number: '402', room_type: 'classroom', status: 'free' },
    { id: 'room-403', floor_number: 4, room_number: '403', room_type: 'classroom', status: 'free' },
    // 5th Floor
    { id: 'room-501', floor_number: 5, room_number: '501', room_type: 'classroom', status: 'free' },
    { id: 'room-502', floor_number: 5, room_number: '502', room_type: 'classroom', status: 'free' },
    { id: 'room-503', floor_number: 5, room_number: '503', room_type: 'classroom', status: 'free' },
    // 6th Floor
    { id: 'room-601', floor_number: 6, room_number: '601', room_type: 'classroom', status: 'free' },
    { id: 'room-602', floor_number: 6, room_number: '602', room_type: 'classroom', status: 'free' },
    { id: 'room-603', floor_number: 6, room_number: '603', room_type: 'classroom', status: 'free' },
  ];

  const mockBatches = [
    { id: 'b-1', stream: 'B.Tech', batch_name: 'Bes AI 1A' },
    { id: 'b-2', stream: 'B.Tech', batch_name: 'Bes AI 1B' },
    { id: 'b-3', stream: 'B.Tech', batch_name: 'Bes AI 2A' },
    { id: 'b-4', stream: 'B.Tech', batch_name: 'Bes AI 2B' },
    { id: 'b-5', stream: 'B.Tech', batch_name: 'Bes AI 3A' },
    { id: 'b-6', stream: 'B.Tech', batch_name: 'Bes AI 3B' },
    { id: 'b-7', stream: 'B.Tech', batch_name: 'Bes AI 4A' },
    { id: 'b-8', stream: 'B.Tech', batch_name: 'Bes AI 4B' },
    { id: 'b-9', stream: 'CSE (Core)', batch_name: 'CSE 1A' },
    { id: 'b-10', stream: 'CSE (Core)', batch_name: 'CSE 1B' },
    { id: 'b-11', stream: 'CSE (Core)', batch_name: 'CSE 2A' },
    { id: 'b-12', stream: 'CSE (Core)', batch_name: 'CSE 2B' },
    { id: 'b-13', stream: 'CSE (Core)', batch_name: 'CSE 3A' },
    { id: 'b-14', stream: 'CSE (Core)', batch_name: 'CSE 3B' },
    { id: 'b-15', stream: 'CSE (Core)', batch_name: 'CSE 4A' },
    { id: 'b-16', stream: 'CSE (Core)', batch_name: 'CSE 4B' },
    { id: 'b-17', stream: 'B.Sc', batch_name: 'Physics 1A' },
    { id: 'b-18', stream: 'B.Sc', batch_name: 'Physics 2A' },
  ];

  const mockRoutines = [
    {
      id: 'rout-1',
      day_of_week: 1, // Monday
      start_time: '09:00',
      end_time: '10:00',
      subject: 'Machine Learning',
      stream: 'B.Tech',
      batch: 'Bes AI 4A',
      teacher_name: 'Dr. Smith',
      default_room: '101',
      allocated_room_id: 'room-101'
    },
    {
      id: 'rout-2',
      day_of_week: 1, // Monday
      start_time: '10:00',
      end_time: '11:00',
      subject: 'Data Structures',
      stream: 'CSE (Core)',
      batch: 'CSE 2A',
      teacher_name: 'Prof. Johnson',
      default_room: '102',
      allocated_room_id: 'room-102'
    },
    {
      id: 'rout-3',
      day_of_week: 2, // Tuesday
      start_time: '11:00',
      end_time: '12:00',
      subject: 'Physics Lab',
      stream: 'B.Sc',
      batch: 'Physics 1A',
      teacher_name: 'Dr. Kumar',
      default_room: '103',
      allocated_room_id: 'room-103'
    },
    {
      id: 'rout-4',
      day_of_week: 1, // Monday
      start_time: '12:00',
      end_time: '13:00',
      subject: 'Computer Networks',
      stream: 'CSE (Core)',
      batch: 'CSE 3A',
      teacher_name: 'Dr. Sen',
      default_room: '201',
      allocated_room_id: 'room-201'
    },
  ];

  localStorage.setItem('mock_users', JSON.stringify(mockUsers));
  localStorage.setItem('mock_db_profiles', JSON.stringify(mockProfiles));
  localStorage.setItem('mock_db_user_roles', JSON.stringify(mockUserRoles));
  localStorage.setItem('mock_db_rooms', JSON.stringify(mockRooms));
  localStorage.setItem('mock_db_batches', JSON.stringify(mockBatches));
  localStorage.setItem('mock_db_routines', JSON.stringify(mockRoutines));
  localStorage.setItem('mock_db_seeded_v3', 'true');
};

// Initialize if mock mode is active
if (isProjectInactive) {
  seedMockDatabase();
}

// Custom listeners for auth changes
const authStateListeners: ((event: string, session: any) => void)[] = [];

// Mock Auth system
const mockAuth = {
  async signInWithPassword({ email, password }: any) {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.password !== password) {
      return { data: null, error: { message: 'Invalid email or password' } };
    }

    // For demo convenience, if they enter a mock user, we sign them in.
    // If user is not found, we create a student user automatically so they don't get stuck!
    let sessionUser = user;
    if (!sessionUser) {
      // Create user on the fly as a student, teacher, or admin so they can log in with any credentials!
      let role = 'student';
      if (email.toLowerCase().includes('admin')) {
        role = 'admin';
      } else if (email.toLowerCase().includes('teacher')) {
        role = 'teacher';
      }
      
      const newUserId = 'usr-' + crypto.randomUUID();
      const newUser = {
        id: newUserId,
        email: email,
        password: password,
        full_name: email.split('@')[0],
        role: role
      };
      
      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));

      // Insert profile and role
      const profiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
      profiles.push({ id: newUserId, email: email, full_name: newUser.full_name });
      localStorage.setItem('mock_db_profiles', JSON.stringify(profiles));

      const roles = JSON.parse(localStorage.getItem('mock_db_user_roles') || '[]');
      roles.push({ user_id: newUserId, role: newUser.role });
      localStorage.setItem('mock_db_user_roles', JSON.stringify(roles));

      sessionUser = newUser;
    }

    const session = {
      access_token: 'mock-token',
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        user_metadata: { full_name: sessionUser.full_name }
      }
    };

    localStorage.setItem('mock_session', JSON.stringify(session));
    
    // Trigger auth listeners
    authStateListeners.forEach((listener) => listener('SIGNED_IN', session));

    return { data: { user: session.user, session }, error: null };
  },

  async signUp({ email, password, options }: any) {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { data: null, error: { message: 'User already exists' } };
    }

    const newUserId = 'usr-' + crypto.randomUUID();
    
    // Determine role based on option data
    const requestedRole = options?.data?.role;
    let role = 'student';
    if (requestedRole === 'admin') {
      role = 'admin';
    } else if (requestedRole === 'teacher') {
      role = 'teacher';
    }

    const newUser = {
      id: newUserId,
      email,
      password,
      full_name: options?.data?.full_name || email.split('@')[0],
      role
    };

    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));

    // Profile & Role creation mapping trigger equivalent
    const profiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]');
    profiles.push({ id: newUserId, email: email, full_name: newUser.full_name });
    localStorage.setItem('mock_db_profiles', JSON.stringify(profiles));

    const roles = JSON.parse(localStorage.getItem('mock_db_user_roles') || '[]');
    roles.push({ user_id: newUserId, role: newUser.role });
    localStorage.setItem('mock_db_user_roles', JSON.stringify(roles));

    const session = {
      access_token: 'mock-token',
      user: {
        id: newUserId,
        email,
        user_metadata: { full_name: newUser.full_name }
      }
    };

    // Auto-login after sign-up
    localStorage.setItem('mock_session', JSON.stringify(session));
    authStateListeners.forEach((listener) => listener('SIGNED_IN', session));

    return { data: { user: session.user, session }, error: null };
  },

  async signOut() {
    localStorage.removeItem('mock_session');
    authStateListeners.forEach((listener) => listener('SIGNED_OUT', null));
    return { error: null };
  },

  async getSession() {
    const sessionStr = localStorage.getItem('mock_session');
    if (!sessionStr) return { data: { session: null }, error: null };
    return { data: { session: JSON.parse(sessionStr) }, error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authStateListeners.push(callback);
    const sessionStr = localStorage.getItem('mock_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
    
    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = authStateListeners.indexOf(callback);
            if (idx !== -1) authStateListeners.splice(idx, 1);
          }
        }
      }
    };
  }
};

// If Supabase project is active, create the client as usual.
// If it's the inactive project, we swap it out with our mock implementation.
const realSupabase = createClient<Database>(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_PUBLISHABLE_KEY || 'placeholder', {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const supabase = isProjectInactive
  ? (new Proxy(realSupabase, {
      get(target, prop, receiver) {
        if (prop === 'auth') {
          return mockAuth;
        }
        if (prop === 'from') {
          return (table: string) => new MockSupabaseQueryBuilder(table);
        }
        return Reflect.get(target, prop, receiver);
      }
    }) as any)
  : realSupabase;
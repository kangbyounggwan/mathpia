import { create } from 'zustand';
import { User, UserRole } from '../types';
import { allMockUsers } from '../services/mock/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock 사용자 데이터를 mockData에서 가져옴
const mockUsers: Record<string, User & { password: string }> = {};
for (const u of allMockUsers) {
  mockUsers[u.email] = {
    id: u.id,
    academyId: u.academyId,
    role: u.role,
    name: u.name,
    email: u.email,
    phone: u.phone,
    grade: u.grade,
    childrenIds: u.childrenIds,
    password: u.password,
    createdAt: u.createdAt,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // 임시 Mock 로그인 (나중에 Firebase Auth로 대체)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = mockUsers[email];
      if (mockUser && mockUser.password === password) {
        const { password: _, ...user } = mockUser;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: '이메일 또는 비밀번호가 올바르지 않습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '로그인 중 오류가 발생했습니다.', isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
  },
}));

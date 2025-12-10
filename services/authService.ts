import { User, UserGoal } from "../types";

const USERS_KEY = 'vss_users';
const SESSION_KEY = 'vss_session';

// Helper to simulate delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Temporary storage for unverified users
let tempUsers: Record<string, User> = {};

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay(800); // Simulate network

    // BACKDOOR DO ADMIN
    if (email === 'admin@vidasaudavel.com' && password === 'admin123') {
        const adminUser: User = {
            id: 'admin-master',
            name: 'Administrador',
            email: 'admin@vidasaudavel.com',
            goal: UserGoal.MAINTAIN,
            isAdmin: true,
            isVerified: true
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
        return adminUser;
    }

    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Email ou senha inválidos.");
    
    // Auto update user structure if missing new fields
    if (!user.lastWeightUpdate) {
        user.lastWeightUpdate = Date.now();
    }
    
    // FIX: Garantir que o array de notificações exista para evitar crashes em contas antigas
    if (!user.mealNotifications) {
        user.mealNotifications = [
          { id: '1', label: 'Café da Manhã', time: '08:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '2', label: 'Almoço', time: '12:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '3', label: 'Lanche', time: '16:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '4', label: 'Jantar', time: '20:00', days: [0,1,2,3,4,5,6], enabled: true },
        ];
    }
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // Signup agora inicia o processo, mas não loga imediatamente
  async signup(name: string, email: string, password: string): Promise<void> {
    await delay(800);
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (users.find(u => u.email === email)) {
      throw new Error("Este email já está cadastrado.");
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      goal: UserGoal.LOSE_WEIGHT,
      isVerified: false,
      lastWeightUpdate: Date.now(),
      mealNotifications: [
        { id: '1', label: 'Café da Manhã', time: '08:00', days: [0,1,2,3,4,5,6], enabled: true },
        { id: '2', label: 'Almoço', time: '12:00', days: [0,1,2,3,4,5,6], enabled: true },
        { id: '3', label: 'Lanche', time: '16:00', days: [0,1,2,3,4,5,6], enabled: true },
        { id: '4', label: 'Jantar', time: '20:00', days: [0,1,2,3,4,5,6], enabled: true },
      ]
    };

    // Store in temporary memory until verified
    tempUsers[email] = newUser;
    // In real app, send email API here
    return;
  },

  // Nova função para validar o código (Simulado 1234)
  async verifySignup(email: string, code: string): Promise<User> {
    await delay(800);
    
    const tempUser = tempUsers[email];
    if (!tempUser) throw new Error("Sessão de cadastro expirou. Tente novamente.");

    if (code !== '1234') throw new Error("Código inválido.");

    // Move to permanent storage
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const finalUser = { ...tempUser, isVerified: true };
    users.push(finalUser);
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));
    
    // Clean up temp
    delete tempUsers[email];
    
    return finalUser;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    const user = JSON.parse(sessionStr);
    
    // Hydrate fields if missing (migration logic for returning users)
    if (!user.mealNotifications) {
        user.mealNotifications = [
          { id: '1', label: 'Café da Manhã', time: '08:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '2', label: 'Almoço', time: '12:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '3', label: 'Lanche', time: '16:00', days: [0,1,2,3,4,5,6], enabled: true },
          { id: '4', label: 'Jantar', time: '20:00', days: [0,1,2,3,4,5,6], enabled: true },
        ];
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    
    return user;
  },

  async updateUser(updatedUser: User): Promise<User> {
    await delay(500);
    // Update in users list
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Update session
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  // --- ADMIN METHODS ---

  async getAllUsers(): Promise<User[]> {
    await delay(500);
    const usersStr = localStorage.getItem(USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  async deleteUser(userId: string): Promise<void> {
    await delay(500);
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  // --- Password Recovery Methods ---

  async initiatePasswordRecovery(email: string): Promise<boolean> {
    await delay(1000);
    const usersStr = localStorage.getItem(USERS_KEY);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error("Email não encontrado em nossa base de dados.");
    }
    
    // In a real app, this would send an email API request.
    return true; 
  },

  async resetPassword(email: string, newPassword: string): Promise<void> {
    await delay(1000);
    const usersStr = localStorage.getItem(USERS_KEY);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex === -1) throw new Error("Usuário não encontrado.");

    // Update password
    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};
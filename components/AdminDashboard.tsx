import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${name}? Essa ação não pode ser desfeita.`)) {
      await authService.deleteUser(id);
      fetchUsers(); // Refresh list
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4">
      <div className="bg-slate-800 rounded-3xl p-6 text-white mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Painel Admin</h2>
            <div className="p-2 bg-slate-700 rounded-lg">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
        </div>
        <p className="text-slate-400 text-sm">Controle total dos usuários do aplicativo.</p>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-700 p-4 rounded-xl">
                <span className="block text-2xl font-bold text-emerald-400">{users.length}</span>
                <span className="text-xs text-slate-300">Usuários Totais</span>
            </div>
             <div className="bg-slate-700 p-4 rounded-xl">
                <span className="block text-2xl font-bold text-blue-400">{users.filter(u => u.goal === 'Emagrecer').length}</span>
                <span className="text-xs text-slate-300">Emagrecendo</span>
            </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 mb-4 px-2">Usuários Cadastrados</h3>

      {loading ? (
        <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Nenhum usuário encontrado.</div>
      ) : (
        <div className="space-y-4">
            {users.map((user) => (
                <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            {user.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                            ) : (
                                <span className="font-bold text-slate-400 text-sm">{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{user.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                                {user.goal}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Usuário"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User, isNewUser?: boolean) => void;
}

type AuthView = 'LOGIN' | 'SIGNUP' | 'VERIFY_SIGNUP' | 'RECOVERY_EMAIL' | 'RECOVERY_RESET';

// Helper Component for Password Input
const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder: string; 
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium shadow-sm pr-12"
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
        tabIndex={-1}
      >
        {show ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
      </button>
    </div>
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    // Pelo menos 6 caracteres, 1 letra e 1 número
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return re.test(password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const user = await authService.login(email, password);
      onAuthSuccess(user, false);
    } catch (err: any) {
      setError(err.message || "Erro ao entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) { setError("Por favor, insira seu nome."); return; }
    if (!validateEmail(email)) { setError("Por favor, insira um e-mail válido."); return; }
    if (!validatePassword(password)) { setError("A senha deve ter no mínimo 6 caracteres, contendo letras e números."); return; }

    setIsLoading(true);
    try {
      // Inicia cadastro, mas não loga. Pede código.
      await authService.signup(name, email, password);
      setSuccessMsg("Código enviado para seu e-mail!");
      setView('VERIFY_SIGNUP');
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
      e.preventDefault();
      clearMessages();
      if (recoveryCode.length !== 4) { setError("Digite o código de 4 dígitos."); return; }

      setIsLoading(true);
      try {
        const user = await authService.verifySignup(email, recoveryCode);
        onAuthSuccess(user, true); // Loga usuário como Novo
      } catch(err: any) {
        setError(err.message || "Código inválido.");
      } finally {
        setIsLoading(false);
      }
  };

  const handleRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!validateEmail(email)) { setError("Por favor, insira um e-mail válido."); return; }
    setIsLoading(true);
    try {
      await authService.initiatePasswordRecovery(email);
      setSuccessMsg("Código enviado! (Simulação: use 1234)");
      setView('RECOVERY_RESET');
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (recoveryCode !== '1234') { setError("Código inválido."); return; }
    if (!validatePassword(newPassword)) { setError("A nova senha deve ter no mínimo 6 caracteres, contendo letras e números."); return; }
    
    setIsLoading(true);
    try {
      await authService.resetPassword(email, newPassword);
      setSuccessMsg("Senha redefinida com sucesso! Faça login.");
      setTimeout(() => {
        setView('LOGIN');
        setPassword('');
        setNewPassword('');
        setRecoveryCode('');
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao redefinir senha.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Helpers ---
  const inputClassName = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      
      <div className="mb-8 text-center flex flex-col items-center">
         <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce-slow">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
         </div>
         <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Vida Saudável é Saúde</h1>
         <p className="text-slate-500 font-medium mt-2">Seu assistente pessoal de nutrição</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a)</h2>
          <p className="text-emerald-100">
            {view === 'LOGIN' && 'Acesse sua conta para continuar.'}
            {view === 'SIGNUP' && 'Crie sua conta gratuita.'}
            {view === 'VERIFY_SIGNUP' && 'Verifique seu e-mail.'}
            {view === 'RECOVERY_EMAIL' && 'Recuperação de Acesso'}
            {view === 'RECOVERY_RESET' && 'Nova Senha'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center animate-pulse border border-red-200">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 text-center border border-green-200">
              {successMsg}
            </div>
          )}

          {/* === LOGIN FORM === */}
          {view === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClassName} placeholder="seu@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="******" />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { clearMessages(); setView('RECOVERY_EMAIL'); }} className="text-sm text-emerald-600 hover:underline font-medium">
                  Esqueci minha senha
                </button>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* === SIGNUP FORM === */}
          {view === 'SIGNUP' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClassName} placeholder="Seu nome completo" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClassName} placeholder="seu@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Letras e números (mín 6)" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4">
                {isLoading ? 'Criar Conta' : 'Cadastrar Grátis'}
              </button>
            </form>
          )}

          {/* === VERIFY SIGNUP FORM === */}
          {view === 'VERIFY_SIGNUP' && (
            <form onSubmit={handleVerifySignup} className="space-y-4">
               <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 mb-2 font-medium">
                 Enviamos um código para <strong>{email}</strong>. Use <strong>1234</strong> para testar.
               </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Código de Validação</label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value)}
                  className={`${inputClassName} tracking-widest text-center text-lg`}
                  placeholder="0000"
                  maxLength={4}
                  required
                />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4">
                {isLoading ? 'Validando...' : 'Liberar Acesso'}
              </button>
            </form>
          )}

          {/* === RECOVERY STEP 1: EMAIL === */}
          {view === 'RECOVERY_EMAIL' && (
            <form onSubmit={handleRecoveryEmail} className="space-y-4">
              <p className="text-sm text-slate-600 mb-4 font-medium">
                Digite o email cadastrado. Enviaremos um código para redefinir sua senha.
              </p>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClassName} placeholder="seu@email.com" required />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4">
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          )}

          {/* === RECOVERY STEP 2: CODE & NEW PASS === */}
          {view === 'RECOVERY_RESET' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
               <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-700 mb-2 font-medium">
                 Dica: Use <strong>1234</strong>.
               </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Código de Verificação</label>
                <input type="text" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} className={`${inputClassName} tracking-widest text-center text-lg`} placeholder="0000" maxLength={4} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha</label>
                <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha segura" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4">
                {isLoading ? 'Salvando...' : 'Redefinir Senha'}
              </button>
            </form>
          )}

          {/* === NAVIGATION LINKS === */}
          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            {view === 'LOGIN' && (
              <button onClick={() => { clearMessages(); setView('SIGNUP'); }} className="text-emerald-600 font-bold hover:underline text-sm">
                Não tem conta? Cadastre-se
              </button>
            )}
            {(view === 'SIGNUP' || view === 'RECOVERY_EMAIL' || view === 'RECOVERY_RESET' || view === 'VERIFY_SIGNUP') && (
              <button onClick={() => { clearMessages(); setView('LOGIN'); }} className="text-slate-500 font-bold hover:text-slate-800 text-sm">
                Voltar para Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
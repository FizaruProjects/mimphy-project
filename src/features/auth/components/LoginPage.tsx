import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSession, LearningStyle } from '@/types';
import { SupabaseService } from '@/lib/supabaseService';
import { School, User, Lock, Mail, ArrowRight, Cat, AlertCircle, UserCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'selection' | 'student_login' | 'teacher_login' | 'admin' | 'verified' | 'reset_password'>('selection');
  
  // Form States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', className: '', schoolName: '', learningStyle: LearningStyle.VISUAL });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      // Check for Supabase auth redirects in URL hash
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
          if (hash.includes('type=signup')) {
              setAuthMode('verified');
          } else if (hash.includes('type=recovery')) {
              setAuthMode('reset_password');
          }
          window.history.replaceState(null, '', window.location.pathname);
      }
  }, []);

  const clearForms = () => {
      setFormData({ name: '', email: '', password: '', className: '', schoolName: '', learningStyle: LearningStyle.VISUAL });
      setErrorMsg('');
      setSuccessMsg('');
  };

  const handleInput = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleResetPassword = async () => {
      if (!formData.password || formData.password.length < 6) {
          setErrorMsg('Password minimal 6 karakter');
          return;
      }
      setIsLoading(true);
      setErrorMsg('');
      try {
          const { error } = await SupabaseService.updatePassword(formData.password);
          if (error) throw error;
          setSuccessMsg('Password berhasil diubah! Silakan login.');
          setTimeout(() => setAuthMode('selection'), 3000);
      } catch (err: any) {
          setErrorMsg(err.message || 'Gagal mengubah password');
      } finally {
          setIsLoading(false);
      }
  };

  const handleLogin = async (roleTarget: string) => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await SupabaseService.loginUser(formData.email, formData.password);
        
        if (res.success && res.role) {
            if (roleTarget === 'admin' && res.role !== 'admin') { setErrorMsg("Bukan akun admin"); return; }
            if (roleTarget === 'teacher' && res.role !== 'teacher') { setErrorMsg("Bukan akun guru"); return; }
            if (roleTarget === 'student' && res.role !== 'student') { setErrorMsg("Bukan akun siswa"); return; }

            const session: UserSession = { 
                role: res.role, 
                userId: res.user?.id, 
                name: res.user?.name || (res.role === 'admin' ? 'Administrator' : ''), 
                className: res.user?.className,
                schoolName: res.user?.schoolName,
                photoUrl: res.user?.photoUrl,
                learningStyle: res.user?.learningStyle
            };
            
            setErrorMsg('');
            onLogin(session);
            
            // Redirect based on role
            if (res.role === 'student') navigate('/student');
            if (res.role === 'teacher') navigate('/teacher');
            if (res.role === 'admin') navigate('/admin');
            
        } else {
            setErrorMsg(res.message || 'Login gagal');
        }
      } catch (err: any) {
          setErrorMsg(err.message || 'Terjadi kesalahan saat login');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 transition-colors duration-500">
      <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
      </div>

      <div className="max-w-5xl w-full bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(220,38,38,0.15)] dark:shadow-none dark:border dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[650px] relative transition-colors duration-300">
        
        <div className="md:w-5/12 bg-gradient-to-br from-red-700 via-red-600 to-orange-600 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-flex relative mb-6 group">
                    <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/20 animate-in zoom-in duration-500 overflow-hidden">
                        <img src="/logo.png" alt="Mimphy Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.querySelector('svg')!.style.display = 'block'; }} />
                        <Cat className="w-10 h-10 text-red-600 hidden" />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white tracking-tight">Mimphy <span className="text-orange-200">Catalyze</span></h1>
                <p className="text-red-100 text-lg font-medium">Platform Kuis Adaptif & Gamifikasi.</p>
            </div>
            
            <div className="relative z-10 mt-8 pt-8 border-t border-white/20 text-center md:text-left">
                 <p className="text-xs text-red-100 font-medium opacity-80">&copy; {new Date().getFullYear()} Mimphy Catalyze. Hak Cipta Dilindungi.</p>
            </div>
        </div>

        <div className="md:w-7/12 p-8 md:p-14 bg-white/50 dark:bg-slate-800 relative flex flex-col justify-center transition-colors duration-300">
            {authMode !== 'selection' && (
                <button 
                    onClick={() => { setAuthMode('selection'); clearForms(); }} 
                    className="absolute top-6 left-6 md:top-8 md:left-8 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-slate-700 px-4 py-2 rounded-full text-sm hover:bg-red-100 dark:hover:bg-slate-600 transition-all hover:-translate-x-1"
                >
                    &larr; Kembali
                </button>
            )}

            <div className="w-full max-w-md mx-auto">
                {authMode === 'selection' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-extrabold text-stone-800 dark:text-white text-center mb-8">Pilih Peran</h2>
                        <RoleButton onClick={() => setAuthMode('student_login')} icon={User} title="Saya Siswa" sub="Kerjakan kuis & belajar" />
                        <RoleButton onClick={() => setAuthMode('teacher_login')} icon={School} title="Saya Guru" sub="Kelola materi & nilai" />
                        <button onClick={() => setAuthMode('admin')} className="block mx-auto text-sm text-stone-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 mt-4 transition-colors">Login Admin</button>
                    </div>
                ) : authMode === 'verified' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-4">
                            Akun Terverifikasi!
                        </h2>
                        <p className="text-stone-500 dark:text-slate-400 mb-8">
                            Email Anda telah berhasil diverifikasi. Anda sekarang dapat masuk ke dalam sistem.
                        </p>
                        <button 
                            onClick={() => setAuthMode('selection')}
                            className="w-full bg-red-600 text-white font-bold py-3.5 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all transform hover:-translate-y-1"
                        >
                            Lanjut Login
                        </button>
                    </div>
                ) : authMode === 'reset_password' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-6 text-center">
                            Buat Password Baru
                        </h2>
                        
                        {errorMsg && <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center animate-pulse border border-red-100 dark:border-red-900"><AlertCircle className="w-4 h-4 mr-2"/>{errorMsg}</div>}
                        {successMsg && <div className="mb-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm flex items-center border border-green-100 dark:border-green-900"><UserCheck className="w-4 h-4 mr-2"/>{successMsg}</div>}

                        <div className="space-y-4">
                            <InputGroup 
                                label="Password Baru" 
                                type="password" 
                                placeholder="Minimal 6 karakter"
                                value={formData.password} 
                                onChange={v => handleInput('password', v)} 
                                icon={Lock} 
                            />

                            <button 
                                onClick={handleResetPassword}
                                disabled={isLoading}
                                className="w-full bg-red-600 text-white font-bold py-3.5 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none mt-6 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Password'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-6 text-center">
                            Selamat Datang
                        </h2>
                        
                        {errorMsg && <div className="mb-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex items-center animate-pulse border border-red-100 dark:border-red-900"><AlertCircle className="w-4 h-4 mr-2"/>{errorMsg}</div>}

                        <div className="space-y-4">
                            <InputGroup 
                                label="Email" 
                                type="email" 
                                placeholder="nama@email.com"
                                value={formData.email} 
                                onChange={v => handleInput('email', v)} 
                                icon={Mail} 
                            />
                            <InputGroup 
                                label="Password" 
                                type="password" 
                                placeholder="Masukkan password rahasia"
                                value={formData.password} 
                                onChange={v => handleInput('password', v)} 
                                icon={Lock} 
                            />

                            <button 
                                onClick={() => {
                                    if (authMode === 'student_login') handleLogin('student');
                                    else if (authMode === 'teacher_login') handleLogin('teacher');
                                    else if (authMode === 'admin') handleLogin('admin');
                                }}
                                className="w-full bg-red-600 text-white font-bold py-3.5 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none mt-6 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
                            >
                                Masuk Akun
                            </button>
                        </div>
                        
                        <p className="text-center text-sm text-stone-500 dark:text-slate-400 mt-6">
                            Hubungi Admin Sekolah untuk pendaftaran akun baru.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const RoleButton = ({ onClick, icon: Icon, title, sub }: any) => (
    <button onClick={onClick} className="w-full flex items-center p-4 bg-white dark:bg-slate-700 border-2 border-stone-100 dark:border-slate-600 rounded-2xl hover:border-red-200 dark:hover:border-red-500 hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 group text-left">
        <div className="w-12 h-12 bg-red-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-100 dark:group-hover:bg-slate-600 transition-colors"><Icon className="w-6 h-6 text-red-600 dark:text-red-400"/></div>
        <div className="flex-1"><span className="block font-bold text-stone-800 dark:text-white">{title}</span><span className="text-xs text-stone-400 dark:text-slate-300">{sub}</span></div>
        <ArrowRight className="text-stone-300 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors"/>
    </button>
);

const InputGroup = ({ label, type = "text", value, onChange, icon: Icon, placeholder }: any) => (
    <div className="group">
        <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-slate-500 group-focus-within:text-red-500 transition-colors" />}
            <input 
                type={type} 
                className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-stone-100 dark:border-slate-700 rounded-xl focus:border-red-400 dark:focus:border-red-500 focus:outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-slate-600 text-stone-700 dark:text-slate-200 font-medium`} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder}
            />
        </div>
    </div>
);

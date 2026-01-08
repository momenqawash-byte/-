
import React, { useState } from 'react';
import { Lock, User, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface LoginPageProps {
    onLogin: (u: string, p: string) => Promise<boolean>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        // Slight delay to simulate checking and show animation
        setTimeout(async () => {
            const success = await onLogin(username, password);
            if (!success) {
                setError('اسم المستخدم أو كلمة المرور غير صحيحة');
                setIsLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden font-sans" dir="rtl">
            
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8 pb-6 text-center">
                        <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <span className="text-3xl font-black text-indigo-900" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                C<span className="text-indigo-600">'</span>M
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h2>
                        <p className="text-indigo-200 text-sm">أهلاً بك في نظام إدارة مساحة العمل</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-indigo-200 mr-1">اسم المستخدم</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pr-10 pl-3 py-3 border border-indigo-400/30 rounded-xl leading-5 bg-indigo-900/30 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" 
                                    placeholder="أدخل اسم المستخدم"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-indigo-200 mr-1">كلمة المرور</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pr-10 pl-3 py-3 border border-indigo-400/30 rounded-xl leading-5 bg-indigo-900/30 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" 
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm animate-fade-in">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-indigo-900 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-indigo-900 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    دخول للنظام <ArrowRight size={18} className="mr-2" />
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="px-8 py-4 bg-indigo-950/30 border-t border-indigo-500/10 text-center">
                        <p className="text-xs text-indigo-300">Co'Ma Workspace Manager v1.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

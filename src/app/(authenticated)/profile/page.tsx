'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, User, Save, ArrowLeft, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [fullName, setFullName] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        getProfile()
    }, [])

    async function getProfile() {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUser(user)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                setProfile(data)
                setFullName(data.full_name || '')
            }
        } catch (error: any) {
            console.error('Error loading user data:', error.message)
        } finally {
            setLoading(false)
        }
    }

    async function updateProfile() {
        try {
            setSaving(true)
            setMessage('')

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    full_name: fullName,
                    // role is handled by trigger/admin, not editable here usually
                })

            if (error) throw error
            setMessage('Profile updated successfully!')
        } catch (error: any) {
            setMessage('Error updating profile: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl shadow-blue-900/10">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                            <User className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Profile Settings</h1>
                            <p className="text-zinc-400 mt-1">Manage your account information</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Email Field (Read Only) */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="text"
                                disabled
                                value={user?.email || ''}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                            />
                        </div>

                        {/* Role Field (Read Only) */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Role
                            </label>
                            <div className="flex items-center">
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20 capitalize">
                                    {profile?.role || 'student'}
                                </span>
                            </div>
                        </div>

                        {/* Full Name Field (Editable) */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600"
                            />
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm ${message.includes('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                {message}
                            </div>
                        )}

                        <div className="pt-4 border-t border-zinc-800">
                            <button
                                onClick={updateProfile}
                                disabled={saving}
                                className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

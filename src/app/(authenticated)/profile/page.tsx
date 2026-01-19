'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, User, Save, ArrowLeft, LogOut, Briefcase, FileText, PenTool } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TeacherDetails {
    specialization: string
    bio: string
    signature_url: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null)
    const [isFirstLogin, setIsFirstLogin] = useState(false)

    // Form fields
    const [fullName, setFullName] = useState('')
    const [specialization, setSpecialization] = useState('')
    const [bio, setBio] = useState('')
    const [signatureUrl, setSignatureUrl] = useState('')
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

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileError && profileError.code !== 'PGRST116') {
                throw profileError
            }

            if (profileData) {
                setProfile(profileData)
                setFullName(profileData.full_name || '')
            }

            // Fetch teacher details
            const { data: teacherData, error: teacherError } = await supabase
                .from('teacher_details')
                .select('*')
                .eq('id', user.id)
                .single()

            if (teacherError && teacherError.code !== 'PGRST116') {
                // PGRST116 = no rows found, which is fine for first login
                console.log('Teacher details not found, first login detected')
            }

            if (teacherData) {
                setTeacherDetails(teacherData)
                setSpecialization(teacherData.specialization || '')
                setBio(teacherData.bio || '')
                setSignatureUrl(teacherData.signature_url || '')
            } else {
                // First login - no teacher_details exist yet
                setIsFirstLogin(true)
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

            // Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user?.id)

            if (profileError) throw profileError

            // Upsert teacher_details
            const { error: teacherError } = await supabase
                .from('teacher_details')
                .upsert({
                    id: user?.id,
                    specialization: specialization,
                    bio: bio,
                    signature_url: signatureUrl,
                    updated_at: new Date().toISOString()
                })

            if (teacherError) throw teacherError

            setIsFirstLogin(false)
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

                {/* First Login Welcome Banner */}
                {isFirstLogin && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <h3 className="font-bold mb-1">Welcome! Please complete your profile</h3>
                        <p className="text-sm text-blue-300/80">Fill in your details below to get started.</p>
                    </div>
                )}

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
                                    {profile?.role || 'teacher'}
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

                        <hr className="border-zinc-800" />

                        {/* Teacher Details Section */}
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-400" />
                            Teacher Details
                        </h3>

                        {/* Specialization */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Specialization
                            </label>
                            <input
                                type="text"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                placeholder="e.g., Network Security, Ethical Hacking"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell students about yourself..."
                                rows={4}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600 resize-none"
                            />
                        </div>

                        {/* Signature URL */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                                <PenTool className="w-4 h-4" />
                                Signature URL
                            </label>
                            <input
                                type="url"
                                value={signatureUrl}
                                onChange={(e) => setSignatureUrl(e.target.value)}
                                placeholder="https://storage.example.com/signatures/your-signature.png"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Upload your signature image to Supabase Storage and paste the URL here.
                            </p>
                            {signatureUrl && (
                                <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                    <p className="text-xs text-zinc-400 mb-2">Preview:</p>
                                    <img
                                        src={signatureUrl}
                                        alt="Signature preview"
                                        className="max-h-20 bg-white p-2 rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}
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
                                {isFirstLogin ? 'Complete Profile' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// 1. SUPABASE INITIALIZATION & SESSION MANAGEMENT
// ==========================================
const SUPABASE_URL = 'https://ggiwmwinrcxrkqcevqnz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SYYnHD1Ws3cz5lva25quxQ_ey7XgL4v';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Image URL Converter & Sanitizer
function getDirectImageUrl(url) {
    if (!url) return '';
    let cleanUrl = url.trim();

    // Convert Google Drive view URLs to direct image streams
    if (cleanUrl.includes('drive.google.com/file/d/')) {
        const fileId = cleanUrl.split('/d/')[1].split('/')[0];
        return `https://lh3.googleusercontent.com/d/${fileId}=s220`;
    }

    // Convert Dropbox sharing links
    if (cleanUrl.includes('dropbox.com')) {
        return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    // Add https if protocol is missing
    if (!/^https?:\/\//i.test(cleanUrl)) {
        return 'https://' + cleanUrl;
    }

    return cleanUrl;
}

// Session State Helper
const Session = {
    getUser: () => JSON.parse(localStorage.getItem('portal_current_user') || 'null'),
    setUser: (user) => localStorage.setItem('portal_current_user', JSON.stringify(user)),
    clear: () => localStorage.removeItem('portal_current_user')
};

let currentUser = Session.getUser();
let jitsiApi = null; // Master instance for Live Video Classes

// Master Admin Access Control
const MASTER_ADMIN_EMAIL = 'schoolsystems.ange.rw@gmail.com';

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    
    setupAuthTabs();
    setupEventListeners();
    checkSession();
});

// Session Checker
async function checkSession() {
    currentUser = Session.getUser();
    const userBadge = document.getElementById('user-badge');
    const authStatus = document.getElementById('auth-status');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser) {
        // Re-verify user record with Supabase DB
        const { data: dbUser } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('email', currentUser.email)
            .maybeSingle();

        if (dbUser) {
            currentUser = dbUser;
            Session.setUser(dbUser);
        }

        if (userBadge) {
            userBadge.classList.remove('hidden');
            userBadge.classList.add('flex');
        }
        if (authStatus) {
            const displayRole = currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'SYSTEM OWNER' : currentUser.role.toUpperCase();
            authStatus.textContent = `${currentUser.name || currentUser.full_name} (${displayRole})`;
        }
        if (logoutBtn) logoutBtn.classList.remove('hidden');

        // Check teacher approval status
        if (currentUser.role === 'teacher' && currentUser.account_status === 'pending') {
            alert('Your account is awaiting payment verification by the System Owner.');
            Session.clear();
            checkSession();
            return;
        }

        // Handle Master Owner Routing vs Roles
        if (currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
            showRoleDashboard('owner');
        } else {
            showRoleDashboard(currentUser.role);
        }
    } else {
        if (userBadge) userBadge.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        showAuthSection();
    }
}

// Navigation Controls
function hideAllSections() {
    ['auth-section', 'owner-dashboard', 'teacher-dashboard', 'student-dashboard'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showAuthSection() {
    hideAllSections();
    const authSec = document.getElementById('auth-section');
    if (authSec) authSec.classList.remove('hidden');
}

function showRoleDashboard(role) {
    hideAllSections();
    if (role === 'owner') {
        const ownerDb = document.getElementById('owner-dashboard');
        if (ownerDb) ownerDb.classList.remove('hidden');
        renderOwnerDashboard();
    } else if (role === 'teacher' || role === 'head_teacher') {
        const teacherDb = document.getElementById('teacher-dashboard');
        if (teacherDb) teacherDb.classList.remove('hidden');
        renderTeacherDashboard();
    } else if (role === 'student') {
        const studentDb = document.getElementById('student-dashboard');
        if (studentDb) studentDb.classList.remove('hidden');
        renderStudentDashboard();
    }
}

// Auth UI Navigation
function setupAuthTabs() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('reg-role');
    const teacherFields = document.getElementById('teacher-fields');

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md';
            tabRegister.className = 'flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition';
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.className = 'flex-1 py-2 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow-md';
            tabLogin.className = 'flex-1 py-2 text-xs font-bold text-slate-400 hover:text-white transition';
            if (registerForm) registerForm.classList.remove('hidden');
            if (loginForm) loginForm.classList.add('hidden');
        });
    }

    if (roleSelect && teacherFields) {
        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'teacher') {
                teacherFields.classList.remove('hidden');
            } else {
                teacherFields.classList.add('hidden');
            }
        });
    }
}

// ==========================================
// 2. EVENT LISTENERS & REGISTRATION (ACE2026 VALIDATION)
// ==========================================
function setupEventListeners() {
    // Registration Handler with ACE2026 School Code Check
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const role = document.getElementById('reg-role')?.value || '';
            const name = document.getElementById('reg-name')?.value || '';
            const email = document.getElementById('reg-email')?.value || '';
            const phone = document.getElementById('reg-phone')?.value || '';
            const password = document.getElementById('reg-password')?.value || '';

            if (!email || !name) {
                alert('Please enter your name and email address.');
                return;
            }

            // Check if profile exists
            const { data: existingUser } = await supabaseClient
                .from('profiles')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                alert('An account with this email already exists.');
                return;
            }

            const rawLogoUrl = role === 'teacher' ? (document.getElementById('reg-school-logo')?.value || '') : '';
            const finalRole = email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'owner' : role;

            const newUser = {
                role: finalRole,
                name: name,
                full_name: name,
                email: email,
                phone: phone,
                phone_number: phone,
                password: password,
                account_status: role === 'teacher' ? 'pending' : 'active',
                school: role === 'teacher' ? (document.getElementById('reg-school')?.value || 'SmartEdu School') : '',
                school_location: role === 'teacher' ? (document.getElementById('reg-school-location')?.value || '') : '',
                position: role === 'teacher' ? (document.getElementById('reg-position')?.value || '') : '',
                school_logo_url: typeof getDirectImageUrl === 'function' ? getDirectImageUrl(rawLogoUrl) : rawLogoUrl,
                payment_ref: role === 'teacher' ? (document.getElementById('reg-payment-ref')?.value || '') : ''
            };

            const { data: insertedData, error } = await supabaseClient
                .from('profiles')
                .insert([newUser])
                .select();

            if (error) {
                alert('Registration failed: ' + error.message);
                return;
            }

            const savedProfile = (insertedData && insertedData[0]) ? insertedData[0] : newUser;

            localStorage.setItem('currentUser', JSON.stringify(savedProfile));
            localStorage.setItem('user', JSON.stringify(savedProfile));
            window.currentUserProfile = savedProfile;

            if (role === 'teacher') {
                alert('Teacher account registered! Pending payment approval by System Owner.');
            } else {
                alert('Account created successfully! You can now log in.');
            }

            registerForm.reset();
            document.getElementById('tab-login')?.click();
        });
    }

    // Login Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data: user, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .maybeSingle();

            if (error || !user) {
                alert('Invalid email or password.');
                return;
            }

            Session.setUser(user);
            checkSession();
        });
    }

    // Logout Handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Session.clear();
            checkSession();
        });
    }

    // Class Generator
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('class-name')?.value || document.getElementById('create-class-title')?.value;
            const subject = document.getElementById('class-subject')?.value || document.getElementById('create-class-subject')?.value;
            const code = subject.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

            const newClass = {
                teacher_email: currentUser.email,
                class_name: name,
                subject: subject,
                class_code: code
            };

            const { error } = await supabaseClient.from('classes').insert([newClass]);

            if (error) {
                alert('Error creating class: ' + error.message);
                return;
            }

            e.target.reset();
            renderTeacherDashboard();
        });
    }

    // Student Join Class
    const joinClassForm = document.getElementById('join-class-form');
    if (joinClassForm) {
        joinClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const classCodeInput = document.getElementById('join-class-code') || document.getElementById('join-code');
            const classCode = classCodeInput ? classCodeInput.value.trim().toUpperCase() : '';

            if (!classCode) {
                alert('Please enter a valid class code.');
                return;
            }

            const { data: classData, error: classError } = await supabaseClient
                .from('classes')
                .select('*')
                .eq('class_code', classCode)
                .maybeSingle();

            if (classError || !classData) {
                alert('Invalid Class Code! Please check the code with your teacher.');
                return;
            }

            const { error: enrollError } = await supabaseClient
                .from('enrollments')
                .insert([{
                    student_email: currentUser.email,
                    class_code: classCode
                }]);

            if (enrollError) {
                if (enrollError.code === '23505') {
                    alert('You have already joined this class!');
                } else {
                    alert('Failed to join class: ' + enrollError.message);
                }
                return;
            }

            alert('Successfully joined ' + classData.class_name + '!');
            if (classCodeInput) classCodeInput.value = '';
            renderStudentDashboard();
        });
    }
}

// ==========================================
// 3. LIVE CLASSROOM ENGINE (JITSI MEET)
// ==========================================
window.startLiveStream = function(classCode, className) {
    const modal = document.getElementById('live-stream-modal');
    const title = document.getElementById('live-stream-title');
    const container = document.getElementById('jitsi-container');

    if (!modal || !container) {
        alert("Live class modal container not found in HTML!");
        return;
    }

    const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'head_teacher';
    
    title.textContent = `Live Class: ${className} (${classCode}) — ${isTeacher ? 'Broadcasting (Host)' : 'Viewer Mode'}`;
    modal.classList.remove('hidden');
    container.innerHTML = '';

    const domain = 'meet.element.io';
    const roomName = `SmartEdu_Class_${classCode.replace(/[^a-zA-Z0-9]/g, '')}`;

    const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
            displayName: `${currentUser?.name || currentUser?.full_name || 'User'} (${isTeacher ? 'Teacher / Host' : 'Student'})`
        },
        configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            disableDeepLinking: true,
            mobileAppPromotionsEnabled: false
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
            TOOLBAR_BUTTONS: isTeacher ? [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'hangup', 'chat', 'raisehand', 'participants-pane'
            ] : [
                'microphone', 'fullscreen', 'hangup', 'chat', 'raisehand'
            ]
        }
    };

    if (typeof JitsiMeetExternalAPI !== 'undefined') {
        jitsiApi = new JitsiMeetExternalAPI(domain, options);

        jitsiApi.addEventListener('videoConferenceLeft', () => {
            window.closeLiveStream();
        });
    } else {
        alert("Jitsi API script not loaded. Check index.html head.");
    }
};

window.closeLiveStream = function() {
    if (typeof jitsiApi !== 'undefined' && jitsiApi) {
        try {
            jitsiApi.dispose();
        } catch (e) {
            console.warn("Jitsi cleanup warning:", e);
        }
        jitsiApi = null;
    }

    const container = document.getElementById('jitsi-container');
    if (container) container.innerHTML = '';

    const modal = document.getElementById('live-stream-modal');
    if (modal) modal.classList.add('hidden');
};

// ==========================================
// 4. OWNER & TEACHER DASHBOARD RENDERERS
// ==========================================
async function renderOwnerDashboard() {
    const container = document.getElementById('owner-pending-list');
    if (!container) return;

    const { data: pendingTeachers, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('account_status', 'pending');

    if (error || !pendingTeachers || pendingTeachers.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center">No pending teacher payment approvals.</p>`;
        return;
    }

    container.innerHTML = pendingTeachers.map(p => {
        const logoUrl = getDirectImageUrl(p.school_logo_url);
        return `
            <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex items-start gap-3">
                    ${logoUrl ? `
                        <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                            <img src="${logoUrl}" alt="School Logo" class="w-full h-full object-contain rounded-lg" onerror="this.onerror=null; this.parentElement.style.display='none';" />
                        </div>
                    ` : ''}
                    <div class="space-y-1">
                        <h4 class="font-bold text-sm text-white">${p.name || p.full_name} <span class="text-xs font-normal text-indigo-400">(${p.position || 'Teacher'})</span></h4>
                        <p class="text-xs text-indigo-300 font-semibold">${p.school || 'Unspecified School'} ${p.school_location ? `• ${p.school_location}` : ''}</p>
                        <p class="text-xs text-slate-400">Phone: <span class="text-slate-200 font-mono">${p.phone || p.phone_number || 'N/A'}</span> | Email: ${p.email}</p>
                        <p class="text-xs font-bold text-amber-400">MoMo Ref ID: ${p.payment_ref || 'N/A'}</p>
                    </div>
                </div>
                <button onclick="window.approveUser('${p.email}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20">
                    Approve Payment
                </button>
            </div>
        `;
    }).join('');
}

window.approveUser = async function(email) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ account_status: 'active' })
        .eq('email', email);

    if (error) {
        alert('Approval failed: ' + error.message);
        return;
    }

    renderOwnerDashboard();
    alert(`Account approved successfully!`);
};

async function renderTeacherDashboard() {
    const container = document.getElementById('teacher-classes-cards');
    if (!container) return;

    const { data: classes, error } = await supabaseClient
        .from('classes')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    if (error || !classes || classes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">No classes created yet. Fill out the form on the left to create your first class.</p>`;
        return;
    }

    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    const logoUrl = typeof getDirectImageUrl === 'function' ? getDirectImageUrl(currentUser?.school_logo_url) : null;

    container.innerHTML = classes.map(c => {
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];

        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${c.class_name || c.name || 'Class'}</h4>
                            <p class="text-xs text-slate-400">${c.subject || ''}</p>
                        </div>
                        ${logoUrl ? `
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${logoUrl}" alt="School Logo" class="w-full h-full object-contain rounded-lg" onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        ` : ''}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">School:</span> ${currentUser?.school || 'N/A'} ${currentUser?.school_location ? `(${currentUser.school_location})` : ''}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${currentUser?.name || currentUser?.full_name || 'Teacher'}</p>
                        <p class="text-slate-300"><span class="text-slate-500">Phone:</span> <span class="font-mono text-indigo-300">${currentUser?.phone || currentUser?.phone_number || 'N/A'}</span></p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${c.class_code}</span>
                    </div>
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name || c.name}')" class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        <i data-lucide="video" class="w-4 h-4"></i> Start Live Class / Screen Share
                    </button>

                    <button onclick="window.openCreateExamModal('${c.class_code}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        <i data-lucide="file-plus" class="w-4 h-4"></i> Create / Load Exam
                    </button>

                    ${classExams.map(ex => `
                        <button onclick="window.viewExamResults(${ex.id})" class="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold rounded-xl text-[11px] transition flex items-center justify-between px-3">
                            <span class="truncate">📊 ${ex.title || ex.exam_title || 'Exam'} Results</span>
                            <span class="text-emerald-400 font-bold">View Marks</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

async function renderStudentDashboard() {
    const container = document.getElementById('student-classes-cards');
    if (!container) return;

    const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments')
        .select('class_code')
        .eq('student_email', currentUser?.email);

    if (enrollError || !enrollments || enrollments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">You haven't joined any classes yet. Enter a code above to get started.</p>`;
        return;
    }

    const classCodes = enrollments.map(e => e.class_code);

    const { data: classes, error: classError } = await supabaseClient
        .from('classes')
        .select('*')
        .in('class_code', classCodes);

    if (classError || !classes || classes.length === 0) return;

    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .in('class_code', classCodes);

    const { data: submissions } = await supabaseClient
        .from('submissions')
        .select('*')
        .eq('student_email', currentUser?.email);

    const teacherEmails = [...new Set(classes.map(c => c.teacher_email))];
    const { data: teacherProfiles } = await supabaseClient
        .from('profiles')
        .select('*')
        .in('email', teacherEmails);

    const teacherMap = {};
    if (teacherProfiles) {
        teacherProfiles.forEach(t => { teacherMap[t.email] = t; });
    }

    container.innerHTML = classes.map(c => {
        const teacher = teacherMap[c.teacher_email] || {};
        const logoUrl = typeof getDirectImageUrl === 'function' ? getDirectImageUrl(teacher.school_logo_url) : null;
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];

        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1">
                            <h4 class="font-bold text-white text-sm">${c.class_name || c.name || 'Class'}</h4>
                            <p class="text-xs text-slate-400">${c.subject || ''}</p>
                        </div>
                        ${logoUrl ? `
                            <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1">
                                <img src="${logoUrl}" alt="School Logo" class="w-full h-full object-contain rounded-lg" onerror="this.onerror=null; this.parentElement.style.display='none';" />
                            </div>
                        ` : ''}
                    </div>

                    <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                        <p class="text-slate-300"><span class="text-slate-500">Teacher:</span> ${teacher.name || teacher.full_name || 'N/A'}</p>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Class Code:</span>
                        <span class="font-mono font-bold text-indigo-400 text-sm">${c.class_code}</span>
                    </div>
                </div>

                <div class="space-y-2 pt-2 border-t border-slate-800/80">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name || c.name}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        <i data-lucide="video" class="w-4 h-4"></i> Join Live Class
                    </button>

                    ${classExams.map(ex => {
                        const sub = submissions ? submissions.find(s => s.exam_id === ex.id) : null;
                        if (sub) {
                            return `
                                <button onclick="window.viewStudentMarkingGuide(${ex.id})" class="w-full py-2 bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs px-3 flex justify-between items-center font-semibold">
                                    <span>${ex.title}</span>
                                    <span class="font-mono font-bold text-[11px]">${sub.score_obtained}/${ex.total_marks} (${sub.percentage}%)</span>
                                </button>
                            `;
                        } else {
                            return `
                                <button onclick="window.openStudentExam(${ex.id})" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-between px-3">
                                    <span>${ex.title}</span>
                                    <span class="text-[10px]">⏱️ ${ex.duration_minutes}m</span>
                                </button>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ==========================================
// 5. EXAM CREATION & STUDENT TAKING ENGINE
// ==========================================
window.openCreateExamModal = function(classCode) {
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    title.innerText = "Create & Publish Class Exam";
    subtitle.innerText = `Class Code: ${classCode}`;

    body.innerHTML = `
        <form id="create-exam-form" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">Exam Title</label>
                <input type="text" id="exam-title" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" placeholder="e.g. Unit 2 Grammar Quiz">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Duration (Minutes)</label>
                    <input type="number" id="exam-duration" required value="30" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">Total Marks</label>
                    <input type="number" id="exam-total-marks" required value="100" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-400 mb-1">Exam Questions (One per line)</label>
                <textarea id="exam-questions" rows="6" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono" placeholder="1. What is the capital of Rwanda? {Kigali}&#10;2. Water boils at [100°C* | 50°C | 0°C]."></textarea>
            </div>
        </form>
    `;

    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
        <button onclick="window.saveExam('${classCode}')" class="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Publish Exam</button>
    `;

    modal.classList.remove('hidden');
};

window.saveExam = async function(classCode) {
    const title = document.getElementById('exam-title')?.value.trim();
    const duration = parseInt(document.getElementById('exam-duration')?.value || '30');
    const totalMarks = parseInt(document.getElementById('exam-total-marks')?.value || '100');
    const questionsRaw = document.getElementById('exam-questions')?.value.trim();

    if (!title || !questionsRaw) {
        alert("Please fill in both the Exam Title and Questions!");
        return;
    }

    const { error } = await supabaseClient
        .from('exams')
        .insert([{
            class_code: classCode,
            teacher_email: currentUser.email,
            title: title,
            duration_minutes: duration,
            total_marks: totalMarks,
            questions: questionsRaw
        }]);

    if (error) {
        alert("Error publishing exam: " + error.message);
    } else {
        alert("Exam published successfully!");
        window.closeExamModal();
        renderTeacherDashboard();
    }
};

window.closeExamModal = function() {
    const modal = document.getElementById('exam-modal');
    if (modal) modal.classList.add('hidden');
};

window.openStudentExam = async function(examId) {
    const { data: exam, error } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

    if (error || !exam) {
        alert("Could not load exam details.");
        return;
    }

    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    title.innerText = exam.title;

    const lines = exam.questions.split('\n').filter(l => l.trim() !== '');
    
    let html = `<form id="student-exam-form" class="space-y-4">`;
    lines.forEach((line, idx) => {
        html += `<div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">`;
        if (line.includes('[') && line.includes(']')) {
            const qText = line.split('[')[0].trim();
            const rawOptions = line.substring(line.indexOf('[') + 1, line.indexOf(']')).split('|');
            
            html += `<p class="text-xs font-bold text-white">${qText}</p><div class="space-y-1 mt-2">`;
            rawOptions.forEach(opt => {
                const cleanOpt = opt.replace('*', '').trim();
                html += `
                    <label class="flex items-center gap-2 text-xs text-slate-300 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                        <input type="radio" name="q_${idx}" value="${cleanOpt}">
                        ${cleanOpt}
                    </label>
                `;
            });
            html += `</div>`;
        } else if (line.includes('{') && line.includes('}')) {
            const qText = line.replace(/\{([^}]+)\}/g, '_____');
            html += `
                <p class="text-xs font-bold text-white">${qText}</p>
                <input type="text" name="q_${idx}" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-2" placeholder="Type answer...">
            `;
        } else {
            html += `<p class="text-xs font-bold text-white">${line}</p>`;
        }
        html += `</div>`;
    });
    html += `</form>`;

    body.innerHTML = html;
    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
        <button onclick="window.submitStudentExam(${exam.id})" class="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Submit Answers</button>
    `;

    modal.classList.remove('hidden');
};

window.submitStudentExam = async function(examId) {
    const form = document.getElementById('student-exam-form');
    if (!form) return;

    const { data: exam } = await supabaseClient.from('exams').select('*').eq('id', examId).single();
    if (!exam) return;

    const lines = exam.questions.split('\n').filter(l => l.trim() !== '');
    let totalQuestions = lines.length;
    let correctCount = 0;
    const studentAnswers = {};

    lines.forEach((line, idx) => {
        let expectedAnswer = "";
        let studentAnswer = "";

        if (line.includes('[') && line.includes(']')) {
            const rawOptions = line.substring(line.indexOf('[') + 1, line.indexOf(']')).split('|');
            const correctOpt = rawOptions.find(o => o.includes('*'));
            if (correctOpt) expectedAnswer = correctOpt.replace('*', '').trim().toLowerCase();

            const selectedRadio = form.querySelector(`input[name="q_${idx}"]:checked`);
            if (selectedRadio) studentAnswer = selectedRadio.value.trim().toLowerCase();
        } else if (line.includes('{') && line.includes('}')) {
            const match = line.match(/\{([^}]+)\}/);
            if (match) expectedAnswer = match[1].trim().toLowerCase();

            const textInput = form.querySelector(`input[name="q_${idx}"]`);
            if (textInput) studentAnswer = textInput.value.trim().toLowerCase();
        }

        studentAnswers[`q_${idx}`] = studentAnswer;

        if (studentAnswer && expectedAnswer && studentAnswer === expectedAnswer) {
            correctCount++;
        }
    });

    const pointsPerQuestion = exam.total_marks / (totalQuestions || 1);
    const scoreObtained = Math.round(correctCount * pointsPerQuestion);
    const percentage = Math.round((scoreObtained / exam.total_marks) * 100);

    await supabaseClient.from('submissions').insert([{
        exam_id: examId,
        student_email: currentUser?.email,
        student_name: currentUser?.name || currentUser?.full_name || 'Student',
        score_obtained: scoreObtained,
        percentage: percentage,
        answers: JSON.stringify(studentAnswers)
    }]);

    window.renderMarkingGuideInModal(exam, studentAnswers, scoreObtained, percentage);
    renderStudentDashboard();
};

window.renderMarkingGuideInModal = function(exam, studentAnswers, scoreObtained, percentage) {
    const title = document.getElementById('exam-modal-title');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!title || !body) return;

    title.innerText = `Marking Guide: ${exam.title}`;
    body.innerHTML = `
        <div class="p-4 rounded-xl text-center font-bold bg-slate-950 text-emerald-300">
            Score: ${scoreObtained} / ${exam.total_marks} (${percentage}%)
        </div>
    `;

    footer.innerHTML = `
        <button onclick="window.closeExamModal()" class="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Done Reviewing</button>
    `;
};

window.viewStudentMarkingGuide = async function(examId) {
    const { data: exam } = await supabaseClient.from('exams').select('*').eq('id', examId).single();
    const { data: sub } = await supabaseClient.from('submissions').select('*').eq('exam_id', examId).eq('student_email', currentUser?.email).single();

    if (!exam || !sub) return;

    let parsedAnswers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : (sub.answers || {});
    document.getElementById('exam-modal')?.classList.remove('hidden');
    window.renderMarkingGuideInModal(exam, parsedAnswers, sub.score_obtained, sub.percentage);
};

window.viewExamResults = async function(examId) {
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    const { data: exam } = await supabaseClient.from('exams').select('*').eq('id', examId).single();
    const { data: submissions } = await supabaseClient.from('submissions').select('*').eq('exam_id', examId);

    title.innerText = `Exam Results: ${exam?.title || 'Exam'}`;
    body.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead><tr class="text-slate-400"><th>Student</th><th>Score</th><th>Percentage</th></tr></thead>
                <tbody>
                    ${(submissions || []).map(s => `
                        <tr>
                            <td class="py-2 text-white">${s.student_name}</td>
                            <td class="py-2 font-mono">${s.score_obtained}/${exam.total_marks}</td>
                            <td class="py-2 font-bold text-emerald-400">${s.percentage}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    footer.innerHTML = `<button onclick="window.closeExamModal()" class="px-4 py-2 bg-slate-800 text-white text-xs rounded-xl">Close</button>`;
    modal.classList.remove('hidden');
};

// ==========================================
// 6. HELP DESK, INBOX & REPORT CARDS
// ==========================================
window.toggleHelpModal = function(show) {
    const modal = document.getElementById('help-desk-modal');
    if (modal) {
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
};

window.switchHelpTab = function(tab) {
    const newForm = document.getElementById('help-desk-form');
    const historyView = document.getElementById('help-history-view');

    if (tab === 'new') {
        newForm?.classList.remove('hidden');
        historyView?.classList.add('hidden');
    } else {
        newForm?.classList.add('hidden');
        historyView?.classList.remove('hidden');
        window.loadMyTickets();
    }
};

window.loadMyTickets = async function() {
    const container = document.getElementById('my-tickets-container');
    if (!container || !currentUser?.email) return;

    const { data: tickets } = await supabaseClient.from('help_tickets').select('*').ilike('user_email', currentUser.email);
    container.innerHTML = (tickets || []).map(t => `
        <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <p class="text-white font-bold">${t.category}</p>
            <p class="text-slate-300 mt-1">${t.message}</p>
            ${t.admin_response ? `<p class="text-indigo-400 mt-2">Reply: ${t.admin_response}</p>` : ''}
        </div>
    `).join('');
};

window.loadHelpTickets = async function() {
    const tbody = document.getElementById('help-tickets-tbody');
    if (!tbody) return;

    const { data: tickets } = await supabaseClient.from('help_tickets').select('*').order('created_at', { ascending: false });
    tbody.innerHTML = (tickets || []).map(t => `
        <tr>
            <td class="py-2 text-white">${t.user_name || t.user_email}</td>
            <td class="py-2 text-slate-300">${t.category}</td>
            <td class="py-2 text-slate-400">${t.message}</td>
            <td class="py-2"><button onclick="replyToTicket('${t.id}')" class="px-2 py-1 bg-indigo-600 rounded text-[10px] text-white">Reply</button></td>
        </tr>
    `).join('');
};

window.replyToTicket = async function(ticketId) {
    const response = prompt("Enter reply message:");
    if (!response) return;

    await supabaseClient.from('help_tickets').update({ admin_response: response, status: 'Resolved' }).eq('id', ticketId);
    window.loadHelpTickets();
};

async function generateReportCard(studentName, className, marksArray, schoolDetails) {
    const jsPDFLib = window.jspdf ? (window.jspdf.jsPDF || window.jspdf) : window.jsPDF;
    if (!jsPDFLib) return alert("PDF generator loading...");

    const pdf = new jsPDFLib();
    pdf.text(`REPORT CARD - ${studentName}`, 20, 20);
    pdf.text(`Class: ${className} | Term: ${schoolDetails.term || 'Term 3'}`, 20, 30);

    let y = 50;
    marksArray.forEach(m => {
        pdf.text(`${m.subject_name || 'Subject'}: ${m.marks_obtained}/${m.max_marks || 100}`, 20, y);
        y += 10;
    });

    pdf.save(`${studentName}_ReportCard.pdf`);
}

window.generateReportCard = generateReportCard;

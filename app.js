// ==========================================
// PART 1: CORE INITIALIZATION & SESSION
// ==========================================

const SUPABASE_URL = 'https://ggiwmwinrcxrkqcevqnz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SYYnHD1Ws3cz5lva25quxQ_ey7XgL4v';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Image URL Converter & Sanitizer
function getDirectImageUrl(url) {
    if (!url) return '';
    let cleanUrl = url.trim();

    if (cleanUrl.includes('drive.google.com/file/d/')) {
        const fileId = cleanUrl.split('/d/')[1].split('/')[0];
        return `https://lh3.googleusercontent.com/d/${fileId}=s220`;
    }

    if (cleanUrl.includes('dropbox.com')) {
        return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    if (!/^https?:\/\//i.test(cleanUrl)) {
        return 'https://' + cleanUrl;
    }

    return cleanUrl;
}

// Session State Helper
const Session = {
    getUser: () => {
        const userStr = localStorage.getItem('portal_current_user') || localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    setUser: (user) => {
        localStorage.setItem('portal_current_user', JSON.stringify(user));
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.currentUser = user;
    },
    clear: () => {
        localStorage.removeItem('portal_current_user');
        localStorage.removeItem('currentUser');
        window.currentUser = null;
    }
};

let currentUser = Session.getUser();
let jitsiApi = null;
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
        const { data: dbUser } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('email', currentUser.email)
            .maybeSingle();

        if (dbUser) {
            currentUser = dbUser;
            Session.setUser(dbUser);
        } else {
            window.currentUser = currentUser;
        }

        if (userBadge) {
            userBadge.classList.remove('hidden');
            userBadge.classList.add('flex');
        }
        if (authStatus) {
            const displayRole = currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'SYSTEM OWNER' : currentUser.role.toUpperCase();
            authStatus.textContent = `${currentUser.name} (${displayRole})`;
        }
        if (logoutBtn) logoutBtn.classList.remove('hidden');

        if (currentUser.role === 'teacher' && currentUser.account_status === 'pending') {
            alert('Your account is awaiting payment verification by the System Owner.');
            Session.clear();
            checkSession();
            return;
        }

        if (currentUser.email.toLowerCase() === MASTER_ADMIN_EMAIL) {
            showRoleDashboard('owner');
        } else {
            showRoleDashboard(currentUser.role);
        }
    } else {
        window.currentUser = null;
        if (userBadge) userBadge.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        showAuthSection();
    }
}

// Navigation Controls
function hideAllSections() {
    ['auth-section', 'owner-dashboard', 'head-teacher-dashboard', 'teacher-dashboard', 'student-dashboard'].forEach(id => {
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
    const activeUser = Session.getUser() || window.currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const actualRole = activeUser && activeUser.role ? activeUser.role : (typeof role !== 'undefined' ? role : '');

    if (actualRole === 'owner') {
        const ownerDb = document.getElementById('owner-dashboard');
        if (ownerDb) ownerDb.classList.remove('hidden');
        if (typeof renderOwnerDashboard === 'function') renderOwnerDashboard();
    } else if (actualRole === 'head-teacher') {
        const headTeacherDb = document.getElementById('head-teacher-dashboard');
        if (headTeacherDb) headTeacherDb.classList.remove('hidden');
        if (typeof renderHeadTeacherDashboard === 'function') renderHeadTeacherDashboard();
    } else if (actualRole === 'teacher') {
        const teacherDb = document.getElementById('teacher-dashboard');
        if (teacherDb) teacherDb.classList.remove('hidden');
        if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
    } else if (actualRole === 'student') {
        const studentDb = document.getElementById('student-dashboard');
        if (studentDb) studentDb.classList.remove('hidden');
        setTimeout(() => {
            if (typeof renderStudentDashboard === 'function') renderStudentDashboard();
        }, 200);
    }
}

// ==========================================
// PART 2: AUTH & EVENT LISTENERS
// ==========================================

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
            const role = e.target.value;
            if (role === 'teacher' || role === 'head-teacher') {
                teacherFields.classList.remove('hidden');
                const posSelect = document.getElementById('reg-position');
                if (posSelect) {
                    posSelect.value = (role === 'head-teacher') ? 'Head Teacher' : 'Teacher';
                }
            } else {
                teacherFields.classList.add('hidden');
            }
        });
    }
}

function setupEventListeners() {
    // Registration Handler
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

            const { data: existingUser } = await supabaseClient
                .from('profiles')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                alert('An account with this email already exists.');
                return;
            }

            const isStaff = (role === 'teacher' || role === 'head-teacher');
            const rawLogoUrl = isStaff ? (document.getElementById('reg-school-logo')?.value || '') : '';
            const finalRole = email.toLowerCase() === MASTER_ADMIN_EMAIL ? 'owner' : role;

            const newUser = {
                role: finalRole,
                name: name,
                full_name: name,
                email: email,
                phone: phone,
                phone_number: phone,
                password: password,
                account_status: isStaff ? 'pending' : 'active',
                school: isStaff ? (document.getElementById('reg-school')?.value || '') : '',
                school_location: isStaff ? (document.getElementById('reg-school-location')?.value || '') : '',
                position: isStaff ? (document.getElementById('reg-position')?.value || '') : '',
                school_logo_url: typeof getDirectImageUrl === 'function' ? getDirectImageUrl(rawLogoUrl) : rawLogoUrl,
                payment_ref: isStaff ? (document.getElementById('reg-payment-ref')?.value || '') : ''
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
            Session.setUser(savedProfile);

            if (isStaff) {
                alert('Staff/Head Teacher account registered! Pending payment approval by System Owner.');
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

            if ((user.role === 'teacher' || user.role === 'head-teacher') && user.account_status === 'pending') {
                alert('Your account is pending payment verification by the System Owner. Please contact schoolsystems.ange.rw@gmail.com.');
                return;
            }

            Session.setUser(user);
            checkSession();

            setTimeout(() => {
                if (typeof renderStudentDashboard === 'function') {
                    renderStudentDashboard();
                }
            }, 150);
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

    // Class Generator Form Handler
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
        createClassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('class-name').value;
            const subject = document.getElementById('class-subject').value;
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

    // Student Join Class Form Handler
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
// PART 3: LIVE STREAMS & DASHBOARDS
// ==========================================

window.startLiveStream = function(classCode, className) {
    const modal = document.getElementById('live-stream-modal');
    const title = document.getElementById('live-stream-title');
    const container = document.getElementById('jitsi-container');

    if (!modal || !container) {
        alert("Live class modal container not found in HTML!");
        return;
    }

    const isTeacher = currentUser?.role === 'teacher';
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
            displayName: `${currentUser?.name || 'User'} (${isTeacher ? 'Teacher / Host' : 'Student'})`
        },
        configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            disableDeepLinking: true,
            mobileAppPromotionsEnabled: false
        }
    };

    if (typeof JitsiMeetExternalAPI !== 'undefined') {
        jitsiApi = new JitsiMeetExternalAPI(domain, options);
        jitsiApi.addEventListener('videoConferenceLeft', () => window.closeLiveStream());
    } else {
        alert("Jitsi API script not loaded.");
    }
};

window.closeLiveStream = function() {
    if (typeof jitsiApi !== 'undefined' && jitsiApi) {
        try { jitsiApi.dispose(); } catch (e) {}
        jitsiApi = null;
    }
    const container = document.getElementById('jitsi-container');
    if (container) container.innerHTML = '';
    const modal = document.getElementById('live-stream-modal');
    if (modal) modal.classList.add('hidden');
};

async function renderOwnerDashboard() {
    const container = document.getElementById('owner-pending-list');
    if (!container) return;

    const { data: pendingStaff, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('account_status', 'pending');

    if (error || !pendingStaff || pendingStaff.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center">No pending teacher or head teacher payment approvals.</p>`;
        return;
    }

    container.innerHTML = pendingStaff.map(p => {
        const logoUrl = getDirectImageUrl(p.school_logo_url);
        const roleLabel = p.role === 'head-teacher' ? 'Head Teacher' : (p.position || 'Teacher');
        return `
            <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="flex items-start gap-3">
                    ${logoUrl ? `<div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 p-1"><img src="${logoUrl}" class="w-full h-full object-contain rounded-lg" /></div>` : ''}
                    <div>
                        <h4 class="font-bold text-sm text-white">${p.name} <span class="text-xs font-normal text-indigo-400">(${roleLabel})</span></h4>
                        <p class="text-xs text-indigo-300 font-semibold">${p.school || 'Unspecified School'} ${p.school_location ? `• ${p.school_location}` : ''}</p>
                        <p class="text-xs text-slate-400">Phone: ${p.phone || 'N/A'} | Email: ${p.email}</p>
                        <p class="text-xs font-bold text-amber-400">MoMo Ref ID: ${p.payment_ref || 'N/A'}</p>
                    </div>
                </div>
                <button onclick="window.approveUser('${p.email}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition">Approve Payment</button>
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

    const currentUser = Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');

    const { data: classes, error } = await supabaseClient
        .from('classes')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    if (error || !classes || classes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">No classes created yet.</p>`;
        return;
    }

    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .eq('teacher_email', currentUser?.email);

    container.innerHTML = classes.map(c => {
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];
        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-white text-sm">${c.class_name}</h4>
                    <p class="text-xs text-slate-400">${c.subject || ''}</p>
                    <p class="font-mono font-bold text-indigo-400 text-sm mt-2">Code: ${c.class_code}</p>
                </div>
                <div class="space-y-2 pt-2 border-t border-slate-800">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-xl font-bold">Start Live Class</button>
                    <button onclick="window.openCreateExamModal('${c.class_code}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-xl font-bold">Create Exam</button>
                    ${classExams.map(ex => `<button onclick="window.viewExamResults(${ex.id})" class="w-full py-1.5 bg-slate-950 text-slate-300 border border-slate-800 text-xs rounded-xl">View ${ex.title} Results</button>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// PART 4: STUDENT DASHBOARD & EXAMS
// ==========================================

async function renderStudentDashboard() {
    const container = document.getElementById('student-classes-cards');
    if (!container) return;

    const activeUser = Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : null;

    if (!studentEmail) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">Please log in to view your classes.</p>`;
        return;
    }

    const { data: enrollments, error: enrollError } = await supabaseClient
        .from('enrollments')
        .select('class_code')
        .eq('student_email', studentEmail);

    if (enrollError || !enrollments || enrollments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">You haven't joined any classes yet. Enter a code above to get started.</p>`;
        return;
    }

    const classCodes = enrollments.map(e => e.class_code);

    const { data: classes, error: classError } = await supabaseClient
        .from('classes')
        .select('*')
        .in('class_code', classCodes);

    if (classError || !classes || classes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-4 text-center col-span-2">No matching classes found.</p>`;
        return;
    }

    const { data: exams } = await supabaseClient
        .from('exams')
        .select('*')
        .in('class_code', classCodes);

    const { data: submissions } = await supabaseClient
        .from('submissions')
        .select('*')
        .eq('student_email', studentEmail);

    const teacherEmails = [...new Set(classes.map(c => c.teacher_email))];
    const { data: teacherProfiles } = await supabaseClient
        .from('profiles')
        .select('*')
        .in('email', teacherEmails);

    const teacherMap = {};
    if (teacherProfiles) {
        teacherProfiles.forEach(t => { if (t.email) teacherMap[t.email.toLowerCase().trim()] = t; });
    }

    container.innerHTML = classes.map(c => {
        const teacher = teacherMap[c.teacher_email?.toLowerCase().trim()] || {};
        const classExams = exams ? exams.filter(e => e.class_code === c.class_code) : [];

        let examsHtml = classExams.map(ex => {
            const sub = submissions ? submissions.find(s => s.exam_id === ex.id) : null;
            if (sub) {
                return `<button onclick="window.viewStudentMarkingGuide(${ex.id})" class="w-full py-2 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs px-3 flex justify-between items-center font-semibold"><span>${ex.title}</span><span class="font-mono">${sub.score_obtained}/${ex.total_marks} (${sub.percentage}%)</span></button>`;
            } else {
                return `<button onclick="window.openStudentExam(${ex.id})" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs px-3 flex justify-between items-center shadow"><span>${ex.title}</span><span>⏱️ ${ex.duration_minutes}m</span></button>`;
            }
        }).join('');

        return `
            <div class="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
                <div>
                    <h4 class="font-bold text-white text-sm">${c.class_name}</h4>
                    <p class="text-xs text-slate-400">${c.subject || ''}</p>
                    <p class="text-xs text-slate-300 mt-2">Teacher: ${teacher.name || c.teacher_email}</p>
                    <p class="font-mono font-bold text-indigo-400 text-xs mt-1">Code: ${c.class_code}</p>
                </div>
                <div class="space-y-2 pt-2 border-t border-slate-800">
                    <button onclick="window.startLiveStream('${c.class_code}', '${c.class_name}')" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-xl font-bold">Join Live Class</button>
                    ${examsHtml}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Exam & Marking Guide Handlers
window.openCreateExamModal = function(classCode) {
    const modal = document.getElementById('exam-modal');
    if (!modal) return;
    document.getElementById('exam-modal-title').innerText = "Publish Class Exam";
    document.getElementById('exam-modal-subtitle').innerText = `Class Code: ${classCode}`;
    document.getElementById('exam-modal-body').innerHTML = `
        <form id="create-exam-form" class="space-y-4">
            <div><label class="block text-xs font-bold text-slate-400 mb-1">Exam Title</label><input type="text" id="exam-title" required class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-xs font-bold text-slate-400 mb-1">Duration (Min)</label><input type="number" id="exam-duration" value="30" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"></div>
                <div><label class="block text-xs font-bold text-slate-400 mb-1">Total Marks</label><input type="number" id="exam-total-marks" value="100" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"></div>
            </div>
            <div><label class="block text-xs font-bold text-slate-400 mb-1">Questions (Use {Answer} or [Opt A* | Opt B])</label><textarea id="exam-questions" rows="6" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"></textarea></div>
        </form>
    `;
    document.getElementById('exam-modal-footer').innerHTML = `
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
        alert("Please fill in title and questions.");
        return;
    }

    const { error } = await supabaseClient.from('exams').insert([{
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

// ==========================================
// PART 5 & 6: REPORT CARDS & ROUTING
// ==========================================

window.loadDashboardForUser = function(user) {
    const activeUser = user || Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const actualRole = activeUser.role;

    if (actualRole === 'head-teacher') {
        const headTeacherDb = document.getElementById('head-teacher-dashboard');
        if (headTeacherDb) headTeacherDb.classList.remove('hidden');
        if (typeof renderHeadTeacherDashboard === 'function') renderHeadTeacherDashboard();
    } else if (actualRole === 'teacher') {
        const teacherDb = document.getElementById('teacher-dashboard');
        if (teacherDb) teacherDb.classList.remove('hidden');
        if (typeof renderTeacherDashboard === 'function') renderTeacherDashboard();
    } else if (actualRole === 'student') {
        const studentDb = document.getElementById('student-dashboard');
        if (studentDb) studentDb.classList.remove('hidden');
        if (typeof renderStudentDashboard === 'function') renderStudentDashboard();
    } else if (actualRole === 'owner') {
        const ownerDb = document.getElementById('owner-dashboard');
        if (ownerDb) ownerDb.classList.remove('hidden');
        if (typeof renderOwnerDashboard === 'function') renderOwnerDashboard();
    }
};

async function renderHeadTeacherDashboard() {
    const headTeacherSection = document.getElementById('head-teacher-dashboard');
    if (!headTeacherSection || headTeacherSection.classList.contains('hidden')) return;

    const staffContainer = document.getElementById('ht-staff-list');
    if (!staffContainer) return;

    const currentUser = Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const schoolName = currentUser.school || '';

    try {
        const { data: profiles, error } = await supabaseClient.from('profiles').select('*');
        if (error) throw error;

        const filteredProfiles = schoolName 
            ? profiles.filter(p => !p.school || p.school.trim().toLowerCase() === schoolName.trim().toLowerCase())
            : profiles;

        const teachers = filteredProfiles.filter(p => p.role === 'teacher' || p.role === 'owner' || p.role === 'head-teacher');
        const students = filteredProfiles.filter(p => p.role === 'student');

        staffContainer.innerHTML = `
            <div class="mb-8">
                <h3 class="text-white font-semibold text-lg mb-4">Registered Teachers & Staff (${teachers.length})</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead><tr class="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-900/80"><th class="py-3 px-4">Name</th><th class="py-3 px-4">Role</th><th class="py-3 px-4">Email</th></tr></thead>
                        <tbody class="divide-y divide-slate-800 text-slate-300">
                            ${teachers.map(t => `<tr><td class="py-3 px-4 text-white">${t.name}</td><td class="py-3 px-4 capitalize">${t.role}</td><td class="py-3 px-4 text-slate-400">${t.email}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div>
                <h3 class="text-white font-semibold text-lg mb-4">Registered Students (${students.length})</h3>
                <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead><tr class="border-b border-slate-800 text-slate-400 text-xs uppercase bg-slate-900/80"><th class="py-3 px-4">Name</th><th class="py-3 px-4">Email</th></tr></thead>
                        <tbody class="divide-y divide-slate-800 text-slate-300">
                            ${students.map(s => `<tr><td class="py-3 px-4 text-white">${s.name}</td><td class="py-3 px-4 text-slate-400">${s.email}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
    }
}
// AI Exam Generation Handler
window.handleAIGenerateExam = async function() {
    console.log("Generate AI Exam button clicked.");
    const examTitleInput = document.getElementById('ai-exam-title');
    const examTitle = examTitleInput ? examTitleInput.value.trim() : "Exam Quiz";
    
    const fileInput = document.getElementById('ai-exam-file');
    const documentText = await extractTextFromFile(fileInput);
    
    const promptText = `Generate a comprehensive multi-question exam titled "${examTitle}" based on the following curriculum notes/document content:\n\n${documentText}`;
    
    const statusBox = document.getElementById('ai-status-box');
    if (statusBox) statusBox.classList.remove('hidden');
    
    try {
        const result = await callChatGPTAPI(promptText);
        if (statusBox) statusBox.classList.add('hidden');
        handleExamGeneratedSuccess(examTitle, result);
    } catch (error) {
        if (statusBox) statusBox.classList.add('hidden');
        console.error("Exam generation failed:", error);
        alert("Error generating exam. Check console for details.");
    }
};

async function extractTextFromFile(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return "";
    const file = fileInput.files[0];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt')) {
        return await file.text();
    }
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        const arrayBuffer = await file.arrayBuffer();
        if (window.mammoth) {
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value;
        }
    }
    return `[Uploaded Document: ${file.name}]`;
}

async function callChatGPTAPI(promptText) {
    const apiKeyInput = document.getElementById('geminiApiKeyInput');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';

    const { data, error } = await supabaseClient.functions.invoke('generate-exam', {
        body: { promptText, apiKey }
    });

    if (error) throw new Error(error.message || JSON.stringify(error));
    if (data && data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));

    const textResult = data?.choices?.[0]?.message?.content || data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text;
    if (!textResult) throw new Error("No response content received from AI.");
    return textResult;
}

async function handleExamGeneratedSuccess(examTitle, rawQuestionsText) {
    const previewContainer = document.getElementById('teacher-exam-preview-container');
    if (!previewContainer) return;

    previewContainer.classList.remove('hidden');
    document.getElementById('preview-exam-title').value = examTitle || "Generated Assessment";
    document.getElementById('preview-exam-content').value = rawQuestionsText;
    
    await populateTargetClassDropdown();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
}

async function populateTargetClassDropdown() {
    const classSelect = document.getElementById('target-class-select');
    if (!classSelect) return;
    classSelect.innerHTML = '<option value="">-- Select Enrolled Class --</option>';

    try {
        const currentUser = Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser?.email) {
            const { data } = await supabaseClient.from('classes').select('*').eq('teacher_email', currentUser.email);
            if (data) {
                data.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.class_code;
                    option.textContent = `${cls.class_name} (${cls.subject || 'General'})`;
                    classSelect.appendChild(option);
                });
            }
        }
    } catch (err) {
        console.error("Failed to load classes:", err);
    }
}

// Teacher View Exam Results Modal
window.viewExamResults = async function(examId) {
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');
    const subtitle = document.getElementById('exam-modal-subtitle');
    const body = document.getElementById('exam-modal-body');
    const footer = document.getElementById('exam-modal-footer');

    if (!modal) return;

    const { data: exam, error: examError } = await supabaseClient.from('exams').select('*').eq('id', examId).single();
    if (examError || !exam) {
        alert("Could not load exam details.");
        return;
    }

    const { data: submissions } = await supabaseClient.from('submissions').select('*').eq('exam_id', examId).order('score_obtained', { ascending: false });

    title.innerText = `Exam Results: ${exam.title}`;
    subtitle.innerText = `Total Marks: ${exam.total_marks} | Submissions: ${submissions ? submissions.length : 0}`;

    if (!submissions || submissions.length === 0) {
        body.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">No submissions received yet.</div>`;
    } else {
        body.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 uppercase font-bold">
                            <th class="py-3 px-3">Student Name</th>
                            <th class="py-3 px-3">Email</th>
                            <th class="py-3 px-3 text-center">Score</th>
                            <th class="py-3 px-3 text-center">Percentage</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800 text-slate-300">
                        ${submissions.map(sub => `
                            <tr>
                                <td class="py-3 px-3 font-bold text-white">${sub.student_name || 'Student'}</td>
                                <td class="py-3 px-3 font-mono text-slate-400">${sub.student_email}</td>
                                <td class="py-3 px-3 text-center font-mono font-bold text-indigo-300">${sub.score_obtained} /${exam.total_marks}</td>
                                <td class="py-3 px-3 text-center"><span class="px-2 py-0.5 rounded text-xs font-bold ${sub.percentage >= 50 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}">${sub.percentage}%</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    footer.innerHTML = `<button onclick="window.closeExamModal()" class="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Close</button>`;
    modal.classList.remove('hidden');
};
// Publish AI Generated Exam to Class
window.publishExamToClass = async function() {
    const title = document.getElementById('preview-exam-title')?.value;
    const content = document.getElementById('preview-exam-content')?.value;
    const classCode = document.getElementById('target-class-select')?.value;

    if (!classCode) {
        alert("Please select a target class to publish this exam.");
        return;
    }

    if (!content || !content.trim()) {
        alert("Exam content cannot be empty.");
        return;
    }

    const currentUser = Session.getUser() || JSON.parse(localStorage.getItem('currentUser') || '{}');

    try {
        const payload = {
            title: title || "AI Assessment",
            questions: content,
            class_code: classCode, 
            teacher_email: currentUser.email || 'schoolsystems.ange.rw@gmail.com'
        };

        const { error } = await supabaseClient
            .from('exams')
            .insert([payload]);

        if (error) throw error;

        alert("Exam successfully published to class! Students can now access it from their portal.");
        const previewContainer = document.getElementById('teacher-exam-preview-container');
        if (previewContainer) previewContainer.classList.add('hidden');
        
    } catch (err) {
        console.error("Failed to publish exam:", err);
        alert("Failed to publish exam to database: " + (err.message || 'Unknown error'));
    }
};

window.discardExamDraft = function() {
    if (confirm("Are you sure you want to discard this exam draft?")) {
        const previewContainer = document.getElementById('teacher-exam-preview-container');
        if (previewContainer) previewContainer.classList.add('hidden');
    }
};
